import { BaseService } from "../base.services";
import { RoleEventServices } from "../roleEvent/roleEvent.services";
import { ParticipantServices } from "../participant/participant.services";
import { User } from "@prisma/client";
import { throwError } from "../../lib/utils/errorHandler/errorHandler";

/**
 * Service class for Event operations
 * @extends BaseService
 */
export class EventServices extends BaseService {

     public roleEventServices: RoleEventServices;
     public participantServices: ParticipantServices;

     constructor(...args: any[]) {
          super(...args);
          this.roleEventServices = new RoleEventServices();
          this.participantServices = new ParticipantServices();
     }

     /**
      * Creates a new event associated with the specified user.
      *
      * @param id_user - The ID of the user creating the event.
      * @param body - The event details, including name, description, date, time, and address.
      * @returns The ID of the newly created event.
      *
      * @throws Will throw an error if event creation fails or if participant addition fails.
      */
     public async create(id_user: string, body: { name: string; description: string; date: Date; time: string; address: string; }) {

          const newEvent = await this.db.event.create({
               data: {
                    name: body.name,
                    description: body.description,
                    date: body.date instanceof Date ? body.date : new Date(body.date),
                    time: body.time,
                    address: body.address,
                    user: { connect: { id: id_user } }
               },
          });


          const idAdminRole = await this.roleEventServices.findRoleEvent("admin");

          await this.participantServices.addNewParticipant(newEvent.id, id_user, idAdminRole!.id);

          return newEvent.id;
     }

     /**
      * Retrieves all upcoming events for a specific user, where the user is a participant.
      *
      * @param id_user - The unique identifier of the user whose events are to be fetched.
      * @returns A promise that resolves to an array of participant records, each including:
      * - The participant's user details (id, email, firstname, lastname).
      * - The associated event details, including the event creator's user information.
      *
      * The events returned are filtered to only include those with a date greater than the current date,
      * and are ordered in ascending order by event date.
      */
     public async findAllUserEvent(id_user: User['id']) {

          const now = new Date();

          const events = await this.db.participant.findMany({
               where: {
                    event: { date: { gt: now }, },
                    id_user

               },
               orderBy: { event: { date: 'asc' } },
               include: {
                    user: {
                         select: {
                              id: true,
                              email: true,
                              firstname: true,
                              lastname: true
                         }
                    },
                    event: {
                         include: {
                              user: {
                                   select: {
                                        id: true,
                                        email: true,
                                        firstname: true,
                                        lastname: true
                                   }
                              }
                         }
                    }
               }
          });

          return events
     }

     /**
      * Retrieves a specific event for a user if the user is a participant.
      *
      * @param id_user - The ID of the user requesting the event.
      * @param id_event - The ID of the event to retrieve.
      * @returns The event details if found and the user is a participant.
      * @throws Will throw an error if the event is not found or the user is not a participant.
      */
     public async findOneEvent(id_user: string, id_event: string) {

          const event = await this.participantServices.findParticipantByUserIdAndEventId(id_user, id_event);

          if (!event) {
               throw throwError(404, "Événement introuvable ou vous n'êtes pas un participant de cet événement");
          }

          return event;
     }

     /**
      * Retrieves all participants for a specific event, ensuring the requesting user is a participant.
      *
      * @param id_event - The unique identifier of the event.
      * @param id_user - The unique identifier of the user requesting the participants.
      * @returns A promise that resolves to an array of participants for the specified event.
      * @throws {Error} Throws a 404 error if the event is not found or the user is not a participant of the event.
      */
     public async getAllParticipantsForEvent(id_user: string, id_event: string) {

          const event = await this.participantServices.findParticipantByUserIdAndEventId(id_user, id_event);

          if (!event) {
               throw throwError(404, "Événement introuvable ou vous n'êtes pas un participant de cet événement");
          }

          const participants = await this.participantServices.findAllParticipantByEventId(id_event);

          return participants
     }

     /**
      * Updates the role of a participant in a specific event.
      *
      * This method allows an admin to change the role of another participant within an event.
      * It performs the following checks:
      * - The requester must be a participant with the "admin" role in the event.
      * - The target participant must exist in the event.
      * - The target participant must not already have the "admin" role.
      *
      * @param validatedData - An object containing:
      *   - `id_event`: The ID of the event.
      *   - `id_user`: The ID of the participant whose role is to be updated.
      *   - `id_role`: The new role ID to assign to the participant.
      * @param userId - The ID of the user making the request (requester).
      * @throws Throws a 403 error if the requester is not an admin or tries to modify an admin.
      * @throws Throws a 404 error if the target participant is not found.
      * @returns A promise that resolves when the participant's role is updated.
      */
     public async updateParticipant(validatedData: { id_event: string; id_user: string; id_role: string }, userId: string) {
          const [requesterParticipant, adminRole, targetParticipant] = await Promise.all([
               this.participantServices.findOneParticipant(userId, validatedData.id_event),
               this.roleEventServices.findRoleEvent("admin"),
               this.participantServices.findOneParticipant(validatedData.id_user, validatedData.id_event),
          ]);

          if (!requesterParticipant || requesterParticipant.roleRef.id !== adminRole?.id) {
               throw throwError(403, "Vous n'avez pas les droits pour modifier le rôle d'un participant");
          }

          if (!targetParticipant) {
               throw throwError(404, "Participant introuvable pour cet événement");
          }

          if (targetParticipant.roleRef.name === "admin") {
               throw throwError(403, "Vous ne pouvez pas modifier le rôle d'un administrateur");
          }

          await this.db.participant.update({
               where: { id: targetParticipant.id },
               data: { id_role: validatedData.id_role }
          });
     }

     /**
      * Retrieves an event by its unique identifier.
      *
      * @param id - The unique identifier of the event to retrieve.
      * @param checkError - If true, throws a 404 error when the event is not found. Defaults to true.
      * @returns A promise that resolves to the event object if found, or null if not found and `checkError` is false.
      * @throws {HttpError} Throws a 404 error if the event is not found and `checkError` is true.
      */
     public async findEventById(id: string, checkError = true) {
          const event = await this.db.event.findUnique({
               where: { id }
          });

          if (!event && checkError) {
               throw throwError(404, "Événement introuvable");
          }

          return event;
     }
}
