import { throwError } from "../../lib/utils/errorHandler/errorHandler";
import { User } from "@prisma/client";
import { sendEmail } from "../../email/sendEmail";
import { BaseService } from "../base.services";
import { hashPassword } from "../../lib/utils/hashPassword/hashPassword";
import { createHash, randomBytes } from "crypto";

/**
 * Service class for Auth operations
 * @extends BaseService
 */
export class AuthServices extends BaseService {

     /**
      * Checks if a user exists in the database by their email address.
      *
      * @param email - The email address of the user to search for.
      * @returns A promise that resolves to the user object if found, or null if no user exists with the given email.
      */
     public async checkUserExists(email: User['email']): Promise<User | null> {
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

          const emailData = {
               firstname: user.firstname,
               emailService: process.env.EMAIL_SERVICE,
               email: "moi@gmail.com",
               token: user.id,
          };

          const { password, ...userWithoutPassword } = user

          return userWithoutPassword;
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

          const hashedPassword = await hashPassword(body.password);

          const alreadyUser = await this.checkUserExists(body.email);

          if (alreadyUser) {
               throw throwError(400, "Cet email est déjà utilisé !");
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

     /**
      * Generates a secure random reset token and its SHA-256 hash.
      *
      * @returns An object containing the plain reset token and its hashed value.
      * @remarks
      * The token is generated using 64 random bytes and encoded as a hexadecimal string.
      * The hash is computed using the SHA-256 algorithm for secure storage and verification.
      */
     private generateResetToken() {
          const token = randomBytes(64).toString("hex");
          const tokenHash = createHash("sha256").update(token).digest("hex");
          return { token, tokenHash };
     }


     /**
      * Generates a password reset token for a user based on their email address.
      * If the user exists, deletes any previous password reset tokens and creates a new one,
      * setting its expiration to one hour from now. Returns a message indicating that an email
      * has been sent if the account exists, along with the token and user information if applicable.
      *
      * @param validatedData - An object containing the user's email address.
      * @returns An object containing a message, and optionally the reset token and user information.
      */
     public async generatePasswordReset(validatedData: Pick<User, "email">) {

          const user = await this.db.user.findUnique({ where: validatedData });

          if (!user) {
               return { message: "Un e-mail a été envoyé si le compte existe." };
          }

          const { token, tokenHash } = this.generateResetToken();
          const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

          await this.db.$transaction([
               this.db.passwordResetToken.deleteMany({ where: { userId: user.id } }),
               this.db.passwordResetToken.create({
                    data: {
                         userId: user.id,
                         token: tokenHash,
                         expiresAt
                    }
               })
          ]);

          await sendEmail(user.email, process.env.EMAIL_SENDER!, "Réinitialisation de mot de passe", "resetPassword/resetPassword", { token, firstname: user.firstname, user_id: user.id });

          return { message: "Un e-mail a été envoyé si le compte existe." };
     }


     /**
      * Checks the validity of a user's password reset request by verifying the provided token and user ID.
      *
      * @param validatedData - An object containing the reset token and user ID.
      * @param validatedData.token - The password reset token to validate.
      * @param validatedData.userId - The ID of the user requesting the password reset.
      * @returns The password reset token row if the request is valid and not expired.
      * @throws {Error} Throws a 404 error if no matching reset request is found or the token is invalid.
      * @throws {Error} Throws a 410 error if the reset token has expired and deletes the token from the database.
      */
     public async checkUserRequest(validatedData: { token: string; userId: string }) {
          const { token, userId } = validatedData;
          const tokenHash = createHash("sha256").update(token).digest("hex");

          const row = await this.db.passwordResetToken.findFirst({
               where: { userId, token: tokenHash }
          });

          if (!row) throw throwError(404, "Aucune demande de réinitialisation trouvée ou token invalide.");

          if (row.expiresAt < new Date()) {
               await this.db.passwordResetToken.delete({ where: { id: row.id } });
               throw throwError(410, "Le token de réinitialisation est expiré.");
          }

          return row;
     }


     /**
      * Changes the password for a user after validating the provided token.
      *
      * This method performs the following steps:
      * 1. Validates the password reset token and user ID.
      * 2. Hashes the new password.
      * 3. Updates the user's password in the database.
      * 4. Deletes the used password reset token.
      *
      * @param validatedData - An object containing the password reset token, user ID, and new password.
      * @param validatedData.token - The password reset token to validate the request.
      * @param validatedData.userId - The ID of the user whose password is to be changed.
      * @param validatedData.password - The new password to set for the user.
      * @throws Will throw an error if the token is invalid or the database operations fail.
      */
     public async changePassword(validatedData: { token: string; userId: string; password: string }) {

          const { token, userId, password } = validatedData;

          const tokenRow = await this.checkUserRequest({ token, userId });
          const newHashedPassword = await hashPassword(password);

          await this.db.$transaction([
               this.db.user.update({ where: { id: userId }, data: { password: newHashedPassword } }),
               this.db.passwordResetToken.delete({ where: { id: tokenRow.id } })
          ]);
     }
}
