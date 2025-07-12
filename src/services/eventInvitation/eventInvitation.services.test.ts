// eventInvitation.services.test.ts
import { describe, it, expect, beforeEach } from 'bun:test';
import { EventInvitationServices } from './eventInvitation.services';
import { throwError } from '../../lib/utils/errorHandler/errorHandler';

describe('EventInvitationServices', () => {
     let service: EventInvitationServices;
     let dbStub: any;
     const organizer = 'org1';
     const eventId = 'evt1';
     const invitations = ['u1', 'u2'];

     beforeEach(() => {
          dbStub = {
               eventInvitation: {
                    count: async () => 0,
                    createMany: async () => null,
               },
          };
          service = new EventInvitationServices(dbStub);
     });

     describe('transformEventInvitationArray', () => {
          it('should transform an array of IDs into objects', () => {
               const res = service.transformEventInvitationArray(invitations, eventId, organizer);
               expect(res).toEqual([
                    { id_event: eventId, id_user: 'u1', id_organizer: organizer },
                    { id_event: eventId, id_user: 'u2', id_organizer: organizer },
               ]);
          });

          it('should return empty if no IDs', () => {
               expect(service.transformEventInvitationArray([], eventId, organizer)).toEqual([]);
          });
     });

     describe('checkUserAlreadyInvited', () => {
          it('should do nothing if the list is empty', async () => {
               expect(service.checkUserAlreadyInvited([], eventId)).resolves.toBeUndefined();
          });

          it('should throw if count > 0', async () => {
               dbStub.eventInvitation.count = async () => 3;
               expect(service.checkUserAlreadyInvited(invitations, eventId))
                    .rejects.toMatchObject({
                         status: 400,
                         error: {
                              error: 'Certains utilisateurs invités ont déjà été invités à cet événement',
                         },
                    });
          });

          it('should resolve if count = 0', async () => {
               dbStub.eventInvitation.count = async () => 0;
               expect(service.checkUserAlreadyInvited(invitations, eventId)).resolves.toBeUndefined();
          });
     });

     describe('createManyEventInvitation', () => {
          it('should call createMany with the correct data', async () => {
               let received: any = null;
               dbStub.eventInvitation.createMany = async ({ data }: any) => { received = data; };
               const data = service.transformEventInvitationArray(invitations, eventId, organizer);
               await service.createManyEventInvitation(data);
               expect(received).toEqual(data);
          });
     });

     describe('eventInvitation', () => {
          it('should throw 403 if organizer is not admin', async () => {
               // @ts-ignore
               (service.participantServices as any).findParticipantByUserIdAndEventId = async () => ({ roleRef: { name: 'member' } });
               expect(service.eventInvitation(invitations, organizer, eventId))
                    .rejects.toMatchObject({
                         status: 403,
                         error: {
                              error: "Vous n'avez pas le droit d'inviter des utilisateurs",
                         },
                    });
          });

          it(' lever 400 si un invité est déjà participant', async () => {
               // @ts-ignore
               (service.participantServices as any).findParticipantByUserIdAndEventId = async (u: string) =>
                    u === organizer
                         ? { roleRef: { name: 'admin' } }
                         : { id: 'p', roleRef: { name: 'member' } };

               // bypass friends stub
               (service.friendsServices as any).checkAlreadyFriends = async () => true;

               expect(service.eventInvitation(invitations, organizer, eventId))
                    .rejects.toMatchObject({
                         status: 400,
                         error: {
                              error: "Tous les utilisateurs invités ne sont pas autorisés à participer à cet événement",
                         },
                    });
          });

          it('should throw 400 if an invited user is not a friend', async () => {
               // @ts-ignore
               (service.participantServices as any).findParticipantByUserIdAndEventId = async (u: string) =>
                    u === organizer
                         ? { roleRef: { name: 'admin' } }
                         : null;

               // u1 ami, u2 pas ami
               (service.friendsServices as any).checkAlreadyFriends = async (_o: string, u: string) => u === 'u1';

               expect(service.eventInvitation(invitations, organizer, eventId))
                    .rejects.toMatchObject({
                         status: 400,
                         error: {
                              error: "Tous les utilisateurs invités ne sont pas vos amis",
                         },
                    });
          });

          it('should throw if already invited', async () => {
               // @ts-ignore
               (service.participantServices as any).findParticipantByUserIdAndEventId = async (u: string) =>
                    u === organizer
                         ? { roleRef: { name: 'admin' } }
                         : null;
               (service.friendsServices as any).checkAlreadyFriends = async () => true;
               dbStub.eventInvitation.count = async () => 1;

               await expect(service.eventInvitation(invitations, organizer, eventId))
                    .rejects.toMatchObject({
                         status: 400,
                         error: {
                              error: 'Certains utilisateurs invités ont déjà été invités à cet événement',
                         },
                    });
          });

          it('creates invitations when everything is OK', async () => {
               // @ts-ignore
               (service.participantServices as any).findParticipantByUserIdAndEventId = async (u: string) =>
                    u === organizer
                         ? { roleRef: { name: 'admin' } }
                         : null;
               (service.friendsServices as any).checkAlreadyFriends = async () => true;
               dbStub.eventInvitation.count = async () => 0;

               let createdData: any = null;
               dbStub.eventInvitation.createMany = async ({ data }: any) => { createdData = data; };

               expect(service.eventInvitation(invitations, organizer, eventId)).resolves.toBeUndefined();
               expect(createdData).toEqual([
                    { id_event: eventId, id_user: 'u1', id_organizer: organizer },
                    { id_event: eventId, id_user: 'u2', id_organizer: organizer },
               ]);
          });
     });

     describe('EventInvitationServices.getEventInvitations', () => {
          let service: EventInvitationServices;
          let dbStub: any;

          beforeEach(() => {
               dbStub = {
                    eventInvitation: {
                         findMany: async () => [],
                    },
               };
               service = new EventInvitationServices(dbStub);
          });

          it('should return an array of invitations with organizer and event included', async () => {
               const now = new Date();
               const mockInvitations = [
                    {
                         id: 'root1',
                         id_event: 'evt1',
                         id_user: 'user1',
                         id_organizer: 'org1',
                         createdAt: now,
                         idOrganizer: {
                              id: 'org1',
                              firstname: 'Jean',
                              lastname: 'Dupont',
                              email: 'jean.dupont@example.com',
                         },
                         event: {
                              id: 'evt1',
                              name: 'Fête',
                              description: 'Anniversaire',
                              address: 'Paris',
                              date: now,
                              time: '20:00',
                              userId: 'org1',
                              createdAt: now,
                              updatedAt: now,
                         },
                    },
                    {
                         id: 'root2',
                         id_event: 'evt2',
                         id_user: 'user1',
                         id_organizer: 'org2',
                         createdAt: now,
                         idOrganizer: {
                              id: 'org2',
                              firstname: 'Marie',
                              lastname: 'Martin',
                              email: 'marie.martin@example.com',
                         },
                         event: {
                              id: 'evt2',
                              name: 'Concert',
                              description: 'Musique live',
                              address: 'Lyon',
                              date: now,
                              time: null,
                              userId: 'org2',
                              createdAt: now,
                              updatedAt: now,
                         },
                    },
               ];

               dbStub.eventInvitation.findMany = async (args: any) => {
                    expect(args.where).toEqual({ id_user: 'user1' });
                    expect(args.include).toEqual({
                         idOrganizer: {
                              select: {
                                   id: true,
                                   firstname: true,
                                   lastname: true,
                                   email: true,
                              },
                         },
                         event: true,
                    });
                    return mockInvitations;
               };

               const result = await service.getEventInvitations('user1');
               expect(result).toEqual(mockInvitations);
          });

          it('should return an empty array if no invitations are found', async () => {
               dbStub.eventInvitation.findMany = async () => [];
               const result = await service.getEventInvitations('noUser');
               expect(result).toEqual([]);
          });
     });

     describe('EventInvitationServices.findEventInvitationByUserIdAndEventId', () => {
          let service: EventInvitationServices;
          let dbStub: any;
          const now = new Date();
          const mockInvitation = {
               id: 'inv1',
               id_user: 'user1',
               id_event: 'evt1',
               id_organizer: 'org1',
               createdAt: now,
               updatedAt: now,
          };

          beforeEach(() => {
               dbStub = {
                    eventInvitation: {
                         findFirst: async () => null,
                    },
               };
               service = new EventInvitationServices(dbStub);
          });

          it('should return the invitation if it exists', async () => {
               dbStub.eventInvitation.findFirst = async (args: any) => {
                    expect(args.where).toEqual({ id_user: 'user1', id_event: 'evt1' });
                    return mockInvitation;
               };

               const result = await service.findEventInvitationByUserIdAndEventId('user1', 'evt1');
               expect(result).toEqual(mockInvitation);
          });

          it('should throw a 404 error if not found and checkError=true', async () => {
               dbStub.eventInvitation.findFirst = async () => null;
               expect(
                    service.findEventInvitationByUserIdAndEventId('userX', 'evtX')
               ).rejects.toMatchObject({
                    status: 404,
                    error: {
                         error: 'Invitation introuvable',
                    },
               });
          });

          it('should return null if not found and checkError=false', async () => {
               dbStub.eventInvitation.findFirst = async () => null;
               const result = await service.findEventInvitationByUserIdAndEventId('userX', 'evtX', false);
               expect(result).toBeNull();
          });
     });

     describe('EventInvitationServices.responseEventInvitation', () => {
          let service: EventInvitationServices;
          let dbStub: any;
          const userId = 'user1';
          const eventId = 'evt1';
          const invitation = { id: 'inv1', id_user: userId, id_event: eventId };

          beforeEach(() => {
               dbStub = { eventInvitation: { /* not used here */ } };
               service = new EventInvitationServices(dbStub);
          });

          it('should throw an error if the invitation is not found', async () => {
               // @ts-ignore
               (service as any).findEventInvitationByUserIdAndEventId = async () => null;

               expect(service.responseEventInvitation(userId, eventId, true))
                    .rejects.toThrow();
          });

          it('should throw an error if the event is not found', async () => {
               // Stub invitation found
               // @ts-ignore
               (service as any).findEventInvitationByUserIdAndEventId = async () => invitation;
               // Stub event not found
               service.eventServices.findEventById = async () => { throw throwError(404, 'Événement introuvable'); };

               expect(service.responseEventInvitation(userId, eventId, true))
                    .rejects.toEqual({
                         status: 404,
                         error: {
                              error: 'Événement introuvable',
                         }
                    });
          });

          it('should accept the invitation (response=true)', async () => {
               let added = false;
               let deletedId: string | null = null;

               // @ts-ignore
               (service as any).findEventInvitationByUserIdAndEventId = async () => invitation;
               service.eventServices.findEventById = async () => ({ id: eventId } as any);
               service.roleEventServices.findRoleEvent = async (name: string) => ({
                    id: 'role-participant',
                    name,
                    createdAt: new Date(),
               });
               service.participantServices.addNewParticipant = async (_e: string, _u: string, _r: string) => {
                    added = true;
               };
               // @ts-ignore
               (service as any).deleteEventInvitation = async (id: string) => {
                    deletedId = id;
               };

               const result = await service.responseEventInvitation(userId, eventId, true);
               expect(result).toBe('Invitation acceptée');
               expect(added).toBe(true);

               // @ts-ignore
               expect(deletedId).toBe(invitation.id);
          });

          it('should refuse the invitation (response=false)', async () => {
               let added = false;
               let deletedId: string | null = null;
               let roleCalled = false;

               // @ts-ignore
               (service as any).findEventInvitationByUserIdAndEventId = async () => invitation;
               service.eventServices.findEventById = async () => ({ id: eventId } as any);
               service.roleEventServices.findRoleEvent = async (name: string) => {
                    roleCalled = true;
                    return { id: 'role-participant', name, createdAt: new Date() };
               };
               service.participantServices.addNewParticipant = async () => {
                    added = true;
               };
               // @ts-ignore
               (service as any).deleteEventInvitation = async (id: string) => {
                    deletedId = id;
               };

               const result = await service.responseEventInvitation(userId, eventId, false);
               expect(result).toBe('Invitation refusée');

               expect(added).toBe(false);

               // @ts-ignore
               expect(deletedId).toBe(invitation.id);
          });
     });

     describe("EventInvitationServices", () => {
          let service: EventInvitationServices;
          let mockInvitationServices: any;
          let mockDb: any;

          beforeEach(() => {
               // Mock manuel de l'invitationService et de Prisma
               mockInvitationServices = {
                    countNotification: async (userId: string) => {
                         if (userId === "user-1") return 3;
                         return 0;
                    }
               };

               mockDb = {
                    eventInvitation: {
                         count: async (args: any) => {
                              if (args.where.id_user === "user-1") return 2;
                              return 0;
                         }
                    }
               };

               service = new EventInvitationServices(mockDb as any);
               (service as any).invitationServices = mockInvitationServices;
          });

          it("should return the correct number of notifications for a given user", async () => {
               const result = await service.getInvitationNotifications("user-1");

               expect(result).toEqual({
                    countFriendsInvitation: 3,
                    countEventInvitation: 2
               });
          });

          it("should return 0 for each type of notification if no results", async () => {
               const result = await service.getInvitationNotifications("user-999");

               expect(result).toEqual({
                    countFriendsInvitation: 0,
                    countEventInvitation: 0
               });
          });
     });
});
