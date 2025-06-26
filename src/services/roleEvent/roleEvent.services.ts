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

     /**
      * Creates a new role event with the specified name.
      *
      * @param name - The name of the role event to create.
      * @returns A promise that resolves when the role event has been created.
      */
     public async create(name: string) {
          await this.db.roleEvent.create({
               data: {
                    name: name
               },
          });
     }

     /**
     * Retrieves all role events from the database.
     *
     * @returns A promise that resolves to an array of role event objects.
     * @throws Will throw an error if the database query fails.
     */
     public async findAll() {
          const roles = await this.db.roleEvent.findMany();
          return roles
     }
}
