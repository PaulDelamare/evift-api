import { BaseService } from "../base.services";

/**
 * Service class for Event operations
 * @extends BaseService
 */
export class RoleEventServices extends BaseService {


     /**
      * Finds the first role event with the specified name.
      *
      * @param name - The name of the role event to search for.
      * @returns A promise that resolves to the found role event object, or `null` if no matching event is found.
      */
     public async findRoleEvent(name: string) {

          return await this.db.roleEvent.findFirst({ where: { name } })
     }
}
