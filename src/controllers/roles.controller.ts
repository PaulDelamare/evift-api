// ! IMPORTS
import { errorServer } from "../lib/utils/errorServer";
import { PrismaClient } from "@prisma/client";

// ! CLASS
export class RolesController {
     // ! Class Variable
     private readonly bdd: PrismaClient;

     // ! Constructor
     constructor() {
          // Bdd Instance
          this.bdd = new PrismaClient();
     }

     // ! Create new role

     /**
      * Creates a new role in the database.
      *
      * @param name - The name of the role.
      * @return - A promise that resolves to an object with the status code and a success message.
      * @throws - If an error occurs during the role creation, an error server object is thrown.
      */
     public async create(name: string) {

          //? Try Create Role in Database
          try {

               // Create Role
               await this.bdd.roleEvent.create({
                    data: {
                         name: name
                    },
               });

               // Return Success
               return {
                    status: 201,
                    data: "Le role a bien été créé !"
               };

          }

          // ? If an error occur
          catch (error: unknown) {
               // Return Error Server
               return errorServer(
                    error,
                    "Une erreur s'est produite lors de la création du role"
               );
          }
     }
}
