import { throwError } from "../../lib/utils/errorHandler/errorHandler";
import { BaseService } from "../base.services";

/**
 * Service class for User operations
 * @extends BaseService
 */
export class UserServices extends BaseService {


     /**
      * Finds a user by their unique identifier.
      *
      * @param idUser - The unique identifier of the user to find.
      * @param requireUser - If true (default), throws an error if the user is not found. If false, returns null if not found.
      * @returns The user object containing id, email, firstname, lastname, and createdAt fields, or null if not found and requireUser is false.
      * @throws {Error} If the user is not found and requireUser is true.
      */
     public async findUser(idUser: string, requireUser = true) {

          const user = await this.db.user.findUnique({
               where: { id: idUser },
               select: { id: true, email: true, firstname: true, lastname: true, createdAt: true },
          });

          if (!user && requireUser) {
               throw throwError(404, "L'utilisateur n'a pas été trouvé");
          }

          return user;
     }


     /**
      * Finds a user by their email address.
      *
      * @param email - The email address of the user to find.
      * @returns A promise that resolves to the user object containing `id`, `email`, `firstname`, and `lastname`
      *          if found, or an error object with status 400 if the user is not found.
      */
     public async findUserByEmail(email: string) {

          const user = await this.db.user.findUnique({
               where: { email: email },
               select: {
                    id: true,
                    email: true,
                    firstname: true,
                    lastname: true
               },
          });

          if (!user) {
               return { status: 400, error: "L'adresse email ou le mot de passe est incorrect" };
          }

          return user
     }

     /**
      * Marks the user's first login as complete by setting the `firstLogin` flag to `false`.
      *
      * @param idUser - The unique identifier of the user whose first login status will be updated.
      * @returns A promise that resolves when the update operation is complete.
      */
     public async completeFirstLogin(idUser: string) {

          await this.db.user.update({
               where: { id: idUser },
               data: { firstLogin: false }
          });
     }
}
