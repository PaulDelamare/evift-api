import { sendEmail } from "../../email/sendEmail";
import { throwError } from "../../lib/utils/errorHandler/errorHandler";
import { BaseService } from "../base.services";
import { FriendsServices } from "../friends/friends.services";
import { UserServices } from "../user/user.services";

/**
 * Service class for Invitation operations
 * @extends BaseService
 */
export class InvitationServices extends BaseService {

     public userServices: UserServices;
     public friendsServices: FriendsServices;

     constructor(...args: any[]) {
          super(...args);
          this.userServices = new UserServices();
          this.friendsServices = new FriendsServices();
     }

     /**
      * Sends an invitation from one user to another, handling various edge cases.
      *
      * @param id - The ID of the user to be invited.
      * @param userId - The ID of the user sending the invitation.
      * @returns A promise that resolves to a confirmation message.
      * @throws {Error} If the user tries to invite themselves.
      * @throws {Error} If the invited user does not exist.
      * @throws {Error} If the users are already friends.
      *
      * This method checks if the invitation is valid, ensures users are not already friends,
      * and handles the case where a reverse invitation already exists by confirming it.
      * Otherwise, it creates a new invitation.
      */
     public async invitationUser(id: string, userId: string, firstnameUser: string, emailUser: string) {

          if (id === userId) {
               throw throwError(400, "Vous ne pouvez pas vous inviter vous-même !");
          }

          const user = (await this.userServices.findUser(id))!;

          await this.friendsServices.checkAlreadyFriends(userId, id);

          await this.checkInvitation(id, userId, true);

          const existingReverseInvitation = await this.checkInvitation(userId, id, false);

          if (existingReverseInvitation) {

               await this.confirmInvitation(id, userId, existingReverseInvitation.id);

               return "Invitation confirmée !";
          }

          await this.createInvitation(userId, id);

          await sendEmail(user.email, "", `Vous avez reçu une demande d'ami de ${firstnameUser} `, "invitation/friendInvitation", {
               userFirstname: firstnameUser,
               userEmail: emailUser
          });

          return "Invitation envoyée !";
     }

     /**
      * Checks if a user has already sent an invitation for a given request.
      *
      * @param id - The ID of the request to check against.
      * @param userId - The ID of the user to check for an existing invitation.
      * @param checkAlreadyError - Optional. If true (default), throws an error if an invitation already exists.
      * @returns The existing invitation if found, or throws an error if `checkAlreadyError` is true and an invitation exists.
      * @throws Throws a 400 error if the user has already sent an invitation and `checkAlreadyError` is true.
      */
     public async checkInvitation(id: string, userId: string, checkAlreadyError = true) {

          const alreadyRequested = await this.db.invitation.findFirst({
               where: {
                    userId: userId,
                    requestId: id,
               },
          });

          if (alreadyRequested && checkAlreadyError) {
               throw throwError(400, "Vous avez déjà envoyé une invitation !");
          }

          return alreadyRequested;
     }

     /**
      * Confirms an invitation by adding the inviter as a friend and deleting the invitation.
      *
      * @param id - The ID of the user who sent the invitation.
      * @param userId - The ID of the user who is accepting the invitation.
      * @param invitationId - The unique identifier of the invitation to be confirmed and deleted.
      * @returns A promise that resolves when the invitation is confirmed and deleted.
      */
     private async confirmInvitation(id: string, userId: string, invitationId: string) {

          await this.friendsServices.addFriends(userId, id);

          await this.deleteInvitation(invitationId);
     }

     /**
      * Deletes an invitation from the database by its unique identifier.
      *
      * @param invitationId - The unique identifier of the invitation to delete.
      * @returns A promise that resolves when the invitation has been deleted.
      * @throws Will throw an error if the deletion fails.
      */
     private async deleteInvitation(invitationId: string) {
          await this.db.invitation.delete({
               where: {
                    id: invitationId,
               },
          });
     }

     /**
      * Creates a new invitation record in the database for the specified user and request.
      *
      * @param userId - The unique identifier of the user to whom the invitation is addressed.
      * @param id - The unique identifier of the request associated with the invitation.
      * @returns A promise that resolves when the invitation has been created.
      * @throws Will throw an error if the database operation fails.
      */
     public async createInvitation(userId: string, id: string) {
          await this.db.invitation.create({
               data: {
                    userId: userId,
                    requestId: id,
               },
          });
     }

     /**
      * Deletes all invitation records associated with the specified request ID.
      *
      * @param requestId - The unique identifier of the request whose invitations should be deleted.
      * @returns A promise that resolves when the deletion operation is complete.
      */
     public async deleteByRequestId(requestId: string) {
          await this.db.invitation.deleteMany({
               where: {
                    requestId: requestId,
               },
          });
     }

     /**
      * Retrieves all invitations associated with the specified request ID.
      *
      * @param id - The unique identifier of the request to find invitations for.
      * @returns A promise that resolves to an array of invitation objects, each including selected user details (id, email, firstname, lastname).
      */
     public async findInvitations(id: string) {
          return await this.db.invitation.findMany({
               where: {
                    requestId: id,
               },
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
     }

     /**
      * Accepts or declines an invitation.
      *
      * @param id - The unique identifier of the invitation.
      * @param userId - The ID of the user performing the action (should match the invitation's requestId).
      * @param accept - If true, the invitation is accepted and a friendship is created; if false, the invitation is declined.
      * @throws {Error} If the user is not authorized to accept/decline the invitation or if users are already friends.
      * @returns A promise that resolves when the invitation is processed.
      */
     public async acceptInvitation(id: string, userId: string, accept: boolean): Promise<void> {
          const invitation = await this.findInvitationById(id);

          if (!invitation || invitation.requestId !== userId) {
               throw throwError(400, "Vous ne pouvez pas réaliser cette action");
          }

          await this.friendsServices.checkAlreadyFriends(userId, invitation.userId);

          if (accept) {
               await this.friendsServices.addFriends(userId, invitation.userId);
          }

          await this.deleteInvitation(id);
     }

     /**
      * Finds an invitation by its unique identifier.
      *
      * @param id - The unique identifier of the invitation to find.
      * @param checkError - If true, throws a 404 error when the invitation is not found. Defaults to true.
      * @returns The invitation object if found, otherwise throws an error or returns null based on `checkError`.
      * @throws {Error} Throws a 404 error if the invitation is not found and `checkError` is true.
      */
     public async findInvitationById(id: string, checkError = true) {
          const invitation = await this.db.invitation.findFirst({
               where: {
                    id: id
               }
          })

          if (!invitation && checkError) {
               throw throwError(404, "Invitation non trouvée");
          }

          return invitation;
     }

     /**
      * Counts the number of invitation notifications for a specific user.
      *
      * @param userId - The ID of the user whose invitation notifications are to be counted.
      * @returns A promise that resolves to the number of invitation notifications for the given user.
      */
     public async countNotification(userId: string) {
          return await this.db.invitation.count({
               where: {
                    requestId: userId
               }
          });
     }
}
