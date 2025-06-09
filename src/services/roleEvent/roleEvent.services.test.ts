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
