import { describe, it, expect } from 'bun:test';
import type { Event, User } from '@prisma/client';
import { EventServices } from './event.services';

describe('EventServices.create', () => {
     it('should create an event, add admin participant and return the new event id', async () => {
          const createdEvent: Event = {
               id: 'evt123',
               name: 'Test Event',
               description: 'Desc',
               date: new Date('2025-06-10'),
               time: '10:00',
               address: '123 Street',
               userId: 'user1',
               createdAt: new Date(),
               updatedAt: new Date(),
          };

          const dbStub = {
               event: {
                    create: async ({ data }: any) => {
                         return createdEvent;
                    }
               }
          };
          const service = new EventServices(dbStub as any);

          service.roleEventServices = {
               findRoleEvent: async (name: string) => ({ id: 'roleAdmin', name, description: '', createdAt: new Date(), updatedAt: new Date() })
          } as any;
          let participantArgs: any = null;

          service.participantServices = {
               addNewParticipant: async (eventId: string, userId: string, roleId: string) => {
                    participantArgs = { eventId, userId, roleId };
               }
          } as any;

          const resultId = await service.create('user1', {
               name: createdEvent.name,
               description: createdEvent.description,
               date: createdEvent.date,
               time: createdEvent.time ?? '',
               address: createdEvent.address
          });

          expect(resultId).toBe(createdEvent.id);
          expect(participantArgs).toEqual({
               eventId: createdEvent.id,
               userId: 'user1',
               roleId: 'roleAdmin'
          });
     });

     it('should propagate error when roleEventServices.findRoleEvent returns null', async () => {

          const dbStub = {
               event: { create: async () => ({ id: 'evt', name: '', description: '', date: new Date(), time: '', address: '', userId: '', createdAt: new Date(), updatedAt: new Date() }) }
          };
          const service = new EventServices(dbStub as any);
          service.roleEventServices = {
               findRoleEvent: async () => null
          } as any;
          service.participantServices = { addNewParticipant: async () => { } } as any;

          expect(service.create('user1', {
               name: 'n',
               description: 'd',
               date: new Date(),
               time: '',
               address: ''
          })).rejects.toThrow();
     });

     it('should propagate error from participantServices.addNewParticipant', async () => {
          const createdEvent = { id: 'e2', name: '', description: '', date: new Date(), time: '', address: '', userId: '', createdAt: new Date(), updatedAt: new Date() };
          const dbStub = { event: { create: async () => createdEvent } };
          const service = new EventServices(dbStub as any);
          service.roleEventServices = {
               findRoleEvent: async () => ({ id: 'r2', name: 'admin', description: '', createdAt: new Date(), updatedAt: new Date() })
          } as any;
          service.participantServices = {
               addNewParticipant: async () => { throw new Error('DB fail'); }
          } as any;

          expect(service.create('user2', {
               name: 'n', description: 'd', date: new Date(), time: '', address: ''
          })).rejects.toThrow('DB fail');
     });
});

describe('ParticipantServices.findAllUserEvent', () => {
     it('should call db.participant.findMany with correct parameters and return events', async () => {
          const now = new Date();
          const mockUserId: User['id'] = 'user-5678';
          const mockEvents = [
               {
                    id: 'participant-1',
                    id_user: mockUserId,
                    id_event: 'event-1',
                    id_role: 'role-1',
                    createdAt: now,
                    updatedAt: now,
                    event: {
                         id: 'event-1',
                         name: 'Event Name',
                         description: 'Event Description',
                         address: 'Event Address',
                         date: new Date(now.getTime() + 1000 * 60 * 60 * 24),
                         time: '12:00',
                         userId: 'user-admin',
                         createdAt: now,
                         updatedAt: now,
                         user: {
                              id: 'user-admin',
                              email: 'admin@example.com',
                              firstname: 'Admin',
                              lastname: 'User'
                         }
                    },
                    user: {
                         id: mockUserId,
                         email: 'user@example.com',
                         firstname: 'John',
                         lastname: 'Doe'
                    }
               }
          ];

          let paramsCaptured: any;
          const dbStub = {
               participant: {
                    findMany: async (params: any) => {
                         paramsCaptured = params;
                         return mockEvents;
                    }
               }
          };

          const service = new EventServices(dbStub as any);

          const result = await service.findAllUserEvent(mockUserId);

          expect(paramsCaptured.where).toHaveProperty('event');
          expect(paramsCaptured.where).toHaveProperty('id_user', mockUserId);
          expect(paramsCaptured.orderBy).toEqual({
               event: {
                    date: 'asc'
               }
          });
          expect(paramsCaptured.include).toEqual({
               user: {
                    select: {
                         id: true,
                         email: true,
                         firstname: true,
                         lastname: true
                    }
               },
               event: {
                    include: {
                         user: {
                              select: {
                                   id: true,
                                   email: true,
                                   firstname: true,
                                   lastname: true
                              }
                         }
                    }
               }
          });
          expect(Array.isArray(result)).toBe(true);
          expect(result).toEqual(mockEvents);
     });

     it('should return an empty array if no events are found', async () => {
          const dbStub = {
               participant: {
                    findMany: async () => []
               }
          };
          const service = new EventServices(dbStub as any);
          const mockUserId: User['id'] = 'user-5678';

          const result = await service.findAllUserEvent(mockUserId);

          expect(result).toEqual([]);
     });

     it('should propagate errors from db.participant.findMany', async () => {
          const dbStub = {
               participant: {
                    findMany: async () => { throw new Error('DB fail'); }
               }
          };
          const service = new EventServices(dbStub as any);
          const mockUserId: User['id'] = 'user-5678';

          expect(service.findAllUserEvent(mockUserId)).rejects.toThrow('DB fail');
     });
});

describe('EventServices.findOneEvent', () => {
     it('should return the event if the user is a participant', async () => {
          const mockEvent = {
               id: 'participant-1',
               id_user: 'user-123',
               id_event: 'event-1',
               id_role: 'role-1',
               createdAt: new Date(),
               updatedAt: new Date(),
               event: {
                    id: 'event-1',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    name: 'Event Name',
                    description: 'Event Description',
                    address: 'Event Address',
                    date: new Date(),
                    time: '12:00',
                    userId: 'user-123'
               },
               roleRef: {
                    id: 'role-1',
                    createdAt: new Date(),
                    name: 'Admin'
               }
          };
          const participantServicesStub = {
               findEventByUserIdAndEventId: async (id_user: string, id_event: string) => {
                    expect(id_user).toBe('user-123');
                    expect(id_event).toBe('event-1');
                    return mockEvent;
               }
          };
          const service = new EventServices({} as any);
          service.participantServices = participantServicesStub as any;

          const result = await service.findOneEvent('user-123', 'event-1');
          expect(result).toBe(mockEvent);
     });

     it('should throw an error if the user is not a participant or event does not exist', async () => {
          const participantServicesStub = {
               findEventByUserIdAndEventId: async () => null
          };
          const service = new EventServices({} as any);
          service.participantServices = participantServicesStub as any;

          expect(service.findOneEvent('user-123', 'event-1')).rejects.toMatchObject({
               status: 404,
               error: {
                    error: "Événement introuvable ou vous n'êtes pas un participant de cet événement",
               },
          });
     });
});


describe('EventServices.getAllParticipantsForEvent', () => {
     it('should return all participants if user is a participant', async () => {
          const mockEvent = { id_event: 'event-1', id_user: 'user-123' };
          const now = new Date();
          const mockParticipants = [
               {
                    id: 'participant-1',
                    id_event: 'event-1',
                    id_user: 'user-123',
                    id_role: 'role-1',
                    createdAt: now,
                    updatedAt: now,
                    roleRef: { id: 'role-1', createdAt: now, name: 'Admin' },
                    user: {
                         id: 'user-123',
                         email: 'user123@example.com',
                         firstname: 'John',
                         lastname: 'Doe'
                    }
               },
               {
                    id: 'participant-2',
                    id_event: 'event-1',
                    id_user: 'user-456',
                    id_role: 'role-2',
                    createdAt: now,
                    updatedAt: now,
                    roleRef: { id: 'role-2', createdAt: now, name: 'Member' },
                    user: {
                         id: 'user-456',
                         email: 'user456@example.com',
                         firstname: 'Jane',
                         lastname: 'Smith'
                    }
               }
          ];

          const participantServicesStub = {
               findEventByUserIdAndEventId: async (id_user: string, id_event: string) => {
                    expect(id_user).toBe('user-123');
                    expect(id_event).toBe('event-1');
                    return mockEvent;
               },
               findAllParticipantByEventId: async (id_event: string) => {
                    expect(id_event).toBe('event-1');
                    return mockParticipants;
               }
          };

          const service = new EventServices({} as any);
          service.participantServices = participantServicesStub as any;

          const result = await service.getAllParticipantsForEvent('user-123', 'event-1');
          expect(result).toBe(mockParticipants);
     });

     it('should throw an error if the user is not a participant or event does not exist', async () => {
          const participantServicesStub = {
               findEventByUserIdAndEventId: async () => null,
               findAllParticipantByEventId: async () => []
          };

          const service = new EventServices({} as any);
          service.participantServices = participantServicesStub as any;

          expect(service.getAllParticipantsForEvent('user-123', 'event-1'))
               .rejects.toMatchObject({
                    status: 404,
                    error: {
                         error: "Événement introuvable ou vous n'êtes pas un participant de cet événement",
                    },
               });
     });
});

describe('EventServices.updateParticipant', () => {
     const validatedData = {
          id_event: 'event-1',
          id_user: 'target-user',
          id_role: 'new-role-id'
     };
     const adminRole = { id: 'admin-role-id', name: 'admin' };
     const requesterParticipant = {
          id: 'requester-participant-id',
          id_event: 'event-1',
          id_user: 'admin-user',
          roleRef: { id: 'admin-role-id', name: 'admin' }
     };
     const targetParticipant = {
          id: 'target-participant-id',
          id_event: 'event-1',
          id_user: 'target-user',
          roleRef: { id: 'user-role-id', name: 'user' }
     };

     it('should update the participant role if requester is admin and target is not admin', async () => {
          let updateCalledWith: any = undefined;
          const participantServicesStub = {
               findOneParticipant: async (userId: string, eventId: string) => {
                    if (userId === 'admin-user') return requesterParticipant;
                    if (userId === 'target-user') return targetParticipant;
                    return null;
               }
          };
          const roleEventServicesStub = {
               findRoleEvent: async (roleName: string) => {
                    expect(roleName).toBe('admin');
                    return adminRole;
               }
          };
          const dbStub = {
               participant: {
                    update: async (params: any) => {
                         updateCalledWith = params;
                         return;
                    }
               }
          };

          const service = new EventServices(dbStub as any);
          service.participantServices = participantServicesStub as any;
          service.roleEventServices = roleEventServicesStub as any;

          await service.updateParticipant(validatedData, 'admin-user');
          expect(updateCalledWith).toEqual({
               where: { id: targetParticipant.id },
               data: { id_role: validatedData.id_role }
          });
     });

     it('should throw 403 if requester is not a participant or not admin', async () => {
          const participantServicesStub = {
               findOneParticipant: async (userId: string, eventId: string) => {
                    if (userId === 'admin-user') return null; // not a participant
                    if (userId === 'target-user') return targetParticipant;
                    return null;
               }
          };
          const roleEventServicesStub = {
               findRoleEvent: async () => adminRole
          };
          const dbStub = {
               participant: { update: async () => { } }
          };

          const service = new EventServices(dbStub as any);
          service.participantServices = participantServicesStub as any;
          service.roleEventServices = roleEventServicesStub as any;

          expect(service.updateParticipant(validatedData, 'admin-user'))
               .rejects.toMatchObject({
                    status: 403,
                    error: {
                         error: "Vous n\'avez pas les droits pour modifier le rôle d\'un participant",
                    },
               });;
     });

     it('should throw 404 if target participant not found', async () => {
          const participantServicesStub = {
               findOneParticipant: async (userId: string, eventId: string) => {
                    if (userId === 'admin-user') return requesterParticipant;
                    if (userId === 'target-user') return null;
                    return null;
               }
          };
          const roleEventServicesStub = {
               findRoleEvent: async () => adminRole
          };
          const dbStub = {
               participant: { update: async () => { } }
          };

          const service = new EventServices(dbStub as any);
          service.participantServices = participantServicesStub as any;
          service.roleEventServices = roleEventServicesStub as any;

          expect(service.updateParticipant(validatedData, 'admin-user'))
               .rejects.toMatchObject({
                    status: 404,
                    error: {
                         error: "Participant introuvable pour cet événement",
                    },
               });
     });

     it('should throw 403 if target participant is admin', async () => {
          const adminTarget = {
               ...targetParticipant,
               roleRef: { id: 'admin-role-id', name: 'admin' }
          };
          const participantServicesStub = {
               findOneParticipant: async (userId: string, eventId: string) => {
                    if (userId === 'admin-user') return requesterParticipant;
                    if (userId === 'target-user') return adminTarget;
                    return null;
               }
          };
          const roleEventServicesStub = {
               findRoleEvent: async () => adminRole
          };
          const dbStub = {
               participant: { update: async () => { } }
          };

          const service = new EventServices(dbStub as any);
          service.participantServices = participantServicesStub as any;
          service.roleEventServices = roleEventServicesStub as any;

          expect(service.updateParticipant(validatedData, 'admin-user'))
               .rejects.toMatchObject({
                    status: 403,
                    error: {
                         error: "Vous ne pouvez pas modifier le rôle d'un administrateur",
                    },
               });
     });

     it('should propagate errors from db.participant.update', async () => {
          const participantServicesStub = {
               findOneParticipant: async (userId: string, eventId: string) => {
                    if (userId === 'admin-user') return requesterParticipant;
                    if (userId === 'target-user') return targetParticipant;
                    return null;
               }
          };
          const roleEventServicesStub = {
               findRoleEvent: async () => adminRole
          };
          const dbStub = {
               participant: {
                    update: async () => { throw new Error('DB error'); }
               }
          };

          const service = new EventServices(dbStub as any);
          service.participantServices = participantServicesStub as any;
          service.roleEventServices = roleEventServicesStub as any;

          await expect(service.updateParticipant(validatedData, 'admin-user')).rejects.toThrow('DB error');
     });
});
