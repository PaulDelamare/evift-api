import { throwError } from "../../lib/utils/errorHandler/errorHandler";
import { User } from "@prisma/client";
import { sendEmail } from "../../email/sendEmail";
import { BaseService } from "../base.services";

/**
 * Service class for Card card operations
 * @extends BaseService
 */
export class AuthServices extends BaseService {

     /**
      * Checks if a user exists in the database by their email address.
      *
      * @param email - The email address of the user to search for.
      * @returns A promise that resolves to the user object if found, or null if no user exists with the given email.
      */
     private async checkUserExists(email: User['email']): Promise<User | null> {
          return this.db.user.findUnique({
               where: { email }, select: {
                    id: true,
                    email: true,
                    password: true,
                    firstname: true,
                    lastname: true,
                    createdAt: true,
                    updatedAt: true,
                    firstLogin: true
               },
          });
     }

     /**
      * Verifies whether the provided plain text password matches the user's hashed password.
      *
      * @param password - The plain text password to verify.
      * @param userPassword - The hashed password stored for the user.
      * @returns A promise that resolves to a boolean indicating if the password is correct.
      */
     private async checkUserPassword(password: User['password'], userPassword: User['password']) {
          return Bun.password.verify(password, userPassword);
     }

     /**
      * Authenticates a user with the provided email and password.
      *
      * @param body - An object containing the user's email and password.
      * @returns A promise that resolves to the user object without the password field if authentication is successful.
      * @throws Throws an error with status 400 if the email or password is incorrect.
      */
     public async login(validatedData: { email: User['email']; password: User['password'] }) {

          const user = await this.checkUserExists(validatedData.email);

          if (!user) {
               throw throwError(400, "L'adresse email ou le mot de passe est incorrect");
          }

          const matchPassword = await this.checkUserPassword(
               validatedData.password,
               user.password
          );

          if (!matchPassword) {
               throw throwError(400, "L'adresse email ou le mot de passe est incorrect");
          }

          const { password, ...userWithoutPassword } = user

          return userWithoutPassword;
     }


     /**
      * Hashes a plain text password using Bun's password hashing utility.
      *
      * @param password - The plain text password to be hashed.
      * @returns A promise that resolves to the hashed password as a string.
      */
     private async hashPassword(password: string): Promise<string> {
          return Bun.password.hash(password);
     }

     /**
      * Registers a new user with the provided details.
      *
      * @param body - An object containing the user's firstname, lastname, email, and password.
      * @returns An object with a status and error message if the email is already used, otherwise creates a new user and sends a confirmation email.
      *
      * @remarks
      * - Hashes the user's password before storing.
      * - Checks if a user with the given email already exists.
      * - Sends a confirmation email upon successful registration.
      */
     public async register(body: { firstname: string; lastname: string; email: string; password: string }) {

          const hashedPassword = await this.hashPassword(body.password);

          const alreadyUser = await this.checkUserExists(body.email);

          if (alreadyUser) {
               return { status: 400, error: "Cet email est déjà utilisé !" };
          }

          const newUser = await this.db.user.create({
               data: {
                    email: body.email,
                    firstname: body.firstname,
                    lastname: body.lastname,
                    password: hashedPassword,
               },
          });

          const emailData = {
               firstname: newUser.firstname,
               emailService: process.env.EMAIL_SERVICE
          };

          await sendEmail(newUser.email, process.env.EMAIL_SENDER!, 'Création d\'un compte Evift', 'validateEmail/validate-success', emailData);
     }
}
