import { RoleEvent } from '@prisma/client';
import { describe, it, expect } from 'bun:test';
import { RoleEventServices } from './roleEvent.services';

describe('RoleEventServices.findRoleEvent', () => {
     it('should return the event object when found', async () => {
          const mockEvent: RoleEvent = {
               id: "uuid-1234",
               name: 'LaunchParty',
               createdAt: new Date()
          };
          const dbStub = {
               roleEvent: {
                    findFirst: async (args: any) => mockEvent
               }
          };
          const service = new RoleEventServices(dbStub as any);

          const result = await service.findRoleEvent('LaunchParty');

          expect(result).toEqual(mockEvent);
     });

     it('should return null when no event is found', async () => {
          const dbStub = {
               roleEvent: {
                    findFirst: async (args: any) => null
               }
          };
          const service = new RoleEventServices(dbStub as any);

          const result = await service.findRoleEvent('NonExistent');

          expect(result).toBeNull();
     });
});

describe('RoleServices.create', () => {
     it('should call db.roleEvent.create with the correct data', async () => {
          let receivedArgs: any = null;

          const dbStub = {
               roleEvent: {
                    create: async (args: any) => {
                         receivedArgs = args;
                         return { id: 'uuid-1', name: args.data.name, createdAt: new Date() };
                    },
               },
          };

          const service = new RoleEventServices(dbStub as any);
          await service.create('MyRole');

          expect(receivedArgs).toEqual({
               data: {
                    name: 'MyRole',
               },
          });
     });

     it('should propagate errors from db.roleEvent.create', async () => {
          const dbStub = {
               roleEvent: {
                    create: async () => {
                         throw new Error('DB Error');
                    },
               },
          };

          const service = new RoleEventServices(dbStub as any);

          expect(service.create('RoleX')).rejects.toThrow('DB Error');
     });
});


describe('RoleServices.findAll', () => {
     it('should return an array of role events when DB returns data', async () => {
          const mockRoles: RoleEvent[] = [
               { id: 'uuid-1', name: 'Admin', createdAt: new Date() },
               { id: 'uuid-2', name: 'User', createdAt: new Date() },
          ];

          const dbStub = {
               roleEvent: {
                    findMany: async () => mockRoles,
               },
          };

          const service = new RoleEventServices(dbStub as any);
          const result = await service.findAll();

          expect(result).toEqual(mockRoles);
     });

     it('should throw an error if the database query fails', async () => {
          const dbStub = {
               roleEvent: {
                    findMany: async () => {
                         throw new Error('DB Failure');
                    },
               },
          };

          const service = new RoleEventServices(dbStub as any);

          expect(service.findAll()).rejects.toThrow('DB Failure');
     });
});

