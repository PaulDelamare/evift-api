import { BaseService } from "../base.services";
import { generateToken } from "../../lib/utils/generateToken/generateToken";
import { sendEmail } from "../../email/sendEmail";
import { throwError } from "../../lib/utils/errorHandler/errorHandler";
import { hashPassword } from "../../lib/utils/hashPassword/hashPassword";
import { AuthServices } from "../auth/auth.services";
import { EventInvitationServices } from "../eventInvitation/eventInvitation.services";
import { FriendsServices } from "../friends/friends.services";
import { InvitationServices } from "../invitation/invitation.services";

/**
 * Service class for ListGift operations
 * @extends BaseService
 */
export class RequestAccountServices extends BaseService {

     public authServices: AuthServices;
     public eventInvitationServices: EventInvitationServices;
     public invitationServices: InvitationServices;

     constructor(...args: any[]) {
          super(...args);
          this.authServices = new AuthServices();
          this.eventInvitationServices = new EventInvitationServices();
          this.invitationServices = new InvitationServices();
     }

     /**
      * Creates or updates a requestAccount entry.
      * If an entry with the given email exists, adds id_friend and/or id_event if not already present.
      * Otherwise, creates a new entry.
      */
     public async requestAccount(email: string, id_friend: string, id_event: string | null) {
          const userExists = await this.db.user.findUnique({
               where: { email }
          });
          if (userExists) {
               throwError(400, "Cet email est déjà associé à un compte utilisateur existant.");
          }

          const existing = await this.db.requestAccount.findUnique({
               where: { email }
          });

          let updatedFriends = existing?.id_friend ?? [];
          let updatedEvents: { id_event: string; inviteFrom: string }[] =
               Array.isArray(existing?.eventRequests)
                    ? (existing!.eventRequests as any[])
                         .filter((e): e is { id_event: string; inviteFrom: string } =>
                              e && typeof e === "object" && typeof e.id_event === "string" && typeof e.inviteFrom === "string"
                         )
                    : [];

          if (!updatedFriends.includes(id_friend)) {
               updatedFriends = [...updatedFriends, id_friend];
          }

          if (id_event) {
               const existsAlready = updatedEvents.some(
                    e => e.id_event === id_event && e.inviteFrom === id_friend
               );

               if (!existsAlready) {
                    updatedEvents = [...updatedEvents, { id_event, inviteFrom: id_friend }];
               }
          }

          const token = generateToken();

          await this.db.requestAccount.upsert({
               where: { email },
               update: {
                    id_friend: updatedFriends,
                    eventRequests: updatedEvents
               },
               create: {
                    email,
                    token,
                    id_friend: [id_friend],
                    eventRequests: id_event ? [{ id_event, inviteFrom: id_friend }] : []
               }
          });

          await this.sendEmailAccount(email, token, id_friend, id_event);
     }


     private async sendEmailAccount(email: string, token: string, id_friend: string, id_event: string | null) {
          const friend = await this.db.user.findUnique({
               where: { id: id_friend },
               select: { firstname: true, lastname: true, email: true }
          });

          let event = null;
          if (id_event) {
               event = await this.db.event.findUnique({
                    where: { id: id_event },
                    select: { name: true, description: true, date: true, address: true }
               });
          }

          const emailData: Record<string, any> = {
               friendFirstname: friend?.firstname,
               friendLastname: friend?.lastname,
               emailFriend: friend?.email,
               email: email,
               token: token,
               ...(event && {
                    eventName: event.name,
                    eventDescription: event.description,
                    eventDate: event.date,
                    eventAddress: event.address
               })
          };

          const template =
               event
                    ? "requestAccount/requestEvent"
                    : "requestAccount/requestFriends";

          await sendEmail(
               email,
               process.env.EMAIL_SENDER!,
               "Création d'un compte Evift",
               template,
               emailData
          );
     }

     public async createRequestAccount(body: { firstname: string; lastname: string; email: string; password: string; token: string }) {

          const hashedPassword = await hashPassword(body.password);

          const alreadyUser = await this.authServices.checkUserExists(body.email);

          if (alreadyUser) {
               throw throwError(400, "Cet email est déjà utilisé !");
          }

          const requestAccount = (await this.checkRequestAccount(body.email, body.token, true))!;

          const newUser = await this.db.user.create({
               data: {
                    email: body.email.toLowerCase(),
                    firstname: body.firstname,
                    lastname: body.lastname,
                    password: hashedPassword,
               },
          });

          if (requestAccount.id_friend && Array.isArray(requestAccount.id_friend)) {
               for (const friendId of requestAccount.id_friend) {
                    await this.invitationServices.createInvitation(friendId, newUser.id);
               }
          }

          if (requestAccount.eventRequests && Array.isArray(requestAccount.eventRequests)) {
               for (const eventRequestRaw of requestAccount.eventRequests) {
                    const eventRequest = typeof eventRequestRaw === "object" && eventRequestRaw !== null && "inviteFrom" in eventRequestRaw && "id_event" in eventRequestRaw
                         ? eventRequestRaw as { inviteFrom: string; id_event: string }
                         : null;
                    if (eventRequest && eventRequest.inviteFrom) {
                         await this.eventInvitationServices.eventInvitation(
                              [newUser.id],
                              eventRequest.inviteFrom,
                              eventRequest.id_event
                         );
                    }
               }
          }

          const emailData = {
               firstname: newUser.firstname,
               emailService: process.env.EMAIL_SERVICE
          };

          await sendEmail(newUser.email, process.env.EMAIL_SENDER!, 'Création d\'un compte Evift', 'validateEmail/validate-success', emailData);
     }

     public async checkRequestAccount(email: string, token: string, checkError: boolean) {
          const requestAccount = await this.db.requestAccount.findUnique({
               where: {
                    email,
                    token
               }
          });

          if (checkError && !requestAccount) {
               throw throwError(404, "Aucune demande de création de compte trouvée !");
          }

          return requestAccount;
     }
}
