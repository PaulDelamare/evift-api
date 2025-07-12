import { describe, it, expect, beforeEach } from 'bun:test';
import { InvitationServices } from './invitation.services';
import { throwError } from '../../lib/utils/errorHandler/errorHandler';

describe('InvitationServices.checkInvitation', () => {
     it('should return null when no invitation exists', async () => {
          const dbStub = {
               invitation: {
                    findFirst: async (args: any) => null,
               },
          };
          const service = new InvitationServices(dbStub as any);

          const result = await service.checkInvitation('request-1', 'user-1');
          expect(result).toBeNull();
     });

     it('should throw a 400 error when an invitation exists and checkAlreadyError is true', async () => {
          const mockInvitation = { id: 'inv-123', userId: 'user-1', requestId: 'request-1', createdAt: new Date() };
          const dbStub = {
               invitation: {
                    findFirst: async (args: any) => mockInvitation,
               },
          };
          const service = new InvitationServices(dbStub as any);

          expect(service.checkInvitation('request-1', 'user-1')).rejects.toMatchObject({
               status: 400,
               error: {
                    error: "Vous avez déjà envoyé une invitation !",
               },
          });
     });

     it('should return the invitation when it exists but checkAlreadyError is false', async () => {
          const mockInvitation = { id: 'inv-123', userId: 'user-1', requestId: 'request-1', createdAt: new Date() };
          const dbStub = {
               invitation: {
                    findFirst: async (args: any) => mockInvitation,
               },
          };
          const service = new InvitationServices(dbStub as any);

          const result = await service.checkInvitation('request-1', 'user-1', false);
          expect(result).toEqual(mockInvitation);
     });
});

describe('InvitationServices', () => {
     let service: InvitationServices;
     let dbStub: any;

     beforeEach(() => {
          dbStub = {
               invitation: {
                    findFirst: async () => null,
                    create: async () => null,
                    delete: async () => null,
               },
          };
          service = new InvitationServices(dbStub);
     });

     describe('checkInvitation', () => {
          it('should return null if no invitation exists', async () => {
               dbStub.invitation.findFirst = async () => null;
               const result = await (service as any).checkInvitation('req1', 'user1');
               expect(result).toBeNull();
          });

          it('should throw a 400 error if invitation exists and checkAlreadyError=true', async () => {
               const inv = { id: 'inv1', userId: 'user1', requestId: 'req1' };
               dbStub.invitation.findFirst = async () => inv;
               expect(
                    (service as any).checkInvitation('req1', 'user1')
               ).rejects.toMatchObject({
                    status: 400,
                    error: {
                         error: "Vous avez déjà envoyé une invitation !",
                    },
               });
          });

          it('should return the invitation if it exists and checkAlreadyError=false', async () => {
               const inv = { id: 'inv1', userId: 'user1', requestId: 'req1' };
               dbStub.invitation.findFirst = async () => inv;
               const result = await (service as any).checkInvitation('req1', 'user1', false);
               expect(result).toEqual(inv);
          });
     });

     describe('confirmInvitation', () => {
          it('should call addFriends then deleteInvitation', async () => {
               let added = false;
               let deletedId: string | null = null;

               service.friendsServices.addFriends = async (_a: string, _b: string) => {
                    added = true;
               };
               dbStub.invitation.delete = async ({ where }: any) => {
                    deletedId = where.id;
               };

               await (service as any).confirmInvitation('userA', 'userB', 'invX');

               expect(added).toBe(true);

               // @ts-ignore
               expect(deletedId).toBe('invX');
          });
     });


     describe('deleteInvitation', () => {
          it('should call db.invitation.delete with the correct ID', async () => {
               let receivedWhere: any = null;
               dbStub.invitation.delete = async (args: any) => {
                    receivedWhere = args.where;
               };

               await (service as any).deleteInvitation('inv-123');

               expect(receivedWhere).toEqual({ id: 'inv-123' });
          });
     });

     describe('createInvitation', () => {
          it('should call db.invitation.create with the correct parameters', async () => {
               let receivedData: any = null;
               dbStub.invitation.create = async ({ data }: any) => {
                    receivedData = data;
               };

               await (service as any).createInvitation('user1', 'req1');

               expect(receivedData).toEqual({ userId: 'user1', requestId: 'req1' });
          });
     });

     describe('invitationUser', () => {
          const target = 'target';
          const sender = 'sender';

          it('should throw if a user invites themselves', async () => {
               expect(service.invitationUser(sender, sender))
                    .rejects.toMatchObject({
                         status: 400,
                         error: {
                              error: "Vous ne pouvez pas vous inviter vous-même !",
                         },
                    });
          });

          it('should propagate the error if the target user does not exist', async () => {
               service.userServices.findUser = async () => { throw throwError(404, 'Not Found'); };
               expect(service.invitationUser(target, sender)).rejects.toMatchObject({
                    status: 404,
                    error: {
                         error: "Not Found",
                    },
               });
          });

          it('should propagate the error if already friends', async () => {
               service.userServices.findUser = async () => ({
                    id: target,
                    createdAt: new Date(),
                    email: 'target@example.com',
                    firstname: 'TargetFirst',
                    lastname: 'TargetLast'
               });
               service.friendsServices.checkAlreadyFriends = async () => { throw throwError(400, 'Déjà amis'); };
               expect(service.invitationUser(target, sender)).rejects.toMatchObject({
                    status: 400,
                    error: {
                         error: "Déjà amis",
                    },
               });
          });

          it('should confirm the invitation if a reverse invitation exists', async () => {
               service.userServices.findUser = async () => ({
                    id: target,
                    createdAt: new Date(),
                    email: 'target@example.com',
                    firstname: 'TargetFirst',
                    lastname: 'TargetLast'
               });
               service.friendsServices.checkAlreadyFriends = async () => null;
               let calls = 0;
               (service as any).checkInvitation = async (id: string, uid: string, chk: boolean) => {
                    calls++;
                    return calls === 2 ? { id: 'inv-inverse', userId: target, requestId: sender } : null;
               };
               let added = false, deleted = false;
               service.friendsServices.addFriends = async () => { added = true; };
               dbStub.invitation.delete = async () => { deleted = true; };

               const res = await service.invitationUser(target, sender);
               expect(res).toBe('Invitation confirmée !');
               expect(added).toBe(true);
               expect(deleted).toBe(true);
          });

          it('should send a new invitation otherwise', async () => {
               service.userServices.findUser = async () => ({
                    id: target,
                    email: 'target@example.com',
                    firstname: 'TargetFirst',
                    lastname: 'TargetLast',
                    createdAt: new Date()
               });
               service.friendsServices.checkAlreadyFriends = async () => null;
               (service as any).checkInvitation = async () => null;
               let created: any = null;
               dbStub.invitation.create = async ({ data }: any) => { created = data; };

               const res = await service.invitationUser(target, sender);
               expect(res).toBe('Invitation envoyée !');
               expect(created).toEqual({ userId: sender, requestId: target });
          });
     });

     describe('InvitationServices.findInvitations', () => {
          let service: InvitationServices;
          let dbStub: any;

          beforeEach(() => {
               dbStub = {
                    invitation: {
                         findMany: async () => [],
                    },
               };
               service = new InvitationServices(dbStub);
          });

          it('should return an array of invitations with user details', async () => {
               const now = new Date();
               const mockInvitations = [
                    {
                         id: 'inv1',
                         requestId: 'req1',
                         userId: 'user1',
                         createdAt: now,
                         user: {
                              id: 'user1',
                              email: 'u1@example.com',
                              firstname: 'Alice',
                              lastname: 'Dupont',
                         },
                    },
                    {
                         id: 'inv2',
                         requestId: 'req1',
                         userId: 'user2',
                         createdAt: now,
                         user: {
                              id: 'user2',
                              email: 'u2@example.com',
                              firstname: 'Bob',
                              lastname: 'Martin',
                         },
                    },
               ];
               dbStub.invitation.findMany = async (args: any) => {
                    expect(args.where).toEqual({ requestId: 'req1' });
                    expect(args.include).toEqual({
                         user: {
                              select: {
                                   id: true,
                                   email: true,
                                   firstname: true,
                                   lastname: true,
                              },
                         },
                    });
                    return mockInvitations;
               };

               const result = await service.findInvitations('req1');
               expect(result).toEqual(mockInvitations);
          });

          it('should return an empty array if no invitations are found', async () => {
               dbStub.invitation.findMany = async () => [];
               const result = await service.findInvitations('unknownReq');
               expect(result).toEqual([]);
          });
     });

     describe('InvitationServices.findInvitationById', () => {
          let service: InvitationServices;
          let dbStub: any;
          const now = new Date();
          const mockInv = { id: 'inv1', userId: 'u1', requestId: 'r1', createdAt: now };

          beforeEach(() => {
               dbStub = {
                    invitation: {
                         findFirst: async () => null,
                    },
               };
               service = new InvitationServices(dbStub);
          });

          it('should return the invitation if found', async () => {
               dbStub.invitation.findFirst = async (args: any) => {
                    expect(args.where).toEqual({ id: 'inv1' });
                    return mockInv;
               };

               const result = await service.findInvitationById('inv1');
               expect(result).toEqual(mockInv);
          });

          it('should throw a 404 error if not found and checkError=true', async () => {
               dbStub.invitation.findFirst = async () => null;
               expect(service.findInvitationById('absent')).rejects.toMatchObject({
                    status: 404,
                    error: {
                         error: "Invitation non trouvée",
                    },
               });
          });

          it('should return null if not found and checkError=false', async () => {
               dbStub.invitation.findFirst = async () => null;
               const result = await service.findInvitationById('absent', false);
               expect(result).toBeNull();
          });
     });

     describe('InvitationServices.acceptInvitation', () => {
          let service: InvitationServices;
          let dbStub: any;
          const mockInvitation = {
               id: 'inv1',
               userId: 'sender',
               requestId: 'receiver',
               createdAt: new Date()
          };

          beforeEach(() => {
               dbStub = { invitation: { delete: async () => null } };
               service = new InvitationServices(dbStub);
          });

          it('should throw an error if the invitation does not exist', async () => {
               service.findInvitationById = async () => null;
               expect(service.acceptInvitation('invX', 'receiver', true))
                    .rejects.toMatchObject({
                         status: 400,
                         error: {
                              error: "Vous ne pouvez pas réaliser cette action",
                         },
                    });
          });

          it('should throw an error if requestId does not match the provided userId', async () => {
               service.findInvitationById = async () => ({ ...mockInvitation, requestId: 'other' });
               expect(service.acceptInvitation('inv1', 'receiver', true))
                    .rejects.toMatchObject({
                         status: 400,
                         error: {
                              error: "Vous ne pouvez pas réaliser cette action",
                         },
                    });
          });

          it('should call checkAlreadyFriends then addFriends and deleteInvitation when accept=true', async () => {
               let checked = false;
               let added = false;
               let deleted = false;

               service.findInvitationById = async () => mockInvitation;
               service.friendsServices.checkAlreadyFriends = async (_userId: string, _id: string, _checkError?: boolean) => { checked = true; return null; };
               service.friendsServices.addFriends = async () => { added = true; };
               (service as any).deleteInvitation = async (_id: string) => { deleted = true; };

               await service.acceptInvitation('inv1', 'receiver', true);

               expect(checked).toBe(true);
               expect(added).toBe(true);
               expect(deleted).toBe(true);
          });

          it('should call checkAlreadyFriends and deleteInvitation only when accept=false', async () => {
               let checked = false;
               let added = false;
               let deleted = false;

               service.findInvitationById = async () => mockInvitation;
               service.friendsServices.checkAlreadyFriends = async (_userId: string, _id: string, _checkError?: boolean) => { checked = true; return null; };
               service.friendsServices.addFriends = async () => { added = true; };
               (service as any).deleteInvitation = async (_id: string) => { deleted = true; };

               await service.acceptInvitation('inv1', 'receiver', false);

               expect(checked).toBe(true);
               expect(added).toBe(false);
               expect(deleted).toBe(true);
          });
     });

     describe('EventInvitationServices', () => {
          let service: InvitationServices;
          let mockDb: any;

          beforeEach(() => {
               mockDb = {
                    invitation: {
                         count: async () => 0
                    }
               };
               service = new InvitationServices(mockDb as any);
          });

          describe('countNotification', () => {
               it('should return the number of notifications for a user', async () => {
                    const userId = 'user-123';
                    let calledWith: any = null;
                    mockDb.invitation.count = async (args: any) => {
                         calledWith = args;
                         return 4;
                    };

                    const result = await service.countNotification(userId);

                    expect(calledWith).toEqual({
                         where: { requestId: userId }
                    });
                    expect(result).toBe(4);
               });

               it('should return 0 if no notifications exist', async () => {
                    const userId = 'user-999';
                    let calledWith: any = null;
                    mockDb.invitation.count = async (args: any) => {
                         calledWith = args;
                         return 0;
                    };

                    const result = await service.countNotification(userId);

                    expect(calledWith).toEqual({
                         where: { requestId: userId }
                    });
                    expect(result).toBe(0);
               });
          });
     });
});
