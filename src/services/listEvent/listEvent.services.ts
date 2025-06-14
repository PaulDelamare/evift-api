import { throwError } from "../../lib/utils/errorHandler/errorHandler";
import { BaseService } from "../base.services";

/**
 * Service class for ListEvent operations
 * @extends BaseService
 */
export class ListEventServices extends BaseService {

     /**
      * Checks if a participant has already added a gift to a specific event.
      *
      * @param participantId - The unique identifier of the participant.
      * @param idEvent - The unique identifier of the event.
      * @throws Throws a 401 error if the participant has already added a gift to the event.
      * @returns Resolves if the participant has not added a gift; otherwise, throws an error.
      */
     public async checkIfListInEvent(participantId: string, idEvent: string) {

          const listEventParticipant = await this.db.listEvent.findFirst({
               where: {
                    id_participant: participantId,
                    id_event: idEvent
               }
          });

          if (listEventParticipant) {
               throw throwError(401, 'Vous avez déja ajouter ce cadeaux à cet évènement');
          }
     }

     /**
      * Adds a list to an event for a specific user (participant).
      *
      * @param idUser - The unique identifier of the user (participant).
      * @param idEvent - The unique identifier of the event.
      * @param idList - The unique identifier of the list to be added.
      * @returns A promise that resolves when the list is successfully added to the event.
      */
     public async addListEvent(
          idUser: string,
          idEvent: string,
          idList: string
     ): Promise<void> {
          await this.db.listEvent.create({
               data: {
                    id_event: idEvent,
                    id_list: idList,
                    id_participant: idUser
               }
          });
     }

     /**
      * Retrieves all list events associated with a specific event ID, filtered by optional admin and gift role IDs.
      *
      * @param idEvent - The unique identifier of the event to retrieve list events for.
      * @param adminRoleId - (Optional) The role ID for admin participants to filter by. If null, admin filtering is skipped.
      * @param giftRoleId - (Optional) The role ID for gift participants to filter by. If null, gift filtering is skipped.
      * @returns A promise that resolves to an array of list events, each including related list details and participant information (with user details).
      */
     public async findAllListEventByEventId(idEvent: string, adminRoleId: string | null, giftRoleId: string | null) {
          const lists = await this.db.listEvent.findMany({
               where: {
                    id_event: idEvent,
                    participant: {
                         OR: [
                              ...(adminRoleId ? [{ id_role: adminRoleId }] : []),
                              ...(giftRoleId ? [{ id_role: giftRoleId }] : [])
                         ]
                    }
               },
               include: {
                    list: true,
                    participant: {
                         include: {
                              user: {
                                   select: {
                                        firstname: true,
                                        lastname: true,
                                        id: true
                                   }
                              }
                         }
                    }
               }
          });

          return lists;
     }

     /**
      * Retrieves a list event participant entry by participant ID and list ID.
      *
      * @param participantId - The unique identifier of the participant.
      * @param listId - The unique identifier of the list.
      * @param requireList - If true, throws a 404 error when the list is not found. Defaults to true.
      * @returns A promise that resolves to the list event participant entry, or null if not found and `requireList` is false.
      * @throws {Error} Throws a 404 error if the list is not found and `requireList` is true.
      */
     public async findOneListByParticipantAndList(
          participantId: string,
          listId: string,
          requireList: true
     ): Promise<NonNullable<Awaited<ReturnType<typeof this.db.listEvent.findFirst>>>>;
     public async findOneListByParticipantAndList(
          participantId: string,
          listId: string,
          requireList?: false
     ): Promise<Awaited<ReturnType<typeof this.db.listEvent.findFirst>> | null>;
     public async findOneListByParticipantAndList(
          participantId: string,
          listId: string,
          requireList = true
     ) {
          const listEventParticipant = await this.db.listEvent.findFirst({
               where: {
                    id_participant: participantId,
                    id_list: listId
               }
          });

          if (!listEventParticipant && requireList) {
               throw throwError(404, 'Liste de cadeaux introuvable');
          }

          return listEventParticipant;
     }

     /**
      * Removes a list event from the database by its unique identifier.
      *
      * @param listEventId - The unique identifier of the list event to be removed.
      * @returns A promise that resolves when the list event has been deleted.
      * @throws Will throw an error if the deletion fails.
      */
     public async removeListEvent(listEventId: string) {
          await this.db.listEvent.delete({
               where: {
                    id: listEventId
               }
          });
     }

     /**
      * Retrieves a list event by its unique identifier, including related gifts and user details.
      *
      * @param idList - The unique identifier of the list event.
      * @param requireList - If true, throws a 404 error when the list is not found. Defaults to true.
      * @returns A promise that resolves to the list event with related data if found.
      * @throws {Error} Throws a 404 error if the list is not found and `requireList` is true.
      */
     public async findListById(
          idList: string,
          requireList?: boolean
     ) {
          const list = await this.db.listEvent.findFirst({
               where: { id: idList },
               include: {
                    list: {
                         include: {
                              gifts: true,
                              user: {
                                   select: {
                                        lastname: true,
                                        firstname: true
                                   }
                              }
                         }
                    }
               }
          });

          if (!list && requireList) {
               throw throwError(404, 'Liste de cadeaux introuvable');
          }

          return list;
     }

     /**
      * Retrieves a list-event association by its list ID and event ID.
      *
      * @param listId - The unique identifier of the list.
      * @param eventId - The unique identifier of the event.
      * @param requireList - If true (default), throws a 404 error if the list is not found; otherwise, returns null.
      * @returns A promise that resolves to the found list-event association object, or null if not found and `requireList` is false.
      * @throws {Error} Throws a 404 error if the list is not found and `requireList` is true.
      */
     public async findListByListIdAndEventId(listId: string, eventId: string, requireList = true) {
          const list = await this.db.listEvent.findFirst({
               where: {
                    id_list: listId,
                    id_event: eventId
               }
          });

          if (!list && requireList) {
               throw throwError(404, 'Liste de cadeaux introuvable');
          }

          return list;
     }
}
