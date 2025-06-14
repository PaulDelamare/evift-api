import { Event, Participant } from "@prisma/client";
import { describe, it, expect, beforeEach } from 'bun:test';
import { ListEventServices } from './listEvent.services';

describe('ListEventServices.checkIfListInEvent', () => {
     const participantId: Participant['id'] = 'part-123';
     const eventId: Event['id'] = 'evt-456';

     it('should resolve when the participant has not added a gift yet', async () => {
          const dbStub = {
               listEvent: {
                    findFirst: async (args: any) => {
                         // Vérifier que la requête est bien construite
                         expect(args).toEqual({
                              where: {
                                   id_participant: participantId,
                                   id_event: eventId,
                              },
                         });
                         return null;
                    },
               },
          };
          const service = new ListEventServices(dbStub as any);

          expect(service.checkIfListInEvent(participantId, eventId)).resolves.toBeUndefined();
     });

     it('should throw a 401 error when the participant has already added a gift', async () => {
          const mockEntry = { id: 'le-1', id_participant: participantId, id_event: eventId };
          const dbStub = {
               listEvent: {
                    findFirst: async (args: any) => {
                         // Vérifier que la requête est bien construite
                         expect(args).toEqual({
                              where: {
                                   id_participant: participantId,
                                   id_event: eventId,
                              },
                         });
                         return mockEntry;
                    },
               },
          };
          const service = new ListEventServices(dbStub as any);

          expect(service.checkIfListInEvent(participantId, eventId))
               .rejects.toMatchObject({
                    status: 401,
                    error: {
                         error: 'Vous avez déja ajouter ce cadeaux à cet évènement',
                    },
               });
     });
});

describe('ListEventServices.addListEvent', () => {
     const userId = 'user-123';
     const eventId = 'event-456';
     const listId = 'list-789';

     it('should call db.listEvent.create with correct data and resolve', async () => {
          const dbStub = {
               listEvent: {
                    create: async (args: any) => {
                         expect(args).toEqual({
                              data: {
                                   id_event: eventId,
                                   id_list: listId,
                                   id_participant: userId,
                              },
                         });
                         return { id: 'le-1', id_event: eventId, id_list: listId, id_participant: userId };
                    },
               },
          };
          const service = new ListEventServices(dbStub as any);

          expect(service.addListEvent(userId, eventId, listId)).resolves.toBeUndefined();
     });

     it('should throw if db.listEvent.create fails', async () => {
          const dbStub = {
               listEvent: {
                    create: async () => { throw new Error('DB create error'); },
               },
          };
          const service = new ListEventServices(dbStub as any);

          expect(service.addListEvent(userId, eventId, listId))
               .rejects.toThrow('DB create error');
     });
});



describe('ListEventServices.findAllListEventByEventId', () => {
     const eventId = 'evt-1';
     const adminRoleId = 'role-admin';
     const giftRoleId = 'role-gift';
     const mockLists = [
          {
               id: 'le-1',
               id_event: eventId,
               id_list: 'list-1',
               id_participant: 'p-1',
               createdAt: new Date(),
               updatedAt: new Date(),
               list: {
                    id: 'list-1',
                    name: 'Liste Anniv',
                    id_user: 'user-123',
                    createdAt: new Date(),
                    updatedAt: new Date(),
               },
               participant: {
                    id: 'p-1',
                    id_user: 'user-123',
                    id_event: eventId,
                    id_role: 'role-admin',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    user: {
                         id: 'user-123',
                         firstname: 'John',
                         lastname: 'Doe',
                    },
               },
          },
     ];

     it('should fetch lists when both adminRoleId and giftRoleId are provided', async () => {
          const dbStub = {
               listEvent: {
                    findMany: async (args: any) => {
                         expect(args).toEqual({
                              where: {
                                   id_event: eventId,
                                   participant: {
                                        OR: [
                                             { id_role: adminRoleId },
                                             { id_role: giftRoleId },
                                        ],
                                   },
                              },
                              include: {
                                   list: true,
                                   participant: {
                                        include: {
                                             user: {
                                                  select: {
                                                       firstname: true,
                                                       lastname: true,
                                                       id: true,
                                                  },
                                             },
                                        },
                                   },
                              },
                         });
                         return mockLists;
                    },
               },
          };

          const service = new ListEventServices(dbStub as any);
          const result = await service.findAllListEventByEventId(eventId, adminRoleId, giftRoleId);
          expect(result).toEqual(mockLists);
     });

     it('should fetch lists when only adminRoleId is provided', async () => {
          const dbStub = {
               listEvent: {
                    findMany: async (args: any) => {
                         expect(args.where).toEqual({
                              id_event: eventId,
                              participant: {
                                   OR: [
                                        { id_role: adminRoleId },
                                   ],
                              },
                         });
                         return [];
                    },
               },
          };

          const service = new ListEventServices(dbStub as any);
          const result = await service.findAllListEventByEventId(eventId, adminRoleId, null);
          expect(result).toEqual([]);
     });

     it('should propagate error when db.findMany fails', async () => {
          const dbStub = {
               listEvent: {
                    findMany: async () => { throw new Error('DB failure'); },
               },
          };

          const service = new ListEventServices(dbStub as any);
          expect(service.findAllListEventByEventId(eventId, null, null))
               .rejects.toThrow('DB failure');
     });
});

describe('ListEventServices.findOneListByParticipantAndList', () => {
     const participantId = 'part-1';
     const listId = 'list-1';
     const mockEntry = {
          id: 'le-1',
          id_event: 'evt-1',
          id_participant: participantId,
          id_list: listId,
          createdAt: new Date(),
          updatedAt: new Date(),
     };

     it('should return the entry when found', async () => {
          const dbStub = {
               listEvent: {
                    findFirst: async (args: any) => {
                         expect(args).toEqual({
                              where: {
                                   id_participant: participantId,
                                   id_list: listId,
                              },
                         });
                         return mockEntry;
                    },
               },
          };
          const service = new ListEventServices(dbStub as any);
          const result = await service.findOneListByParticipantAndList(participantId, listId);
          expect(result).toEqual(mockEntry);
     });

     it('should throw 404 object when not found and requireList is true', async () => {
          const dbStub = {
               listEvent: {
                    findFirst: async () => null,
               },
          };
          const service = new ListEventServices(dbStub as any);
          expect(service.findOneListByParticipantAndList(participantId, listId))
               .rejects.toMatchObject({
                    status: 404,
                    error: { error: 'Liste de cadeaux introuvable' },
               });
     });

     it('should return null when not found and requireList is false', async () => {
          const dbStub = {
               listEvent: {
                    findFirst: async () => null,
               },
          };
          const service = new ListEventServices(dbStub as any);
          const result = await service.findOneListByParticipantAndList(participantId, listId, false);
          expect(result).toBeNull();
     });
});

describe('ListEventServices.removeListEvent', () => {
     const listEventId = 'le-123';

     it('should call db.listEvent.delete with correct where clause and resolve', async () => {
          const dbStub = {
               listEvent: {
                    delete: async (args: any) => {
                         expect(args).toEqual({ where: { id: listEventId } });
                         return { id: listEventId };
                    },
               },
          };
          const service = new ListEventServices(dbStub as any);

          expect(service.removeListEvent(listEventId)).resolves.toBeUndefined();
     });

     it('should propagate error when delete fails', async () => {
          const dbStub = {
               listEvent: {
                    delete: async () => { throw new Error('Delete failed'); },
               },
          };
          const service = new ListEventServices(dbStub as any);

          expect(service.removeListEvent(listEventId)).rejects.toThrow('Delete failed');
     });
});


describe('ListEventServices.findListById', () => {
     let service: ListEventServices;
     let mockPrisma: any;

     const listId = 'list-1';
     const mockListEvent = {
          id: listId,
          id_event: 'event-1',
          id_participant: 'participant-1',
          id_list: 'original-list-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          list: {
               id: 'original-list-1',
               name: 'Ma liste de cadeaux',
               id_user: 'user-1',
               createdAt: new Date(),
               updatedAt: new Date(),
               gifts: [
                    {
                         id: 'gift-1',
                         name: 'Livre',
                         price: 20,
                         url: 'http://example.com/book',
                         createdAt: new Date(),
                         updatedAt: new Date()
                    }
               ],
               user: {
                    firstname: 'Jean',
                    lastname: 'Dupont'
               }
          }
     };

     beforeEach(() => {
          const findFirstMock = (args: any) => {
               findFirstMock.lastCall = args;
               return findFirstMock.returnValue;
          };
          findFirstMock.returnValue = null;
          findFirstMock.lastCall = null;

          mockPrisma = {
               listEvent: {
                    findFirst: findFirstMock
               }
          };
          service = new ListEventServices(mockPrisma as any);
     });

     it('should return list event with related data when found', async () => {
          mockPrisma.listEvent.findFirst.returnValue = mockListEvent;

          const result = await service.findListById(listId);

          expect(mockPrisma.listEvent.findFirst.lastCall).toEqual({
               where: { id: listId },
               include: {
                    list: {
                         include: {
                              gifts: true,
                              user: {
                                   select: {
                                        lastname: true,
                                        firstname: true
                                   }
                              }
                         }
                    }
               }
          });

          expect(result).toMatchObject({
               ...mockListEvent,
               list: {
                    ...mockListEvent.list,
                    gifts: [
                         expect.objectContaining({
                              id: 'gift-1',
                              name: 'Livre',
                              price: 20,
                              url: 'http://example.com/book',
                         }),
                    ],
                    user: {
                         firstname: 'Jean',
                         lastname: 'Dupont',
                    },
               },
          });
     });

     it('should throw 404 error when list not found and requireList is true', async () => {
          mockPrisma.listEvent.findFirst.returnValue = null;

          expect(service.findListById(listId, true))
               .rejects.toMatchObject({
                    status: 404,
                    error: { error: 'Liste de cadeaux introuvable' }
               });
     });

     it('should return null when list not found and requireList is false', async () => {
          mockPrisma.listEvent.findFirst.returnValue = null;

          const result = await service.findListById(listId, false);
          expect(result).toBeNull();
     });

     it('should return null when list not found and requireList is not provided', async () => {
          mockPrisma.listEvent.findFirst.returnValue = null;

          const result = await service.findListById(listId);
          expect(result).toBeNull();
     });
});

describe('ListEventServices.findListByListIdAndEventId', () => {
     let service: ListEventServices;
     let mockPrisma: any;

     const listId = 'list-1';
     const eventId = 'event-1';
     const mockListEvent = {
          id: 'le-1',
          id_event: eventId,
          id_list: listId,
          id_participant: 'participant-1',
          createdAt: new Date(),
          updatedAt: new Date()
     };

     beforeEach(() => {
          // Création d'une fonction mock pour findFirst
          const findFirstMock = (args: any) => {
               findFirstMock.lastCall = args;
               return findFirstMock.returnValue;
          };
          findFirstMock.returnValue = null;
          findFirstMock.lastCall = null;

          mockPrisma = {
               listEvent: {
                    findFirst: findFirstMock
               }
          };
          service = new ListEventServices(mockPrisma as any);
     });

     it('should return list-event association when found', async () => {
          // Configure le mock pour retourner les données simulées
          mockPrisma.listEvent.findFirst.returnValue = mockListEvent;

          const result = await service.findListByListIdAndEventId(listId, eventId);

          // Vérifie que la méthode prisma a été appelée avec les bons paramètres
          expect(mockPrisma.listEvent.findFirst.lastCall).toEqual({
               where: {
                    id_list: listId,
                    id_event: eventId
               }
          });

          // Vérifie que le résultat correspond aux données simulées
          expect(result).toEqual(mockListEvent);
     });

     it('should throw 404 error when list-event not found and requireList is true', async () => {
          // Configure le mock pour renvoyer null (association non trouvée)
          mockPrisma.listEvent.findFirst.returnValue = null;

          // Teste que l'appel génère l'erreur attendue avec requireList=true (valeur par défaut)
          expect(service.findListByListIdAndEventId(listId, eventId))
               .rejects.toMatchObject({
                    status: 404,
                    error: { error: 'Liste de cadeaux introuvable' }
               });
     });

     it('should return null when list-event not found and requireList is false', async () => {
          // Configure le mock pour renvoyer null (association non trouvée)
          mockPrisma.listEvent.findFirst.returnValue = null;

          // Teste que l'appel renvoie null quand requireList=false
          const result = await service.findListByListIdAndEventId(listId, eventId, false);
          expect(result).toBeNull();
     });
});