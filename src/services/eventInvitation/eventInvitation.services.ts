import { throwError } from "../../lib/utils/errorHandler/errorHandler";
import { BaseService } from "../base.services";
import { FriendsServices } from "../friends/friends.services";
import { ParticipantServices } from "../participant/participant.services";
import { EventServices } from "../event/event.services";
import { RoleEventServices } from "../roleEvent/roleEvent.services";
import { InvitationServices } from "../invitation/invitation.services";
import { sendEmail } from "../../email/sendEmail";
import { formatDate, formatDateWithoutTime } from "../../lib/utils/formatDateError/formatDateError";
import { Event, User } from "@prisma/client";

/**
 * Service class for Event operations
 * @extends BaseService
 */
export class EventInvitationServices extends BaseService {

     public participantServices: ParticipantServices;
     public friendsServices: FriendsServices;
     public eventServices: EventServices;
     public roleEventServices: RoleEventServices;
     public invitationServices: InvitationServices;

     constructor(...args: any[]) {
          super(...args);
          this.participantServices = new ParticipantServices();
          this.friendsServices = new FriendsServices();
          this.eventServices = new EventServices();
          this.roleEventServices = new RoleEventServices();
          this.invitationServices = new InvitationServices();
     }

     /**
      * Invites a list of users to an event after performing necessary checks.
      * 
      * Checks performed:
      * - The organizer is an admin of the event.
      * - Each invited user is not already a participant.
      * - Each invited user is a friend of the organizer.
      * - No invited user has already been invited to the event.
      * 
      * @param invitationsId - Array of user IDs to invite.
      * @param organizerId - The ID of the organizer sending invitations.
      * @param eventId - The ID of the event.
      * @throws {Error} If any check fails.
      */
     public async eventInvitation(
          invitationsId: string[],
          organizerId: string,
          eventId: string
     ): Promise<void> {

          const organizerEvent = await this.participantServices.findParticipantByUserIdAndEventId(
               organizerId,
               eventId,
               false,
               true
          );

          if (!organizerEvent || (organizerEvent.roleRef.name !== "admin" && organizerEvent.roleRef.name !== "superAdmin")) {
               throw throwError(403, "Vous n'avez pas le droit d'inviter des utilisateurs");
          }

          const [participants] = await Promise.all([
               Promise.all(
                    invitationsId.map(userId =>
                         this.participantServices.findParticipantByUserIdAndEventId(userId, eventId, false, false)
                    )
               ),
               Promise.all(
                    invitationsId.map(userId =>
                         this.friendsServices.checkAlreadyFriends(organizerId, userId, false)
                    )
               )
          ]);

          if (participants.some(participant => participant)) {
               throw throwError(400, "Certains utilisateurs invités ne sont pas autorisés à participer à cet événement");
          }

          await this.checkUserAlreadyInvited(invitationsId, eventId);

          const invitationData = this.transformEventInvitationArray(invitationsId, eventId, organizerId);
          await this.createManyEventInvitation(invitationData);

          await this.sendNotificationToInviteuser(invitationsId, organizerEvent.user, organizerEvent.event);
     }

     /**
      * Sends event invitation notifications via email to a list of users.
      *
      * This method retrieves user details based on the provided invitation IDs,
      * constructs the email content using event and user information, and sends
      * an invitation email to each user.
      *
      * @param invitationsId - Array of user IDs to whom the invitations will be sent.
      * @param user - The organizer's user information, including id, email, firstname, and lastname.
      * @param event - The event details, including name, date, time, address, and description.
      * @returns A Promise that resolves when all emails have been sent.
      */
     private async sendNotificationToInviteuser(invitationsId: string[], user: Pick<User, 'id' | 'email' | 'firstname' | 'lastname'>, event: Pick<Event, 'name' | 'date' | 'time' | 'address' | 'description'>) {
          const users = await this.db.user.findMany({
               where: { id: { in: invitationsId } },
               select: { email: true, firstname: true, lastname: true }
          });

          for (const user of users) {
               if (!user || !user.email) continue;

               const emailData = {
                    recipientFirstname: user.firstname ?? "",
                    recipientLastname: user.lastname ?? "",
                    organizerFirstname: user.firstname ?? "",
                    organizerLastname: user.lastname ?? "",
                    eventTitle: event?.name ?? "Événement Evift",
                    eventDate: formatDateWithoutTime(event?.date),
                    eventTime: event?.time,
                    eventLocation: event?.address ?? "",
                    eventDescription: event?.description ?? "",
               };

               const subject = `Invitation : ${event?.name ?? "événement"}`;

               await sendEmail(
                    user.email,
                    process.env.EMAIL_SENDER!,
                    subject,
                    'invitation/eventInvitation',
                    emailData
               );
          }
     }

     /**
      * Checks if any of the given users have already been invited to the specified event.
      * Throws an error if at least one user has already been invited.
      *
      * @param invitationsId - Array of user IDs to check.
      * @param eventId - The event ID to check invitations for.
      * @throws {Error} If any user has already been invited to the event.
      */
     public async checkUserAlreadyInvited(invitationsId: string[], eventId: string): Promise<void> {
          if (!invitationsId.length) return;

          const existingInvitations = await this.db.eventInvitation.count({
               where: {
                    id_event: eventId,
                    id_user: { in: invitationsId },
               },
          });

          if (existingInvitations > 0) {
               throw throwError(400, 'Certains utilisateurs invités ont déjà été invités à cet événement');
          }
     }

     /**
      * Transforms an array of user invitation IDs into an array of event invitation objects.
      *
      * @param eventInvitations - An array of user IDs to be invited to the event.
      * @param eventId - The unique identifier of the event.
      * @param organizerId - The unique identifier of the event organizer.
      * @returns An array of objects, each representing an event invitation with the event ID, user ID, and organizer ID.
      */
     public transformEventInvitationArray(eventInvitations: string[], eventId: string, organizerId: string) {
          return eventInvitations.map((invitation) => ({
               id_event: eventId,
               id_user: invitation,
               id_organizer: organizerId,
          }));
     }

     /**
      * Creates multiple event invitations in the database.
      *
      * @param invitationData - An array of objects containing the event invitation details.
      * Each object should include:
      *   - `id_event`: The unique identifier of the event.
      *   - `id_user`: The unique identifier of the user being invited.
      *   - `id_organizer`: The unique identifier of the organizer sending the invitation.
      * @returns A promise that resolves when the invitations have been created.
      */
     public async createManyEventInvitation(invitationData: {
          id_event: string;
          id_user: string;
          id_organizer: string;
     }[]) {
          await this.db.eventInvitation.createMany({
               data: invitationData,
          });
     }

     /**
      * Retrieves all event invitations for a specific user.
      *
      * @param userId - The unique identifier of the user whose invitations are to be fetched.
      * @returns A promise that resolves to an array of event invitations, each including organizer details and event information.
      */
     public async getEventInvitations(userId: string) {
          const invitations = await this.db.eventInvitation.findMany({
               where: {
                    id_user: userId
               },
               include: {
                    idOrganizer: {
                         select: {
                              id: true,
                              firstname: true,
                              lastname: true,
                              email: true,
                         },
                    },
                    event: true
               }
          })

          return invitations
     }

     /**
      * Handles a user's response to an event invitation.
      *
      * If the user accepts the invitation, they are added as a participant to the event
      * with the "participant" role. Regardless of the response, the invitation is deleted.
      *
      * @param userId - The ID of the user responding to the invitation.
      * @param eventId - The ID of the event for which the invitation was sent.
      * @param response - The user's response to the invitation; `true` for accept, `false` for decline.
      * @returns A message indicating whether the invitation was accepted or declined.
      * @throws Will throw an error if the invitation or event is not found.
      */
     public async responseEventInvitation(userId: string, eventId: string, response: boolean) {

          const invitation = (await this.findEventInvitationByUserIdAndEventId(userId, eventId, true))!

          await this.eventServices.findEventById(eventId, true)

          const participantRole = await this.roleEventServices.findRoleEvent("participant")

          if (response) {
               await this.friendsServices.addFriends(userId, invitation.id_organizer);
               await this.invitationServices.deleteByRequestId(invitation.id_user);
               await this.participantServices.addNewParticipant(eventId, userId, participantRole!.id);
          }

          await this.deleteEventInvitation(invitation.id)

          return `Invitation ${response ? 'acceptée' : 'refusée'}`
     }

     /**
      * Retrieves an event invitation for a specific user and event.
      *
      * @param userId - The unique identifier of the user.
      * @param eventId - The unique identifier of the event.
      * @param checkError - Optional. If true (default), throws a 404 error if the invitation is not found.
      * @returns A promise that resolves to the event invitation object if found, or null if not found and `checkError` is false.
      * @throws {Error} Throws a 404 error if the invitation is not found and `checkError` is true.
      */
     public async findEventInvitationByUserIdAndEventId(userId: string, eventId: string, checkError = true) {
          const invitation = await this.db.eventInvitation.findFirst({
               where: {
                    id_user: userId,
                    id_event: eventId
               }
          })

          if (!invitation && checkError) {
               throw throwError(404, 'Invitation introuvable')
          }

          return invitation
     }

     /**
      * Deletes an event invitation by its unique identifier.
      *
      * @param id - The unique identifier of the event invitation to delete.
      * @returns A promise that resolves when the event invitation has been deleted.
      * @throws Will throw an error if the deletion fails.
      */
     public async deleteEventInvitation(id: string) {
          await this.db.eventInvitation.delete({
               where: {
                    id
               }
          })
     }

     /**
      * Retrieves the number of friend and event invitation notifications for a given user.
      *
      * @param userId - The unique identifier of the user for whom to fetch invitation notifications.
      * @returns An object containing the counts of friend invitations and event invitations.
      *
      * @example
      * const notifications = await getInvitationNotifications('user123');
      * notifications = { countFriendsInvitation: 2, countEventInvitation: 5 }
      */
     public async getInvitationNotifications(userId: string) {

          const countFriendsInvitation = await this.invitationServices.countNotification(userId);

          const countEventInvitation = await this.countEventInvitation(userId);

          const notification = {
               countFriendsInvitation: countFriendsInvitation,
               countEventInvitation: countEventInvitation
          }

          return notification
     }

     /**
      * Counts the number of event invitations for a specific user.
      *
      * @param userId - The unique identifier of the user whose event invitations are to be counted.
      * @returns A promise that resolves to the number of event invitations associated with the given user.
      */
     public async countEventInvitation(userId: string) {
          return await this.db.eventInvitation.count({
               where: {
                    id_user: userId
               }
          });
     }
}
