import { describe, it, expect } from 'bun:test';
import { UserServices } from './user.services';
import { User } from '@prisma/client';

describe('UserServices.findUser', () => {
     it('should return the user object when found', async () => {
          const mockUser = {
               id: 'user-1234',
               email: 'test@example.com',
               firstname: 'John',
               lastname: 'Doe',
               createdAt: new Date(),
          };
          const dbStub = {
               user: {
                    findUnique: async (args: any) => mockUser,
               },
          };
          const service = new UserServices(dbStub as any);

          const result = await service.findUser('user-1234');

          expect(result).toEqual(mockUser);
     });

     it('should throw an error when no user is found and requireUser is true', async () => {
          const dbStub = {
               user: {
                    findUnique: async (args: any) => null,
               },
          };
          const service = new UserServices(dbStub as any);

          expect(service.findUser('non-existent')).rejects.toMatchObject({
               status: 404,
               error: {
                    error: "L'utilisateur n'a pas été trouvé",
               },
          });
     });

     it('should return null when no user is found and requireUser is false', async () => {
          const dbStub = {
               user: {
                    findUnique: async (args: any) => null,
               },
          };
          const service = new UserServices(dbStub as any);

          const result = await service.findUser('non-existent', false);

          expect(result).toBeNull();
     });
});

describe('UserServices.findUserByEmail', () => {
     it('should return the user object when found', async () => {
          const mockUser: Pick<User, 'id' | 'email' | 'firstname' | 'lastname'> = {
               id: 'user-123',
               email: 'foo@example.com',
               firstname: 'Foo',
               lastname: 'Bar',
          };

          const dbStub = {
               user: {
                    findUnique: async (args: any) => mockUser,
               },
          };

          const service = new UserServices(dbStub as any);
          const result = await service.findUserByEmail('foo@example.com');

          expect(result).toEqual(mockUser);
     });

     it('should return an error object with status 400 when not found', async () => {
          const dbStub = {
               user: {
                    findUnique: async (args: any) => null,
               },
          };

          const service = new UserServices(dbStub as any);
          const result = await service.findUserByEmail('missing@example.com');

          expect(result).toEqual({
               status: 400,
               error: "L'adresse email ou le mot de passe est incorrect",
          });
     });
});
