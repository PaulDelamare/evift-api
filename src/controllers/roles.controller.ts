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
      * Create new event
      *
      * @param id - The ID of the user.
      * @return A promise that resolves to an object with the status code and the list of friends.
      * If an error occurs, it returns an error server object.
      */
     public async create(name: string) {

          //? Try Create User in Database
          try {

               // Create Event
               await this.bdd.roleEvent.create({
                    data: {
                         name: name
                    },
               });

               // Return Event id
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
