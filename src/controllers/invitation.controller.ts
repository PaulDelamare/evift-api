// ! IMPORTS
import { sendEmail } from "../email/sendEmail";
import { errorServer } from "../lib/utils/errorServer";
import { User } from "../models/User";
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

    // ! LOGIN
    public async fi(body: { email: string; password: string }) {
        // - Try Request
        try {
            // Find User in Database with Email
            const user = await this.bdd.user.findUnique({
                where: { email: body.email },
                select: {
                    id: true,
                    email: true,
                    password: true,
                    firstname: true,
                    lastname: true,
                },
            });

            // Return Error if User not found
            if (!user) {
                return {
                    status: 400,
                    error: "L'adresse email ou le mot de passe est incorrect",
                };
            }

            // Check if Password match
            const matchPassword = await Bun.password.verify(
                body.password,
                user.password
            );

            // Return Error if Password not match
            if (!matchPassword) {
                return {
                    status: 400,
                    error: "L'adresse email ou le mot de passe est incorrect",
                };
            }

            // Remove password from user
            const { password, ...userWithoutPassword } = user;

            // Return Success message
            return {
                status: 200,
                data: userWithoutPassword,
            };
        } catch (error) {
            // - Catch Error
            // Return Error Server
            return errorServer(
                error,
                "Une erreur s'est produite lors de la création de l'utilisateur"
            );
        }
    }

    // ! Request Invitation
    /**
     * Request Invitation
     *
     * @param body - The user object containing the email, firstname, lastname, and password.
     * @return - A promise that resolves to an object with the status code and message.
     * @throws - If an error occurs during the registration process.
     */
    public async invitationUser(body: { id: string }, userId: string) {
        if (body.id === userId) {
            return {
                status: 400,
                error: "Vous ne pouvez pas vous inviter vous-même !",
            };
        }

        //? Try Create User in Database
        try {
            const user = await this.bdd.user.findUnique({
                where: { id: body.id },
            });

            if (!user) {
                // Return Error if User not found
                return { status: 404, error: "L'utilisateur n'a pas été trouvé" };
            }
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

            if (alreadyFriend) {
                return {
                    status: 400,
                    error: "Vous êtes déjà amis avec cet utilisateur",
                };
            }

            const alreadyRequested = await this.bdd.invitation.findFirst({
                where: {
                    userId: userId,
                    requestId: body.id,
                },
            });
            if (alreadyRequested) {
                return { status: 400, error: "Vous avez déjà envoyé une invitation !" };
            }

            const confirmInvitation = await this.bdd.invitation.findFirst({
                where: {
                    userId: body.id,
                    requestId: userId,
                },
            });

            if (confirmInvitation) {
                await this.bdd.friends.create({
                    data: {
                        user1Id: userId,
                        user2Id: body.id,
                    },
                });
                await this.bdd.invitation.delete({
                    where: {
                        id: confirmInvitation.id,
                    },
                });

                return { status: 201, message: "Invitation acceptée avec succès !" };
            }

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

            // ? If an error occur
        } catch (error: unknown) {
            // Return Error Server
            return errorServer(
                error,
                "Une erreur s'est produite lors de la création de l'utilisateur"
            );
        }
    }
}
