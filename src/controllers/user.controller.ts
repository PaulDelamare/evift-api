// ! IMPORTS
import { errorServer } from "../lib/utils/errorServer";
import { PrismaClient } from '@prisma/client'

// ! CLASS
export class UserController {

    // ! Class Variable
    private readonly bdd: PrismaClient;

    // ! Constructor 
    constructor() {
        // Bdd Instance
        this.bdd = new PrismaClient();
    }

    // ! Find user by Email
    /**
     * A function to find a user by email.
     *
     * @param email - The email of the user to find.
     * @return An object containing the status and user data.
     */
    public async findByEmail(email: string ) {

        // - Try Request
        try {

            // Find User in Database with Email
            const user = await this.bdd.user.findUnique({
                where: { email: email },
                select: {
                    id: true,
                    email: true,
                    firstname: true,
                    lastname: true
                },
            });

            // Return Error if User not found
            if (!user) {
                return { status: 400, error: "L'adresse email ou le mot de passe est incorrect" };
            }

            // Return Success message 
            return {
                status: 200,
                data: user
            }
        }

        // - Catch Error
        catch (error) {

            // Return Error Server
            return errorServer(error, "Une erreur s'est produite lors de la création de l'utilisateur");
        }
    }
}
