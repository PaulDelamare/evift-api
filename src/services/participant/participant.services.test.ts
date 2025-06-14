import { describe, it, expect } from 'bun:test';
import type { Event, RoleEvent, User } from '@prisma/client';
import { ParticipantServices } from './participant.services';

describe('ParticipantServices.addNewParticipant', () => {
     it('should call db.participant.create with correct data', async () => {
          const captured: any = {};
          const dbStub = {
               participant: {
                    create: async ({ data }: any) => {
                         Object.assign(captured, data);
                         return;
                    }
               }
          };
          const service = new ParticipantServices(dbStub as any);
          const eventId: Event['id'] = "event-1234";
          const idUser: User['id'] = "user-5678";
          const idRole: RoleEvent['id'] = "role-91011";

          const result = await service.addNewParticipant(eventId, idUser, idRole);

          expect(captured).toEqual({
               id_event: eventId,
               id_user: idUser,
               id_role: idRole
          });
          expect(result).toBeUndefined();
     });

     it('should propagate errors from db.participant.create', async () => {
          const error = new Error('DB failure');
          const dbStub = {
               participant: {
                    create: async () => { throw error; }
               }
          };
          const service = new ParticipantServices(dbStub as any);

          expect(service.addNewParticipant("event-1234", "user-5678", "role-91011")).rejects.toThrow('DB failure');
     });
});

describe('ParticipantServices.findEventByUserIdAndEventId', () => {
     it('should call db.participant.findFirst with correct parameters', async () => {
          const mockParticipant = {
               id: 'participant-1',
               id_event: 'event-1234',
               id_user: 'user-5678',
               id_role: 'role-91011',
               createdAt: new Date(),
               updatedAt: new Date(),
               event: {
                    id: 'event-1234',
                    name: 'Test Event',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    description: 'Event description',
                    address: '123 Main St',
                    date: new Date(),
                    time: '12:00',
                    userId: 'user-5678'
               },
               roleRef: {
                    id: 'role-91011',
                    name: 'Attendee',
                    createdAt: new Date()
               }
          };

          const dbStub = {
               participant: {
                    findFirst: async (params: any) => {
                         expect(params.where).toEqual({
                              id_event: 'event-1234',
                              id_user: 'user-5678'
                         });
                         expect(params.include).toEqual({
                              event: true,
                              roleRef: true
                         });

                         return mockParticipant;
                    }
               }
          };

          const service = new ParticipantServices(dbStub as any);
          const idUser: User['id'] = 'user-5678';
          const idEvent: Event['id'] = 'event-1234';

          const result = await service.findEventByUserIdAndEventId(idUser, idEvent);

          expect(result).toEqual(mockParticipant);
     });

     it('should return null when no participant record is found', async () => {
          const dbStub = {
               participant: {
                    findFirst: async () => null
               }
          };

          const service = new ParticipantServices(dbStub as any);
          const idUser: User['id'] = 'user-5678';
          const idEvent: Event['id'] = 'event-1234';

          const result = await service.findEventByUserIdAndEventId(idUser, idEvent);

          expect(result).toBeNull();
     });

     it('should propagate errors from db.participant.findFirst', async () => {
          const error = new Error('DB failure');
          const dbStub = {
               participant: {
                    findFirst: async () => { throw error; }
               }
          };

          const service = new ParticipantServices(dbStub as any);
          const idUser: User['id'] = 'user-5678';
          const idEvent: Event['id'] = 'event-1234';

          expect(service.findEventByUserIdAndEventId(idUser, idEvent)).rejects.toThrow('DB failure');
     });
});

describe('ParticipantServices.findAllParticipantByEventId', () => {
     it('should call db.participant.findMany with correct parameters', async () => {
          const mockParticipants = [
               {
                    id: 'participant-1',
                    id_event: 'event-1234',
                    id_user: 'user-5678',
                    id_role: 'role-91011',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    user: {
                         id: 'user-5678',
                         email: 'user@example.com',
                         firstname: 'John',
                         lastname: 'Doe'
                    },
                    roleRef: { id: 'role-91011', name: 'Attendee', createdAt: new Date() }
               }
          ];

          const dbStub = {
               participant: {
                    findMany: async (params: any) => {
                         expect(params.where).toEqual({
                              id_event: 'event-1234'
                         });
                         expect(params.include).toEqual({
                              user: {
                                   select: {
                                        id: true,
                                        email: true,
                                        firstname: true,
                                        lastname: true
                                   }
                              },
                              roleRef: true
                         });
                         return mockParticipants;
                    }
               }
          };

          const service = new ParticipantServices(dbStub as any);
          const idEvent: Event['id'] = 'event-1234';

          const result = await service.findAllParticipantByEventId(idEvent);

          expect(result).toEqual(mockParticipants);
     });

     it('should return an empty array when no participants are found', async () => {
          const dbStub = {
               participant: {
                    findMany: async () => []
               }
          };

          const service = new ParticipantServices(dbStub as any);
          const idEvent: Event['id'] = 'event-1234';

          const result = await service.findAllParticipantByEventId(idEvent);

          expect(result).toEqual([]);
     });

     it('should propagate errors from db.participant.findMany', async () => {
          const error = new Error('DB failure');
          const dbStub = {
               participant: {
                    findMany: async () => { throw error; }
               }
          };

          const service = new ParticipantServices(dbStub as any);
          const idEvent: Event['id'] = 'event-1234';

          expect(service.findAllParticipantByEventId(idEvent)).rejects.toThrow('DB failure');
     });
});


describe('ParticipantServices.findOneParticipant', () => {
     it('should call db.participant.findFirst with correct parameters', async () => {
          const mockParticipant = {
               id: 'participant-1',
               id_event: 'event-1234',
               id_user: 'user-5678',
               id_role: 'role-91011',
               createdAt: new Date(),
               updatedAt: new Date(),
               roleRef: { id: 'role-91011', name: 'Attendee', createdAt: new Date() }
          };

          const dbStub = {
               participant: {
                    findFirst: async (params: any) => {
                         expect(params.where).toEqual({
                              id_event: 'event-1234',
                              id_user: 'user-5678'
                         });
                         expect(params.include).toEqual({
                              roleRef: true
                         });
                         return mockParticipant;
                    }
               }
          };

          const service = new ParticipantServices(dbStub as any);
          const idUser: User['id'] = 'user-5678';
          const idEvent: Event['id'] = 'event-1234';

          const result = await service.findOneParticipant(idUser, idEvent);

          expect(result).toEqual(mockParticipant);
     });

     it('should return null when no participant is found', async () => {
          const dbStub = {
               participant: {
                    findFirst: async () => null
               }
          };

          const service = new ParticipantServices(dbStub as any);
          const idUser: User['id'] = 'user-5678';
          const idEvent: Event['id'] = 'event-1234';

          const result = await service.findOneParticipant(idUser, idEvent);

          expect(result).toBeNull();
     });

     it('should propagate errors from db.participant.findFirst', async () => {
          const error = new Error('DB failure');
          const dbStub = {
               participant: {
                    findFirst: async () => { throw error; }
               }
          };

          const service = new ParticipantServices(dbStub as any);
          const idUser: User['id'] = 'user-5678';
          const idEvent: Event['id'] = 'event-1234';

          expect(service.findOneParticipant(idUser, idEvent)).rejects.toThrow('DB failure');
     });
});
