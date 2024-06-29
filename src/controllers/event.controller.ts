// ! IMPORTS
import { errorServer } from "../lib/utils/errorServer";
import { PrismaClient } from "@prisma/client";

// ! CLASS
export class EventController {
    // ! Class Variable
    private readonly bdd: PrismaClient;

    // ! Constrcutor
    constructor() {
        // Bdd Instance
        this.bdd = new PrismaClient();
    }

    // ! Find All Friends
    /**
     * Create new event
     *
     * @param id - The ID of the user.
     * @return A promise that resolves to an object with the status code and the list of friends.
     * If an error occurs, it returns an error server object.
     */
    public async create(id: string, body: { name: string; description: string; date: Date; address: string; img?: File | undefined; }) {

        //? Try Create User in Database
        try {




            // Return Friends
            return {
                status: 200,
                data: '',
            };

        }

        // ? If an error occur
        catch (error: unknown) {
            // Return Error Server
            return errorServer(
                error,
                "Une erreur s'est produite lors de la création de l'utilisateur"
            );
        }
    }
}
