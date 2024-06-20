// ! IMPORTS
import { errorServer } from "../lib/utils/errorServer";
import { PrismaClient } from "@prisma/client";

// ! CLASS
export class FriendsController {
    // ! Class Variable
    private readonly bdd: PrismaClient;

    // ! Constrcutor
    constructor() {
        // Bdd Instance
        this.bdd = new PrismaClient();
    }

    // ! Find All Friends
    /**
     * Find all friends of a user.
     *
     * @param id - The ID of the user.
     * @return A promise that resolves to an object with the status code and the list of friends.
     * If an error occurs, it returns an error server object.
     */
    public async findAll(id: string) {


        //? Try Create User in Database
        try {

            // Get all Friends
            const friends =  await this.bdd.friends.findMany({
                where: {
                    OR: [
                        {
                            user1Id: id
                        },
                        {
                            user2Id: id
                        }
                    ],
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstname: true,
                            lastname: true
                        }
                    },
                    user2: {
                        select: {
                            id: true,
                            email: true,
                            firstname: true,
                            lastname: true
                        }
                    }

                }
            })


            // Return Friends
            return {
                status: 200,
                data: friends,
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
