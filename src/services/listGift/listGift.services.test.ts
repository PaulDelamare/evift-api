import { ListGift } from "@prisma/client";
import { describe, it, expect } from 'bun:test';
import { ListGiftServices } from './listGift.services';

describe('ListGiftServices.findOneListGift', () => {
     it('should return the ListGift when found', async () => {
          const mockList: ListGift = {
               id: 'list-123',
               name: 'Anniversaire',
               id_user: 'user-456',
               createdAt: new Date('2025-06-10'),
               updatedAt: new Date('2025-06-11'),
          };

          const dbStub = {
               listGift: {
                    findUnique: async (_args: any) => mockList,
               },
          };
          const service = new ListGiftServices(dbStub as any);

          const result = await service.findOneListGift('list-123');
          expect(result).toEqual(mockList);
     });

     it('should throw a 404 error when not found and requireList is true', async () => {
          const dbStub = {
               listGift: {
                    findUnique: async (_args: any) => null,
               },
          };
          const service = new ListGiftServices(dbStub as any);

          expect(service.findOneListGift('unknown-id')).rejects.toMatchObject({
               status: 404,
               error: { error: 'Liste de cadeaux introuvable' },
          });
     });

     it('should return null when not found and requireList is false', async () => {
          const dbStub = {
               listGift: {
                    findUnique: async (_args: any) => null,
               },
          };
          const service = new ListGiftServices(dbStub as any);

          const result = await service.findOneListGift('unknown-id', false);
          expect(result).toBeNull();
     });
});
