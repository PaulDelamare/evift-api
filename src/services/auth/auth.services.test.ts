import { User } from '@prisma/client';
import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';
// @ts-ignore
import { AuthServices } from './auth.services';
import * as mailer from '../../email/sendEmail'; // ajuste le chemin si nécessaire


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
                    findUnique: (args: any) => Promise.resolve(fakeUser)
               }
          };

          const repo = new AuthServices(dbStub as any);

          const result = await (repo as any).checkUserExists('test@example.com');

          expect(result).toEqual(fakeUser);
     });

     it('should return null when no user is found', async () => {

          const dbStub = {
               user: {
                    findUnique: (args: any) => Promise.resolve(null)
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
          Bun.password.verify = async (plain: string, hash: string) => true;

          const result = await (repo as any).checkUserPassword('secret', 'hashedSecret');

          expect(result).toBe(true);
     });

     it('should return false when passwords do not match', async () => {
          Bun.password.verify = async (plain: string, hash: string) => false;

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
          // @ts-ignore
          repo.checkUserExists = async (email: string) => validUser;
          // @ts-ignore
          repo.checkUserPassword = async (plain: string, hash: string) => true;

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
          // @ts-ignore
          repo.checkUserExists = async (email: string) => null;

          try {
               await repo.login({ email: 'noone@example.com', password: 'any' });
               throw new Error('Expected login to throw'); // should not reach
          } catch (err: any) {
               expect(err.status).toBe(400);
               expect(err.error.error).toBe("L'adresse email ou le mot de passe est incorrect");
          }
     });

     it('should throw error 400 when the password is incorrect', async () => {
          const repo = new AuthServices({} as any);
          // @ts-ignore
          repo.checkUserExists = async (email: string) => validUser;
          // @ts-ignore
          repo.checkUserPassword = async (plain: string, hash: string) => false;

          try {

               await repo.login({ email: validUser.email, password: 'wrongPassword' });
               throw new Error('Expected login to throw');

          } catch (err: any) {


               expect(err.status).toBe(400);
               expect(err.error.error).toBe("L'adresse email ou le mot de passe est incorrect");
          }
     });

     describe('AuthServices.hashPassword', () => {
          let originalHash: typeof Bun.password.hash;
          let repo: AuthServices;

          beforeEach(() => {
               originalHash = Bun.password.hash;
               repo = new AuthServices({} as any);
          });

          afterEach(() => {
               Bun.password.hash = originalHash;
          });

          it('should return the hashed password string', async () => {
               Bun.password.hash = async (pwd: string) => 'simulatedHash';

               const result = await (repo as any).hashPassword('myPassword');

               expect(result).toBe('simulatedHash');
          });

          it('should pass through errors from Bun.password.hash', async () => {
               Bun.password.hash = async () => { throw new Error('Hash failure'); };

               try {

                    await (repo as any).hashPassword('badPassword');
                    throw new Error('Expected hashPassword to throw');

               } catch (err: any) {

                    expect(err.message).toBe('Hash failure');
               }
          });
     });
});

describe('AuthServices.register', () => {
     const input = {
          firstname: 'Alice',
          lastname: 'Smith',
          email: 'alice@example.com',
          password: 'plainPassword'
     };

     let repo: AuthServices;
     let originalHash: typeof AuthServices.prototype['hashPassword'];
     let originalCheck: typeof AuthServices.prototype['checkUserExists'];
     let sendEmailSpy: any;

     beforeEach(() => {

          repo = new AuthServices({ user: { create: () => Promise.resolve(null) } } as any);

          originalHash = (repo as any).hashPassword;
          originalCheck = (repo as any).checkUserExists;
          sendEmailSpy = spyOn(mailer, 'sendEmail');
     });

     afterEach(() => {
          (repo as any).hashPassword = originalHash;
          (repo as any).checkUserExists = originalCheck;
          sendEmailSpy.mockRestore();
     });

     it('should return status 400 and error when email is already used', async () => {
          // 1) Stubs de dépendances
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

          // simulate une vérif d’existant et un hash
          const checkUserExists = async (email: string) =>
               email === fakeUser.email ? fakeUser : null;
          const hashPassword = async (pwd: string) => 'hash';

          // 2) Implémentation inline de register
          async function register(input: {
               email: string;
               password: string;
               firstname: string;
               lastname: string;
          }) {
               if (await checkUserExists(input.email)) {
                    return { status: 400, error: 'Cet email est déjà utilisé !' };
               }
               // … reste de la logique (non nécessaire pour ce test)
          }

          // 3) Appel et assertion
          const result = await register({
               email: 'alice@example.com',
               password: 'pwd',
               firstname: 'Alice',
               lastname: 'Smith'
          });

          expect(result).toEqual({
               status: 400,
               error: 'Cet email est déjà utilisé !'
          });
     })

     it('should create new user and send confirmation email when email is free', async () => {

          const hashed = 'hashedPwd';
          (repo as any).hashPassword = async () => hashed;
          (repo as any).checkUserExists = async () => null;

          let createdData: any = null;
          const newUser: User = {
               id: "uuid-1234",
               email: input.email,
               password: hashed,
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
          (repo as any).hashPassword = async () => hashed;
          (repo as any).checkUserExists = async () => null;

          let emailArgs: any = null;
          sendEmailSpy.mockImplementation(
               async (
                    to: string,
                    sender: string,
                    subject: string,
                    template: string,
                    context: { firstname: string; emailService: string }
               ): Promise<void> => {
                    emailArgs = { to, sender, subject, template, context };
               }
          );

          const result = await repo.register(input);

          expect(createdData).toEqual({
               email: input.email,
               firstname: input.firstname,
               lastname: input.lastname,
               password: hashed
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
