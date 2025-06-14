import { Event, RoleEvent, User } from "@prisma/client";
import { BaseService } from "../base.services";
import { throwError } from "../../lib/utils/errorHandler/errorHandler";

/**
 * Service class for Participant operations
 * @extends BaseService
 */
export class ParticipantServices extends BaseService {

     /**
      * Adds a new participant to an event with the specified role.
      *
      * @param eventId - The unique identifier of the event to which the participant will be added.
      * @param idUser - The unique identifier of the user to be added as a participant.
      * @param idRole - The unique identifier of the role assigned to the participant for the event.
      * @returns A promise that resolves when the participant has been successfully added.
      */
     public async addNewParticipant(eventId: Event['id'], idUser: User['id'], idRole: RoleEvent['id']) {

          await this.db.participant.create({
               data: {
                    id_event: eventId,
                    id_user: idUser,
                    id_role: idRole,
               }
          });
     }

     /**
      * Finds a participant record by user ID and event ID.
      *
      * @param idUser - The unique identifier of the user.
      * @param eventId - The unique identifier of the event.
      * @returns A promise that resolves to the participant record if found, including related event and role reference data; otherwise, null.
      */
     public async findEventByUserIdAndEventId(id_user: User['id'], id_event: Event['id'], event = true, roleRef = true, checkError: null | string = null) {
          const participant = await this.db.participant.findFirst({
               where: {
                    id_event,
                    id_user
               },
               include: {
                    event,
                    roleRef
               }
          });

          if (!participant && typeof checkError === 'string') {
               throw throwError(401, checkError);
          }

          return participant;
     }

     /**
      * Retrieves all participants associated with a specific event by its ID.
      *
      * @param id_event - The unique identifier of the event to find participants for.
      * @returns A promise that resolves to an array of participants, each including selected user information and their role reference.
      */
     public async findAllParticipantByEventId(id_event: Event['id']) {

          return await this.db.participant.findMany({
               where: {
                    id_event
               },
               include: {
                    user: {
                         select: {
                              id: true,
                              email: true,
                              firstname: true,
                              lastname: true
                         }
                    },
                    roleRef: true
               }
          });
     }

     /**
      * Retrieves a single participant from the database based on the provided user and event IDs.
      *
      * @param id_user - The unique identifier of the user.
      * @param id_event - The unique identifier of the event.
      * @returns A promise that resolves to the participant object if found, including the related role reference, or null if not found.
      */
     public async findOneParticipant(id_user: User['id'], id_event: Event['id']) {
          return await this.db.participant.findFirst({
               where: {
                    id_event,
                    id_user
               },
               include: {
                    roleRef: true
               }
          });
     }
}
