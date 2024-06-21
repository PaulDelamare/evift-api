// ! IMPORTS
import { errorServer } from "../lib/utils/errorServer";
import { PrismaClient } from "@prisma/client";

// ! CLASS
export class InvitationController {
    // ! Class Variable
    private readonly bdd: PrismaClient;

    // ! Constrcutor
    constructor() {
        // Bdd Instance
        this.bdd = new PrismaClient();
    }

    // ! Request Invitation
    /**
     * Request an invitation for a user.
     *
     * @param body - An object containing the user id for the invitation and the current user's id.
     * @param userId - The current user's id.
     * @return A promise that resolves to an object with the status code and message.
     */
    public async invitationUser(body: { id: string; }, userId: string) {

        // - If User send invitation to himself
        if (body.id === userId) {
            // Return Error
            return {
                status: 400,
                error: "Vous ne pouvez pas vous inviter vous-même !",
            };
        }

        //? Try Create User in Database
        try {

            // - Find User in Database
            const user = await this.bdd.user.findUnique({
                where: { id: body.id },
            });

            // If user not found
            if (!user) {
                // Return Error if User not found
                return { status: 404, error: "L'utilisateur n'a pas été trouvé" };
            }

            // - If User is already friend
            const alreadyFriend = await this.bdd.friends.findFirst({
                where: {
                    OR: [
                        {
                            user1Id: userId,
                            user2Id: body.id,
                        },
                        {
                            user1Id: body.id,
                            user2Id: userId,
                        },
                    ],
                },
            });

            // If User is already friend
            if (alreadyFriend) {
                // Return Error
                return {
                    status: 400,
                    error: "Vous êtes déjà amis avec cet utilisateur",
                };
            }

            // - If User already requested
            const alreadyRequested = await this.bdd.invitation.findFirst({
                where: {
                    userId: userId,
                    requestId: body.id,
                },
            });
            // If User already requested
            if (alreadyRequested) {
                // Return Error
                return { status: 400, error: "Vous avez déjà envoyé une invitation !" };
            }

            // - If other user have already requested
            const confirmInvitation = await this.bdd.invitation.findFirst({
                where: {
                    userId: body.id,
                    requestId: userId,
                },
            });

            // If other user have already requested
            if (confirmInvitation) {
                // Validate request
                // Create friend
                await this.bdd.friends.create({
                    data: {
                        user1Id: userId,
                        user2Id: body.id,
                    },
                });

                // delete invitation
                await this.bdd.invitation.delete({
                    where: {
                        id: confirmInvitation.id,
                    },
                });

                // Return Success
                return { status: 201, message: "Invitation acceptée avec succès !" };
            }

            // - If no conditon is true
            // Create invitation
            await this.bdd.invitation.create({
                data: {
                    userId: userId,
                    requestId: body.id,
                },
            });

            // Return Success message
            return {
                status: 200,
                message: "Invitation acceptée avec succès !",
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

    // - Find Invitations
    /**
     * A function to find invitations based on the provided id.
     *
     * @param id - The id used to search for invitations.
     * @return An object containing the status and invitations data.
     */
    public async findInvitations(id: string) {

        // - Try Request
        try {

            // Find All Request for user
            const invitations = await this.bdd.invitation.findMany({
                where: {
                    requestId: id,
                },
                // Don't return the password
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstname: true,
                            lastname: true
                        },
                    },
                },
            });

            // Return Success message
            return {
                status: 200,
                data: invitations
            };

        }
        // ? Catch Error 
        catch (error) {

            // Return Error Server
            return errorServer(error, "Une erreur s'est produite lors de la recherche des invitations");
        }
    }


    // - Accept or Refuse Friend Invitation
    /**
     * Accepts or refuses a friend invitation.
     *
     * @param id - The ID of the invitation.
     * @param userId - The ID of the user.
     * @param res - The response (true for accept, false for refuse).
     * @return - A promise that resolves to an object with the status code and optional error or success message.
     */
    public async acceptInvitation(id: string, userId: string, res: boolean) {

        // - Try Request
        try {

            // Find Invitation in Database
            const invitation = await this.bdd.invitation.findFirst({
                where: {
                    id: id
                }
            })

            // If Invitation not found
            if (!invitation) {
                // Return Error
                return { status: 404, error: "Invitation introuvable" };
            }

            //  If User is not the request
            if (invitation.requestId !== userId) {
                // Return Error
                return { status: 400, error: "Vous ne poyvez pas réaliser cette action" }
            }

            // - If User is already friend
            const alreadyFriend = await this.bdd.friends.findFirst({
                where: {
                    OR: [
                        {
                            user1Id: userId,
                            user2Id: invitation.userId,
                        },
                        {
                            user1Id: invitation.userId,
                            user2Id: userId,
                        },
                    ],
                },
            });

            // If User is already friend
            if (alreadyFriend) {
                // Return Error
                return {
                    status: 400,
                    error: "Vous êtes déjà amis avec cet utilisateur",
                };
            }

            // If Response is true
            if (res === true) {

                // Create Friend in DB
                await this.bdd.friends.create({
                    data: {
                        user1Id: userId,
                        user2Id: invitation.userId,
                    },
                });
            }

            // And Delete request
            await this.bdd.invitation.delete({
                where: {
                    id: id
                }
            })

            // Return Success
            return { status: 201, message: "Invitation acceptée avec succès !" };

        }
        // - Catch Error
        catch (error) {
            // Return Error Server
            return errorServer(error, "Une erreur s'est produite lors de la recherche des invitations");
        }
    }

    /**
     * Asynchronously counts the number of invitations for a given user.
     * 
     * @param userId - The unique identifier of the user to count invitations for.
     * @returns An object containing the status and the count of invitations.
     */
    public async countInvitations(userId: string) {

        // - Try Request
        try {

            // Get number of friends Invitation
            const count = await this.bdd.invitation.count({
                where: {
                    requestId: userId
                }
            });

            // Return number 
            return { status: 200, data: count };
        }
        // - Catch Error
        catch (error) {
            // Return Error Server
            return errorServer(error, "Une erreur s'est produite lors de la recherche des invitations");
        }
    }
}
