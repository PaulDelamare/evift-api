import { describe, it, expect, beforeEach } from 'bun:test';
import { GiftServices } from './gift.services';
import { Participant, RoleEvent } from '@prisma/client';
import { throwError } from '../../lib/utils/errorHandler/errorHandler';

class FakeParticipantServices {
     findParticipantByUserIdAndEventId = async (_user: string, _evt: string, _req: boolean, _roleRef: boolean, errorMsg?: string) => {
          throw throwError(401, errorMsg || "Vous ne participez pas à cet évènement");
     };
}
class FakeListGiftServices {
     findOneListGift = async (_id: string) => { };
}
class FakeListEventServices {
     checkIfListInEvent = async (_pid: string, _eid: string) => { };
     addListEvent = async (_pid: string, _eid: string, _lid: string) => { };
     findAllListEventByEventId = async (_evt: string, _aId: string | null, _gId: string | null) => { };
     findOneListByParticipantAndList = async (_pid: string, _lid: string) => { };
     removeListEvent = async (_leId: string) => { };
     findListById = async (_lid: string) => { };
     findListByListIdAndEventId = async (_lid: string, _eid: string) => { };
}

class FakeRoleEventServices {
     findRoleEvent = async (_name: string) => null;
}


describe('GiftServices.create', () => {
     const userId = 'user-123';
     const body = {
          name: 'Anniversaire',
          gifts: [
               { name: 'Cravate', quantity: 2, url: 'https://exemple.com/cravate' },
               { name: 'Montre', quantity: 1 },
          ],
     };

     it('should create a list with its gifts and return it', async () => {
          const now = new Date();
          const mockCreatedList = {
               id: 'list-1',
               name: body.name,
               id_user: userId,
               createdAt: now,
               updatedAt: now,
               gifts: [
                    {
                         id: 'gift-1',
                         name: 'Cravate',
                         quantity: 2,
                         url: 'https://exemple.com/cravate',
                         id_user: "user-123",
                         createdAt: now,
                         updatedAt: now,
                         id_list: 'list-1',
                         taken: false,
                         id_userTaken: null,
                    },
                    {
                         id: 'gift-2',
                         name: 'Montre',
                         quantity: 1,
                         url: '',
                         id_user: "user-123",
                         createdAt: now,
                         updatedAt: now,
                         id_list: 'list-1',
                         taken: false,
                         id_userTaken: null,
                    },
               ],
          };

          const dbStub = {
               listGift: {
                    create: async (args: any) => {
                         expect(args).toEqual({
                              data: {
                                   name: body.name,
                                   id_user: userId,
                                   gifts: {
                                        createMany: {
                                             data: [
                                                  {
                                                       name: 'Cravate',
                                                       quantity: 2,
                                                       url: 'https://exemple.com/cravate',
                                                       id_user: userId,
                                                  },
                                                  {
                                                       name: 'Montre',
                                                       quantity: 1,
                                                       url: '',
                                                       id_user: userId,
                                                  },
                                             ],
                                             skipDuplicates: true,
                                        },
                                   },
                              },
                              include: { gifts: true },
                         });
                         return mockCreatedList;
                    },
               },
          };

          const service = new GiftServices(dbStub as any);
          const result = await service.create(userId, body);

          expect(result).toEqual(mockCreatedList);
     });

     it('should throw if the database create fails', async () => {
          const dbStub = {
               listGift: {
                    create: async () => { throw new Error('DB error'); },
               },
          };
          const service = new GiftServices(dbStub as any);

          expect(service.create(userId, body)).rejects.toThrow('DB error');
     });
});

describe('GiftServices.findAll', () => {
     it('should return an array of lists with their gifts', async () => {
          const mockLists = [
               {
                    id: 'list-1',
                    name: 'Liste Anniv',
                    id_user: 'user-123',
                    createdAt: new Date('2025-06-01'),
                    updatedAt: new Date('2025-06-02'),
                    gifts: [
                         {
                              list: {
                                   id: 'list-1',
                                   name: 'Liste Anniv',
                                   id_user: 'user-123',
                                   createdAt: new Date('2025-06-01'),
                                   updatedAt: new Date('2025-06-02'),
                              },
                              name: 'Cravate',
                              url: 'https://ex.com/c',
                              createdAt: new Date('2025-06-01'),
                              id_list: 'list-1',
                              id_user: 'user-123',
                              quantity: 2,
                              id: 'gift-1',
                              updatedAt: new Date('2025-06-02'),
                              user: {
                                   firstname: 'Alice',
                                   lastname: 'A',
                                   email: 'alice@example.com',
                              },
                         },
                    ],
               },
          ];

          const dbStub = {
               listGift: {
                    findMany: async (args: any) => {
                         expect(args).toEqual({
                              where: { id_user: 'user-123' },
                              include: {
                                   gifts: {
                                        select: {
                                             list: true,
                                             name: true,
                                             url: true,
                                             createdAt: true,
                                             id_list: true,
                                             id_user: true,
                                             quantity: true,
                                             id: true,
                                             updatedAt: true,
                                             user: {
                                                  select: {
                                                       firstname: true,
                                                       lastname: true,
                                                       email: true,
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

          const service = new GiftServices(dbStub as any);
          const result = await service.findAll('user-123');
          expect(result).toEqual(mockLists);
     });

     it('should return an empty array when no lists are found', async () => {
          const dbStub = {
               listGift: {
                    findMany: async (args: any) => {
                         expect(args.where).toEqual({ id_user: 'unknown' });
                         return [];
                    },
               },
          };

          const service = new GiftServices(dbStub as any);
          const result = await service.findAll('unknown');
          expect(result).toEqual([]);
     });
});

describe('GiftServices.addListEvent', () => {
     let service: GiftServices;
     let participantServices: FakeParticipantServices;
     let listGiftServices: FakeListGiftServices;
     let listEventServices: FakeListEventServices;

     const userId = 'user-1';
     const eventId = 'evt-1';
     const listId = 'list-1';

     beforeEach(() => {
          service = new GiftServices({} as any);
          participantServices = new FakeParticipantServices();
          listGiftServices = new FakeListGiftServices();
          listEventServices = new FakeListEventServices();

          (service as any).participantServices = participantServices;
          (service as any).listGiftServices = listGiftServices;
          (service as any).listEventServices = listEventServices;
     });

     it('should throw 401 object if participant not found', async () => {
          expect(service.addListEvent(userId, eventId, listId))
               .rejects.toMatchObject({
                    status: 401,
                    error: { error: 'Vous ne participez pas à cet évènement' },
               });
     });

     it('should throw 401 object if participant role is not admin or gift', async () => {
          (participantServices.findParticipantByUserIdAndEventId as any) = async () => ({
               id: 'p1',
               roleRef: { name: 'viewer' },
          } as Participant & any);

          expect(service.addListEvent(userId, eventId, listId))
               .rejects.toMatchObject({
                    status: 401,
                    error: { error: 'Vous ne pouvez pas ajouter des cadeaux à cet évènement' },
               });
     });

     it('should call sub-services in order when participant valid', async () => {
          (participantServices.findParticipantByUserIdAndEventId as any) = async () => ({
               id: 'p2',
               roleRef: { name: 'admin' },
          } as Participant & any);

          let step = 0;
          (listGiftServices.findOneListGift as any) = async (lid: string) => {
               expect(lid).toBe(listId);
               step++;
          };
          (listEventServices.checkIfListInEvent as any) = async (pid: string, eid: string) => {
               expect(pid).toBe('p2'); expect(eid).toBe(eventId);
               step++;
          };
          (listEventServices.addListEvent as any) = async (pid: string, eid: string, lid: string) => {
               expect(pid).toBe('p2'); expect(eid).toBe(eventId); expect(lid).toBe(listId);
               step++;
          };

          expect(service.addListEvent(userId, eventId, listId)).resolves.toBeUndefined();
          expect(step).toBe(3);
     });

     it('should propagate error from findOneListGift', async () => {
          (participantServices.findParticipantByUserIdAndEventId as any) = async () => ({
               id: 'p3',
               roleRef: { name: 'gift' },
          } as Participant & any);
          (listGiftServices.findOneListGift as any) = async () => { throw new Error('FG error'); };

          expect(service.addListEvent(userId, eventId, listId))
               .rejects.toThrow('FG error');
     });

     it('should propagate error from checkIfListInEvent', async () => {
          (participantServices.findParticipantByUserIdAndEventId as any) = async () => ({
               id: 'p4',
               roleRef: { name: 'gift' },
          } as Participant & any);
          (listGiftServices.findOneListGift as any) = async () => { };
          (listEventServices.checkIfListInEvent as any) = async () => { throw new Error('CI error'); };

          expect(service.addListEvent(userId, eventId, listId))
               .rejects.toThrow('CI error');
     });

     it('should propagate error from addListEvent', async () => {
          (participantServices.findParticipantByUserIdAndEventId as any) = async () => ({
               id: 'p5',
               roleRef: { name: 'admin' },
          } as Participant & any);
          (listGiftServices.findOneListGift as any) = async () => { };
          (listEventServices.checkIfListInEvent as any) = async () => { };
          (listEventServices.addListEvent as any) = async () => { throw new Error('AE error'); };

          expect(service.addListEvent(userId, eventId, listId))
               .rejects.toThrow('AE error');
     });
});

describe('GiftServices.findListEvent', () => {
     let service: GiftServices;
     let participantServices: FakeParticipantServices;
     let roleEventServices: FakeRoleEventServices;
     let listEventServices: FakeListEventServices;

     const userId = 'user-1';
     const eventId = 'evt-1';

     beforeEach(() => {
          service = new GiftServices({} as any);
          participantServices = new FakeParticipantServices();
          roleEventServices = new FakeRoleEventServices();
          listEventServices = new FakeListEventServices();

          (service as any).participantServices = participantServices;
          (service as any).roleEventServices = roleEventServices;
          (service as any).listEventServices = listEventServices;
     });

     it('should return list events on success', async () => {

          (participantServices.findParticipantByUserIdAndEventId as any) = async () => ({
               id: 'participant-1',
               roleRef: { name: 'admin' }
          });

          const adminRole: RoleEvent = { id: 'r-admin', name: 'admin', createdAt: new Date() };
          const giftRole: RoleEvent = { id: 'r-gift', name: 'gift', createdAt: new Date() };
          const mockLists = [
               {
                    id: 'le-1',
                    id_event: eventId,
                    id_list: 'list-1',
                    id_participant: userId,
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
                         id: 'participant-1',
                         id_user: userId,
                         createdAt: new Date(),
                         updatedAt: new Date(),
                         id_event: eventId,
                         id_role: 'role-1',
                         user: {
                              id: userId,
                              firstname: 'John',
                              lastname: 'Doe',
                         },
                    },
               }
          ];

          (roleEventServices.findRoleEvent as any) = async (name: string) =>
               name === 'admin' ? adminRole : giftRole;
          (listEventServices.findAllListEventByEventId as any) = async (
               evt: string, aId: string | null, gId: string | null
          ) => {
               expect(evt).toBe(eventId);
               expect(aId).toBe(adminRole.id);
               expect(gId).toBe(giftRole.id);
               return mockLists;
          };

          const result = await service.findListEvent(userId, eventId);
          expect(result).toEqual(mockLists);
     });

     it('should throw 401 if user does not participate', async () => {
          const errMsg = 'Vous ne participez pas à cet évènement';
          (participantServices.findParticipantByUserIdAndEventId as any) = async () => {
               throw throwError(401, errMsg);
          };

          expect(service.findListEvent(userId, eventId))
               .rejects.toMatchObject({ status: 401, error: { error: errMsg } });
     });

     it('should propagate error from findRoleEvent', async () => {
          (participantServices.findParticipantByUserIdAndEventId as any) = async () => { };
          (roleEventServices.findRoleEvent as any) = async () => {
               throw new Error('Role lookup failure');
          };

          expect(service.findListEvent(userId, eventId))
               .rejects.toThrow('Role lookup failure');
     });

     it('should propagate error from findAllListEventByEventId', async () => {
          (participantServices.findParticipantByUserIdAndEventId as any) = async () => { };
          (roleEventServices.findRoleEvent as any) = async () => ({ id: 'x', name: 'admin', createdAt: new Date() });
          (listEventServices.findAllListEventByEventId as any) = async () => {
               throw new Error('DB query failed');
          };

          expect(service.findListEvent(userId, eventId))
               .rejects.toThrow('DB query failed');
     });
});


describe('GiftServices.removeListEvent', () => {
     let service: GiftServices;
     let participantServices: FakeParticipantServices;
     let listEventServices: FakeListEventServices;

     const userId = 'user-1';
     const eventId = 'evt-1';
     const listId = 'list-1';
     const participant: Participant & any = { id: 'p-1', roleRef: { name: 'gift' } };

     beforeEach(() => {
          service = new GiftServices({} as any);
          participantServices = new FakeParticipantServices();
          listEventServices = new FakeListEventServices();

          (service as any).participantServices = participantServices;
          (service as any).listEventServices = listEventServices;
     });

     it('should throw 401 object if participant not found', async () => {

          expect(service.removeListEvent(userId, eventId, listId))
               .rejects.toMatchObject({
                    status: 401,
                    error: { error: 'Vous ne pouvez pas enlever des cadeaux à cet évènement' },
               });
     });

     it('should propagate error from findOneListByParticipantAndList', async () => {

          (participantServices.findParticipantByUserIdAndEventId as any) = async () => participant;

          (listEventServices.findOneListByParticipantAndList as any) = async () => {
               throw throwError(404, 'Liste de cadeaux introuvable');
          };

          expect(service.removeListEvent(userId, eventId, listId))
               .rejects.toMatchObject({
                    status: 404,
                    error: { error: 'Liste de cadeaux introuvable' },
               });
     });

     it('should call removeListEvent when participant and entry exist', async () => {
          (participantServices.findParticipantByUserIdAndEventId as any) = async () => participant;
          const fakeEntry = { id: 'le-1', id_participant: participant.id, id_list: listId };
          (listEventServices.findOneListByParticipantAndList as any) = async () => fakeEntry;

          let calledWith: string = '';
          (listEventServices.removeListEvent as any) = async (leId: string) => {
               calledWith = leId;
          };

          expect(service.removeListEvent(userId, eventId, listId)).resolves.toBeUndefined();
          expect(calledWith).toBe(fakeEntry.id);
     });

     it('should propagate error from removeListEvent', async () => {
          (participantServices.findParticipantByUserIdAndEventId as any) = async () => participant;
          (listEventServices.findOneListByParticipantAndList as any) = async () => ({ id: 'le-2' });
          (listEventServices.removeListEvent as any) = async () => {
               throw new Error('Delete failed');
          };

          expect(service.removeListEvent(userId, eventId, listId))
               .rejects.toThrow('Delete failed');
     });
});

describe('GiftServices.findList', () => {
     let service: GiftServices;
     let participantServices: FakeParticipantServices;
     let listEventServices: FakeListEventServices;

     const userId = 'user-1';
     const listId = 'list-1';
     const eventId = 'evt-1';

     const mockListEvent = {
          id: 'le-1',
          id_event: eventId,
          id_list: 'original-list-1',
          id_participant: 'participant-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          list: {
               id: 'original-list-1',
               name: 'Liste Anniversaire',
               id_user: 'user-123',
               createdAt: new Date(),
               updatedAt: new Date(),
               gifts: [
                    {
                         id: 'gift-1',
                         name: 'Livre',
                         price: 20,
                         url: 'http://example.com/book',
                         createdAt: new Date(),
                         updatedAt: new Date(),
                         id_list: 'original-list-1',
                         id_user: 'user-123',
                         taken: false,
                         id_userTaken: null,
                         quantity: 1
                    }
               ],
               user: {
                    firstname: 'Jean',
                    lastname: 'Dupont',
               }
          }
     };
     beforeEach(() => {
          service = new GiftServices({} as any);
          participantServices = new FakeParticipantServices();
          listEventServices = new FakeListEventServices();

          (service as any).participantServices = participantServices;
          (service as any).listEventServices = listEventServices;
     });

     it('should return list when user has permission', async () => {
          (listEventServices.findListById as any) = async () => mockListEvent;
          (participantServices.findParticipantByUserIdAndEventId as any) = async () => ({
               id: 'participant-1',
               roleRef: { name: 'admin' }
          });

          const result = await service.findList(userId, listId);

          expect(result).toEqual(mockListEvent);
     });

     it('should throw 404 if list is not found', async () => {
          (listEventServices.findListById as any) = async () => null;

          expect(service.findList(userId, listId))
               .rejects.toThrow(TypeError);
     });

     it('should propagate error from findListById', async () => {
          (listEventServices.findListById as any) = async () => {
               throw new Error('List lookup failure');
          };

          await expect(service.findList(userId, listId))
               .rejects.toThrow('List lookup failure');
     });

     it('should throw 401 if user does not have permission', async () => {
          const errMsg = 'Vous ne pouvez pas voir la liste de cadeaux';

          (listEventServices.findListById as any) = async () => mockListEvent;
          (participantServices.findParticipantByUserIdAndEventId as any) = async () => {
               throw throwError(401, errMsg);
          };

          expect(service.findList(userId, listId))
               .rejects.toMatchObject({
                    status: 401,
                    error: { error: errMsg }
               });
     });

     it('should propagate error from findParticipantByUserIdAndEventId', async () => {
          (listEventServices.findListById as any) = async () => mockListEvent;
          (participantServices.findParticipantByUserIdAndEventId as any) = async () => {
               throw new Error('Participant lookup failure');
          };

          expect(service.findList(userId, listId))
               .rejects.toThrow('Participant lookup failure');
     });
});

describe('GiftServices.findGiftById', () => {
    let service: GiftServices;
    let mockPrisma: any;
    
    const giftId = 'gift-1';
    const mockGift = {
        id: giftId,
        name: 'Livre',
        price: 20,
        url: 'http://example.com/book',
        id_list: 'list-1',
        id_user: 'user-1',
        taken: false,
        id_userTaken: null,
        quantity: 1,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    beforeEach(() => {
        const findFirstMock = (args: any) => {
            findFirstMock.lastCall = args;
            return findFirstMock.returnValue;
        };
        findFirstMock.returnValue = null;
        findFirstMock.lastCall = null;

        mockPrisma = {
            gifts: {
                findFirst: findFirstMock
            }
        };
        service = new GiftServices(mockPrisma as any);
    });

    it('should return gift when found', async () => {
        mockPrisma.gifts.findFirst.returnValue = mockGift;

        const result = await service.findGiftById(giftId);
        
        expect(mockPrisma.gifts.findFirst.lastCall).toEqual({
            where: {
                id: giftId
            }
        });

        expect(result).toEqual(mockGift);
    });

    it('should throw 404 error when gift not found and requireGift is true', async () => {
        mockPrisma.gifts.findFirst.returnValue = null;

         expect(service.findGiftById(giftId))
            .rejects.toMatchObject({
                status: 404,
                error: { error: 'Cadeau introuvable' }
            });
    });

    it('should return null when gift not found and requireGift is false', async () => {
        mockPrisma.gifts.findFirst.returnValue = null;

        const result = await service.findGiftById(giftId, false);
        expect(result).toBeNull();
    });
});

describe('GiftServices.checkGift', () => {
    let service: GiftServices;
    let mockPrisma: any;
    let participantServices: FakeParticipantServices;
    let listEventServices: FakeListEventServices;
    
    const userId = 'user-1';
    const eventId = 'event-1';
    const giftId = 'gift-1';
    const listId = 'list-1';
    
    const mockGift = {
        id: giftId,
        name: 'Livre',
        price: 20,
        url: 'http://example.com/book',
        id_list: listId,
        id_user: 'owner-1',
        taken: false,
        id_userTaken: null,
        quantity: 1,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    beforeEach(() => {
        const updateMock = (args: any) => {
            updateMock.lastCall = args;
            return updateMock.returnValue;
        };
        updateMock.returnValue = mockGift;
        updateMock.lastCall = null;

        mockPrisma = {
            gifts: {
                update: updateMock
            }
        };
        
        service = new GiftServices(mockPrisma as any);
        participantServices = new FakeParticipantServices();
        listEventServices = new FakeListEventServices();

        (service as any).participantServices = participantServices;
        (service as any).listEventServices = listEventServices;
        
        (service.findGiftById as any) = async () => null;
    });

    it('should mark gift as taken when checked=true', async () => {
        (service.findGiftById as any) = async () => mockGift;
        
        (listEventServices.findListByListIdAndEventId as any) = async () => ({
            id: 'le-1',
            id_event: eventId,
            id_list: listId
        });
        
        (participantServices.findParticipantByUserIdAndEventId as any) = async () => ({
            id: 'participant-1',
            roleRef: { name: 'viewer' }
        });

        await service.checkGift(userId, eventId, giftId, true);

        expect(mockPrisma.gifts.update.lastCall).toEqual({
            where: { id: giftId },
            data: {
                taken: true,
                id_userTaken: userId
            }
        });
    });

    it('should mark gift as not taken when checked=false', async () => {
        (service.findGiftById as any) = async () => mockGift;
        
        (listEventServices.findListByListIdAndEventId as any) = async () => ({
            id: 'le-1',
            id_event: eventId,
            id_list: listId
        });
        
        (participantServices.findParticipantByUserIdAndEventId as any) = async () => ({
            id: 'participant-1',
            roleRef: { name: 'viewer' }
        });

        await service.checkGift(userId, eventId, giftId, false);

        expect(mockPrisma.gifts.update.lastCall).toEqual({
            where: { id: giftId },
            data: {
                taken: false,
                id_userTaken: null
            }
        });
    });

    it('should propagate error from findGiftById', async () => {
        (service.findGiftById as any) = async () => {
            throw throwError(404, 'Cadeau introuvable');
        };

        expect(service.checkGift(userId, eventId, giftId, true))
            .rejects.toMatchObject({
                status: 404,
                error: { error: 'Cadeau introuvable' }
            });
    });

    it('should propagate error from findListByListIdAndEventId', async () => {
        (service.findGiftById as any) = async () => mockGift;
        
        (listEventServices.findListByListIdAndEventId as any) = async () => {
            throw throwError(404, 'Liste de cadeaux introuvable');
        };

        expect(service.checkGift(userId, eventId, giftId, true))
            .rejects.toMatchObject({
                status: 404,
                error: { error: 'Liste de cadeaux introuvable' }
            });
    });

    it('should propagate error from findParticipantByUserIdAndEventId', async () => {
        (service.findGiftById as any) = async () => mockGift;
        
        (listEventServices.findListByListIdAndEventId as any) = async () => ({
            id: 'le-1',
            id_event: eventId,
            id_list: listId
        });
        
        (participantServices.findParticipantByUserIdAndEventId as any) = async () => {
            throw throwError(401, 'Vous ne pouvez pas voir la liste de cadeaux');
        };

        expect(service.checkGift(userId, eventId, giftId, true))
            .rejects.toMatchObject({
                status: 401,
                error: { error: 'Vous ne pouvez pas voir la liste de cadeaux' }
            });
    });

    it('should propagate error from gifts.update', async () => {
        (service.findGiftById as any) = async () => mockGift;
        
        (listEventServices.findListByListIdAndEventId as any) = async () => ({
            id: 'le-1',
            id_event: eventId,
            id_list: listId
        });
        
        (participantServices.findParticipantByUserIdAndEventId as any) = async () => ({
            id: 'participant-1',
            roleRef: { name: 'viewer' }
        });
        
        mockPrisma.gifts.update = async () => {
            throw new Error('Update failed');
        };

        expect(service.checkGift(userId, eventId, giftId, true))
            .rejects.toThrow('Update failed');
    });
});

describe('GiftServices.deleteGift', () => {
	it('should call db.gifts.delete with the correct where clause', async () => {
		let calledWith: any = null;
		const dbStub = {
			gifts: {
				delete: async (args: any) => {
					calledWith = args;
				}
			}
		};
		const service = new GiftServices(dbStub as any);

		await service.deleteGift('gift-123', 'user-456');

		expect(calledWith).toEqual({
			where: { id: 'gift-123', id_user: 'user-456' }
		});
	});
});

describe('GiftServices.deleteList', () => {
	it('should call db.listGift.delete with the correct where clause', async () => {
		let calledWith: any = null;
		const dbStub = {
			listGift: {
				delete: async (args: any) => {
					calledWith = args;
				}
			}
		};
		const service = new GiftServices(dbStub as any);

		await service.deleteList('list-789', 'user-456');

		expect(calledWith).toEqual({
			where: { id: 'list-789', id_user: 'user-456' }
		});
	});
});

describe('GiftServices.addGift', () => {
	it('should transform body.gifts into data array and call createMany', async () => {
		const body = {
			id: 'list-123',
			gifts: [
				{ name: 'Teddy', quantity: 2, url: 'http://toy.com/teddy' },
				{ name: 'Ball', quantity: 1, url: null }
			]
		};
		let calledWith: any = null;
		const dbStub = {
			gifts: {
				createMany: async (args: any) => {
					calledWith = args;
					return { count: args.data.length };
				}
			}
		};
		const service = new GiftServices(dbStub as any);

		const result = await service.addGift(body, 'user-999');

		// Vérifie le retour
		expect(result).toEqual({ count: 2 });

		// Vérifie la transformation des données
		expect(calledWith).toEqual({
			data: [
				{
					name: 'Teddy',
					quantity: 2,
					url: 'http://toy.com/teddy',
					id_user: 'user-999',
					id_list: 'list-123'
				},
				{
					name: 'Ball',
					quantity: 1,
					url: '',
					id_user: 'user-999',
					id_list: 'list-123'
				}
			],
			skipDuplicates: true
		});
	});
});


