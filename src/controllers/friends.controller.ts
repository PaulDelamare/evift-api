// ! IMPORTS
import { errorServer } from "../lib/utils/errorServer";
import { PrismaClient } from "@prisma/client";

// ! CLASS
export class FriendsController {
    // ! Class Variable
    private readonly bdd: PrismaClient;

    // ! Constructor
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
            const friends = await this.bdd.friends.findMany({
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

            // Map friends to new array with modified objects
            const mappedFriends = friends.map(friend => {
                if (friend.user1Id === id) {
                    return {
                        id: friend.id,
                        createdAt: friend.created_at,
                        userId: friend.user2.id,
                        user: friend.user2
                    };
                } else if (friend.user2Id === id) {
                    return {
                        id: friend.id,
                        createdAt: friend.created_at,
                        userId: friend.user.id,
                        user: friend.user
                    };
                }
            });

            // Return Friends
            return {
                status: 200,
                data: mappedFriends,
            };

        }

        // ? If an error occur
        catch (error: unknown) {
            // Return Error Server
            return errorServer(
                error,
                "Une erreur s'est produite lors de la récupération des amis"
            );
        }
    }
}
