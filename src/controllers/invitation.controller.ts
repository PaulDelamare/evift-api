// ! IMPORTS
import { errorServer } from "../lib/utils/errorServer";
import { PrismaClient } from "@prisma/client";

// ! CLASS
export class InvitationController {
    // ! Class Variable
    private readonly bdd: PrismaClient;

    // ! Constructor
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
                select: { id: true, email: true, firstname: true, lastname: true, createdAt: true },
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
                "Une erreur s'est produite lors de la requête d'une invitation"
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
            return errorServer(error, "Une erreur s'est produite lors de la réponse d'une invitation");
        }
    }

    /**
     * Invites a list of users to an event. The organizer of the event must be an admin and all invited users must be friends of the organizer.
     * The function checks if the invited users are already in the EventInvitation table.
     * If all checks pass, the function creates records in the EventInvitation table.
     *
     * @param invitationsId - An array of user IDs to invite to the event.
     * @param organizerId - The ID of the event organizer.
     * @param eventId - The ID of the event.
     * @return - A promise that resolves to an object with the status code and either an error message or the created invitations data.
     */
    public async eventInvitation(invitationsId: string[], organizerId: string, eventId: string) {
        try {
            // Check that the organizer is an admin
            const organizerEvent = await this.bdd.participant.findFirst({
                where: {
                    id_event: eventId,
                    id_user: organizerId,
                },
                include: {
                    roleRef: true,
                },
            })

            // Check that the organizer is an admin
            if (!organizerEvent || organizerEvent.roleRef.name !== "admin") {

                return { status: 400, error: 'Vous n\'avez pas le droit d\'inviter des utilisateurs' };
            }

            // Check that none of the invited users have already been invited to the event
            for (const userId of invitationsId) {
                const existingParticipant = await this.bdd.participant.findFirst({
                    where: {
                        id_event: eventId,
                        id_user: userId,
                    },
                });
                if (existingParticipant) {
                    return { status: 400, error: 'Tous les utilisateurs invités ne sont pas autorisés à participer à cet événement' };
                }
            }


            // Check that all invited users are friends of the organizer
            for (const userId of invitationsId) {
                const friend = await this.bdd.friends.findFirst({
                    where: {
                        OR: [
                            { AND: [{ user1Id: organizerId }, { user2Id: userId }] },
                            { AND: [{ user1Id: userId }, { user2Id: organizerId }] },
                        ],
                    },
                });
                if (!friend) {
                    return { status: 400, error: 'Tous les utilisateurs invités ne sont pas vos amis' };
                }
            }

            // Check that none of the invited users have already been invited to the event
            const existingInvitations = await this.bdd.eventInvitation.count({
                where: {
                    AND: [
                        { id_event: eventId },
                        { id_user: { in: invitationsId } },
                    ],
                },
            });
            if (existingInvitations > 0) {
                return { status: 400, error: 'Certains utilisateurs invités ont déjà été invités à cet événement' };
            }

            // Create invitations
            const invitationData = invitationsId.map((userId) => ({
                id_event: eventId,
                id_user: userId,
                id_organizer: organizerId,
            }));

            await this.bdd.eventInvitation.createMany({
                data: invitationData,
            });

            return { status: 200, data: "Invitations envoyées avec succes" };

        } catch (error) {
            console.error(error);
            return { status: 500, error: 'Une erreur est survenue lors de la création des invitations' };
        }
    }

    /**
     * Retrieves the event invitations for a given user.
     *
     * @param userId - The ID of the user.
     * @return - A promise that resolves to an object containing the status code and the invitations data.
     */
    public async getEventInvitations(userId: string) {
        try {
            // Get invitations for this user
            const invitations = await this.bdd.eventInvitation.findMany({
                where: {
                    // Get invitations for this user
                    id_user: userId
                },
                include: {
                    // Get user organizer details
                    idOrganizer: {
                        select: {
                            id: true,
                            firstname: true,
                            lastname: true,
                            email: true,
                        },
                    },
                    // Get event details
                    event: true
                }
            })

            // Return invitations
            return { status: 200, data: invitations }
        } catch (error) {
            // Return Error Server
            console.error(error);
            return { status: 500, error: 'Une erreur est survenue lors de la création des invitations' };
        }
    }

    /**
     * Responds to an event invitation by accepting or declining it.
     *
     * @param userId - The ID of the user who received the invitation.
     * @param eventId - The ID of the event.
     * @param response - Whether to accept or decline the invitation.
     * @return An object with the status code and a message indicating whether the invitation was accepted or declined.
     */
    public async responseEventInvitation(userId: string, eventId: string, response: boolean) {
        try {
            // Get invitation
            const invitation = await this.bdd.eventInvitation.findFirst({
                where: {
                    id_user: userId,
                    id_event: eventId
                }
            })
            if (!invitation) {
                return { status: 404, error: 'Invitation introuvable' }
            }

            const event = await this.bdd.event.findFirst({
                where: {
                    id: eventId
                }
            })
            if (!event) {
                return { status: 404, error: 'Event introuvable' }
            }

            const participantRole = await this.bdd.roleEvent.findFirst({
                where: {
                    name: "participant"
                }
            })

            if (response) {
                await this.bdd.participant.create({
                    data: {
                        id_event: eventId,
                        id_user: userId,
                        id_role: participantRole!.id,
                    }
                })
            }

            await this.bdd.eventInvitation.delete({
                where: {
                    id: invitation.id
                }
            })

            return { status: 200, message: `Invitation ${response ? 'acceptée' : 'refusée'}` }
            
        } catch (error) {

            // Return Error Server
            console.error(error);
            return { status: 500, error: 'Une erreur est survenue lors de la création des invitations' };
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
            const countFriendsInvitation = await this.bdd.invitation.count({
                where: {
                    requestId: userId
                }
            });

            const countEventInvitation = await this.bdd.eventInvitation.count({
                where: {
                    id_user: userId
                }
            });

            const notification = {
                countFriendsInvitation: countFriendsInvitation,
                countEventInvitation: countEventInvitation
            }

            // Return number 
            return { status: 200, data: notification };
        }
        // - Catch Error
        catch (error) {
            // Return Error Server
            return errorServer(error, "Une erreur s'est produite lors de la récupération du nombre de demandes d'amis");
        }
    }
}
