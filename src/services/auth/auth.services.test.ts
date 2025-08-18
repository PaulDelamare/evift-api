import { mock } from "bun:test";

// Mock AVANT d'importer le service pour que la fonction soit remplacée
mock.module("../../lib/utils/hashPassword/hashPassword", () => ({
     hashPassword: async () => "hashedPwd"
}));

import { User } from '@prisma/client';
import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { AuthServices } from './auth.services';
import * as mailer from '../../email/sendEmail';

describe('AuthServices.checkUserExists', () => {
     it('should return the user object when found', async () => {
          const fakeUser: User = {
               id: "uuid",
               email: 'test@example.com',
               password: 'hashedpassword',
               firstname: 'John',
               lastname: 'Doe',
               createdAt: new Date(),
               updatedAt: new Date(),
               firstLogin: false
          };

          const dbStub = {
               user: {
                    findUnique: () => Promise.resolve(fakeUser)
               }
          };

          const repo = new AuthServices(dbStub as any);
          const result = await (repo as any).checkUserExists('test@example.com');
          expect(result).toEqual(fakeUser);
     });

     it('should return null when no user is found', async () => {
          const dbStub = {
               user: {
                    findUnique: () => Promise.resolve(null)
               }
          };

          const repo = new AuthServices(dbStub as any);
          const result = await (repo as any).checkUserExists('nouser@example.com');
          expect(result).toBeNull();
     });
});

describe('AuthServices.checkUserPassword', () => {
     let originalVerify: typeof Bun.password.verify;
     let repo: AuthServices;

     beforeEach(() => {
          originalVerify = Bun.password.verify;
          repo = new AuthServices({} as any);
     });

     afterEach(() => {
          Bun.password.verify = originalVerify;
     });

     it('should return true when passwords match', async () => {
          Bun.password.verify = async () => true;
          const result = await (repo as any).checkUserPassword('secret', 'hashedSecret');
          expect(result).toBe(true);
     });

     it('should return false when passwords do not match', async () => {
          Bun.password.verify = async () => false;
          const result = await (repo as any).checkUserPassword('wrong', 'hashedSecret');
          expect(result).toBe(false);
     });
});

describe('AuthServices.login', () => {
     const validUser: User = {
          id: "uuid-1234",
          email: 'john.doe@example.com',
          password: 'hashedPassword',
          firstname: 'John',
          lastname: 'Doe',
          createdAt: new Date(),
          updatedAt: new Date(),
          firstLogin: false
     };

     it('should return the user object without the password on successful login', async () => {
          const repo = new AuthServices({} as any);
          (repo as any).checkUserExists = async () => validUser;
          (repo as any).checkUserPassword = async () => true;

          const result = await repo.login({ email: validUser.email, password: 'plainPassword' });

          expect(result).toEqual({
               id: validUser.id,
               email: validUser.email,
               firstname: validUser.firstname,
               lastname: validUser.lastname,
               createdAt: validUser.createdAt,
               updatedAt: validUser.updatedAt,
               firstLogin: validUser.firstLogin
          });
     });

     it('should throw error 400 when the user does not exist', async () => {
          const repo = new AuthServices({} as any);
          (repo as any).checkUserExists = async () => null;

          try {
               await repo.login({ email: 'noone@example.com', password: 'any' });
               throw new Error('Expected login to throw');
          } catch (err: any) {
               expect(err.status).toBe(400);
               expect(err.error.error).toBe("L'adresse email ou le mot de passe est incorrect");
          }
     });

     it('should throw error 400 when the password is incorrect', async () => {
          const repo = new AuthServices({} as any);
          (repo as any).checkUserExists = async () => validUser;
          (repo as any).checkUserPassword = async () => false;

          try {
               await repo.login({ email: validUser.email, password: 'wrongPassword' });
               throw new Error('Expected login to throw');
          } catch (err: any) {
               expect(err.status).toBe(400);
               expect(err.error.error).toBe("L'adresse email ou le mot de passe est incorrect");
          }
     });
});

describe('AuthServices.register', () => {
     let repo: AuthServices;
     let sendEmailSpy: any;

     beforeEach(() => {
          repo = new AuthServices({ user: { create: () => Promise.resolve(null) } } as any);
          sendEmailSpy = spyOn(mailer, 'sendEmail');
     });

     afterEach(() => {
          sendEmailSpy.mockRestore();
     });

     it('should return status 400 and error when email is already used', async () => {
          const fakeUser = {
               id: 'uuid-1234',
               email: 'alice@example.com',
               password: 'hash',
               firstname: 'Alice',
               lastname: 'Smith',
               createdAt: new Date(),
               updatedAt: new Date(),
               firstLogin: false
          };

          (repo as any).checkUserExists = async (email: string) =>
               email === fakeUser.email ? fakeUser : null;

          try {
               await repo.register({
                    email: 'alice@example.com',
                    password: 'pwd',
                    firstname: 'Alice',
                    lastname: 'Smith'
               });
               throw new Error('Should have thrown'); // ne doit jamais passer ici
          } catch (err) {
               console.info('💥 Caught in test:', err);
               expect(err).toMatchObject({
                    status: 400,
                    error: { error: 'Cet email est déjà utilisé !' }
               });
          }
     });


     it('should create new user and send confirmation email when email is free', async () => {
          const input = {
               email: "alice@example.com",
               firstname: "Alice",
               lastname: "Smith",
               password: "myPwd"
          };

          let createdData: any = null;
          const newUser: User = {
               id: "uuid-1234",
               email: input.email,
               password: "hashedPwd",
               firstname: input.firstname,
               lastname: input.lastname,
               createdAt: new Date('2025-06-01T00:00:00Z'),
               updatedAt: new Date('2025-06-01T00:00:00Z'),
               firstLogin: true
          };

          repo = new AuthServices({
               user: {
                    create: async ({ data }: any) => {
                         createdData = data;
                         return newUser;
                    }
               }
          } as any);

          (repo as any).checkUserExists = async () => null;

          let emailArgs: any = null;
          interface SendEmailArgs {
               to: string;
               sender: string;
               subject: string;
               template: string;
               context: Record<string, any>;
          }

          sendEmailSpy.mockImplementation(
               async (
                    to: string,
                    sender: string,
                    subject: string,
                    template: string,
                    context: Record<string, any>
               ): Promise<void> => {
                    emailArgs = { to, sender, subject, template, context } as SendEmailArgs;
               }
          );

          const result = await repo.register(input);

          expect(createdData).toEqual({
               email: input.email,
               firstname: input.firstname,
               lastname: input.lastname,
               password: "hashedPwd" // vient bien du mock
          });

          expect(emailArgs).toEqual({
               to: input.email,
               sender: process.env.EMAIL_SENDER!,
               subject: "Création d'un compte Evift",
               template: 'validateEmail/validate-success',
               context: {
                    firstname: newUser.firstname,
                    emailService: process.env.EMAIL_SERVICE
               }
          });

          expect(result).toBeUndefined();
     });
});
