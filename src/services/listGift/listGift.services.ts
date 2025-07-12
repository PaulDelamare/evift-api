import { ListGift } from "@prisma/client";
import { BaseService } from "../base.services";
import { throwError } from "../../lib/utils/errorHandler/errorHandler";

/**
 * Service class for ListGift operations
 * @extends BaseService
 */
export class ListGiftServices extends BaseService {

     /**
      * Retrieves a single ListGift entity by its ID.
      *
      * @param id - The unique identifier of the ListGift to retrieve.
      * @param requireList - If true (default), throws a 404 error if the ListGift is not found.
      * @returns The found ListGift entity, or null if not found and requireList is false.
      * @throws {HttpError} Throws a 404 error if the ListGift is not found and requireList is true.
      */
     public async findOneListGift(id: ListGift['id'], requireList = true) {
          const list = await this.db.listGift.findUnique({
               where: { id }
          });

          if (!list && requireList) {
               throw throwError(404, 'Liste de cadeaux introuvable');
          }
          return list;
     }
}
