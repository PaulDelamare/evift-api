// ! IMPORTS
import { sendEmail } from "../email/sendEmail";
import { errorServer } from "../lib/utils/errorServer";
import { User } from "../models/User";
import { PrismaClient } from '@prisma/client'

// ! CLASS
export class AuthController {

    // ! Class Variable
    private readonly bdd: PrismaClient;

    // ! Constrcutor 
    constructor() {
        // Bdd Instance
        this.bdd = new PrismaClient();
    }

    // ! LOGIN
    public async login(body: { email: string; password: string }) {

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
                    lastname: true
                },
            });

            // Return Error if User not found
            if (!user) {
                return { status: 400, error: "L'adresse email ou le mot de passe est incorrect" };
            }

            // Check if Password match
            const matchPassword = await Bun.password.verify(
                body.password,
                user.password
            );

            // Return Error if Password not match
            if (!matchPassword) {
                return { status: 400, error: "L'adresse email ou le mot de passe est incorrect" };
            }

            // Remove password from user
            const { password, ...userWithoutPassword } = user

            // Return Success message 
            return {
                status: 200,
                data: userWithoutPassword
            }
        }

        // - Catch Error
        catch (error) {

            // Return Error Server
            return errorServer(error, "Une erreur s'est produite lors de la création de l'utilisateur");
        }
    }

    // ! REGISTER
    /**
     * Registers a new user in the database.
     *
     * @param body - The user object containing the email, firstname, lastname, and password.
     * @return - A promise that resolves to an object with the status code and message.
     * @throws - If an error occurs during the registration process.
     */
    public async register(body: User) {

        //? Try Create User in Database
        try {

            // Hash Password before creation
            const hashedPassword = await Bun.password.hash(body.password);

            // Create User
            const newUser = await this.bdd.user.create({
                data: {
                    email: body.email,
                    firstname: body.firstname,
                    lastname: body.lastname,
                    password: hashedPassword,
                },
            });

            // Cretae email Data 
            const emailData = {
                firstname: newUser.firstname,
                emailService: process.env.EMAIL_SERVICE
            }

            // Send Email
            await sendEmail(newUser.email, process.env.EMAIL_SENDER!, 'Création d\'un compte Evift', 'validateEmail/validate-success', emailData);

            // Return Success message 
            return {
                status: 201,
                message: "Utilisateur enregisté avec succès !"
            }

            // ? If an error occur
        } catch (error: unknown) {

            // Return Error Server
            return errorServer(error, "Une erreur s'est produite lors de la création de l'utilisateur");

        }
    }
}
