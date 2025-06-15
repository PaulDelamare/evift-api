import { Friends } from '@prisma/client';
import { describe, it, expect, beforeEach } from 'bun:test';
import { FriendsServices } from './friends.services';

describe('FriendsServices.findAll', () => {

     it('should return transformed friends when the user is user1', async () => {
          const mockFriend: Friends & { user: any; user2: any } = {
               id: 'friend-1',
               user1Id: 'user-123',
               user2Id: 'user-456',
               created_at: new Date('2025-01-01'),
               user: { id: 'user-123', email: 'u1@example.com', firstname: 'Alice', lastname: 'A' },
               user2: { id: 'user-456', email: 'u2@example.com', firstname: 'Bob', lastname: 'B' },
          };
          const dbStub = {
               friends: {
                    findMany: async (_args: any) => [mockFriend],
               },
          };
          const service = new FriendsServices(dbStub as any);

          const result = await service.findAll('user-123');

          expect(result).toEqual([
               {
                    id: 'friend-1',
                    createdAt: new Date('2025-01-01'),
                    userId: 'user-456',
                    user: mockFriend.user2,
               },
          ]);
     });

     it('should return transformed friends when the user is user2', async () => {
          const mockFriend: Friends & { user: any; user2: any } = {
               id: 'friend-2',
               user1Id: 'user-789',
               user2Id: 'user-321',
               created_at: new Date('2025-02-02'),
               user: { id: 'user-789', email: 'u3@example.com', firstname: 'Carol', lastname: 'C' },
               user2: { id: 'user-321', email: 'u4@example.com', firstname: 'Dave', lastname: 'D' },
          };
          const dbStub = {
               friends: {
                    findMany: async (_args: any) => [mockFriend],
               },
          };
          const service = new FriendsServices(dbStub as any);

          const result = await service.findAll('user-321');

          expect(result).toEqual([
               {
                    id: 'friend-2',
                    createdAt: new Date('2025-02-02'),
                    userId: 'user-789',
                    user: mockFriend.user,
               },
          ]);
     });

     it('should return an empty array when no friends are found', async () => {
          const dbStub = {
               friends: {
                    findMany: async (_args: any) => [],
               },
          };
          const service = new FriendsServices(dbStub as any);

          const result = await service.findAll('nonexistent-user');

          expect(result).toEqual([]);
     });
});


describe('FriendsServices.transformFriendsArray', () => {
     const service = new FriendsServices({} as any);

     it('should map friend when current user is user1', async () => {
          const input: Array<Friends & { user: any; user2: any }> = [{
               id: 'f-1',
               user1Id: 'u-1',
               user2Id: 'u-2',
               created_at: new Date('2025-03-03'),
               user: { id: 'u-1', email: 'a@example.com', firstname: 'Alice', lastname: 'A' },
               user2: { id: 'u-2', email: 'b@example.com', firstname: 'Bob', lastname: 'B' },
          }];

          // @ts-ignore accéder à la méthode privée
          const result = await (service as any).transformFriendsArray(input, 'u-1');

          expect(result).toEqual([{
               id: 'f-1',
               createdAt: new Date('2025-03-03'),
               userId: 'u-2',
               user: input[0].user2,
          }]);
     });

     it('should map friend when current user is user2', async () => {
          const input: Array<Friends & { user: any; user2: any }> = [{
               id: 'f-2',
               user1Id: 'u-3',
               user2Id: 'u-4',
               created_at: new Date('2025-04-04'),
               user: { id: 'u-3', email: 'c@example.com', firstname: 'Carol', lastname: 'C' },
               user2: { id: 'u-4', email: 'd@example.com', firstname: 'Dave', lastname: 'D' },
          }];

          // @ts-ignore accéder à la méthode privée
          const result = await (service as any).transformFriendsArray(input, 'u-4');

          expect(result).toEqual([{
               id: 'f-2',
               createdAt: new Date('2025-04-04'),
               userId: 'u-3',
               user: input[0].user,
          }]);
     });

     it('should return undefined when no user match', async () => {
          const input: Array<Friends & { user: any; user2: any }> = [{
               id: 'f-3',
               user1Id: 'u-5',
               user2Id: 'u-6',
               created_at: new Date('2025-05-05'),
               user: { id: 'u-5', email: 'e@example.com', firstname: 'Eve', lastname: 'E' },
               user2: { id: 'u-6', email: 'f@example.com', firstname: 'Frank', lastname: 'F' },
          }];

          // @ts-ignore accéder à la méthode privée
          const result = await (service as any).transformFriendsArray(input, 'u-unknown');

          expect(result).toEqual([undefined]);
     });
});

describe('FriendsServices.checkAlreadyFriends', () => {
     it('should resolve when no friendship exists and default checkError is true', async () => {
          const dbStub = {
               friends: {
                    findFirst: async (args: any) => null,
               },
          };
          const service = new FriendsServices(dbStub as any);

            expect(service.checkAlreadyFriends('userA', 'userB')).resolves.toBeNull();
     });

     it('should throw a 400 error when friendship exists and checkError is true', async () => {
          const mockFriend = { user1Id: 'userA', user2Id: 'userB' };
          const dbStub = {
               friends: {
                    findFirst: async (args: any) => mockFriend,
               },
          };
          const service = new FriendsServices(dbStub as any);

          expect(service.checkAlreadyFriends('userA', 'userB')).rejects.toMatchObject({
               status: 400,
               error: {
                    error: "Vous êtes déjà amis avec cet utilisateur",
               },
          });
     });

     it('should resolve when friendship exists but checkError is false', async () => {
          const mockFriend = { user1Id: 'userA', user2Id: 'userB' };
          const dbStub = {
               friends: {
                    findFirst: async (args: any) => mockFriend,
               },
          };
          const service = new FriendsServices(dbStub as any);

          // @ts-ignore
          expect(service.checkAlreadyFriends('userA', 'userB', false)).resolves.toEqual({
               user1Id: 'userA',
               user2Id: 'userB',
          });
     });
});


describe('FriendsServices.addFriends', () => {
     let service: FriendsServices;
     let dbStub: any;

     beforeEach(() => {
          dbStub = {
               friends: {
                    create: async (args: any) => null,
               },
          };
          service = new FriendsServices(dbStub);
     });

     it('🚀 devrait appeler db.friends.create avec user1Id et user2Id corrects', async () => {
          let receivedData: any = null;
          dbStub.friends.create = async ({ data }: any) => {
               receivedData = data;
               return { id: 'new-friend', ...data };
          };

          await service.addFriends('userA', 'userB');

          expect(receivedData).toEqual({
               user1Id: 'userA',
               user2Id: 'userB',
          });
     });

     it('🚀 devrait résoudre la promesse sans renvoyer de valeur', async () => {
          // Par défaut, create renvoie null, donc addFriends doit simplement résoudre
          expect(service.addFriends('userX', 'userY')).resolves.toBeUndefined();
     });
});

