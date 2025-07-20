import { ListEvent } from "@prisma/client";
import { throwError } from "../../lib/utils/errorHandler/errorHandler";
import { BaseService } from "../base.services";
import { ListEventServices } from "../listEvent/listEvent.services";
import { ListGiftServices } from "../listGift/listGift.services";
import { ParticipantServices } from "../participant/participant.services";
import { RoleEventServices } from "../roleEvent/roleEvent.services";

/**
 * Service class for Gift operations
 * @extends BaseService
 */
export class GiftServices extends BaseService {

     public participantServices: ParticipantServices;
     public listGiftServices: ListGiftServices;
     public listEventServices: ListEventServices;
     public roleEventServices: RoleEventServices;

     constructor(...args: any[]) {
          super(...args);
          this.participantServices = new ParticipantServices();
          this.listGiftServices = new ListGiftServices();
          this.listEventServices = new ListEventServices();
          this.roleEventServices = new RoleEventServices();
     }

     /**
      * Finds a gift by its unique identifier.
      *
      * @param idGift - The unique identifier of the gift to find.
      * @param requireGift - If true (default), throws a 404 error if the gift is not found. If false, returns null when not found.
      * @returns The found gift object, or null if not found and `requireGift` is false.
      * @throws {HttpError} Throws a 404 error if the gift is not found and `requireGift` is true.
      */
     public async findGiftById(idGift: string, requireGift = true) {
          const gift = await this.db.gifts.findFirst({
               where: {
                    id: idGift
               }
          });

          if (!gift && requireGift) {
               throw throwError(404, 'Cadeau introuvable');
          }

          return gift;
     }

     /**
      * Retrieves all gift lists associated with a specific user.
      *
      * @param id - The unique identifier of the user whose gift lists are to be retrieved.
      * @returns A promise that resolves to an array of gift lists, each including their associated gifts and user details.
      *
      * Each gift in the list includes:
      * - list
      * - name
      * - url
      * - createdAt
      * - id_list
      * - id_user
      * - quantity
      * - id
      * - updatedAt
      * - user (with firstname, lastname, and email)
      *
      * @throws Will throw an error if the database query fails.
      */
     public async findAll(id: string) {
          const list = await this.db.listGift.findMany({
               where: {
                    id_user: id
               },
               include: {
                    gifts: {
                         select: {
                              list: true,
                              name: true,
                              url: true,
                              createdAt: true,
                              id_list: true,
                              id_user: true,
                              quantity: true,
                              id: true,
                              updatedAt: true,
                              user: {
                                   select: {
                                        firstname: true,
                                        lastname: true,
                                        email: true
                                   }
                              }
                         }
                    }
               }
          });
          return list;
     }

     /**
      * Creates a new gift list for a user with the specified gifts.
      *
      * @param userId - The ID of the user creating the gift list.
      * @param body - The details of the gift list, including its name and an array of gifts.
      * @param body.name - The name of the gift list.
      * @param body.gifts - An array of gift objects to be included in the list.
      * @param body.gifts[].name - The name of the individual gift.
      * @param body.gifts[].quantity - The quantity of the individual gift.
      * @param body.gifts[].url - (Optional) The URL associated with the gift.
      * @returns The created gift list, including its associated gifts.
      * @throws Will throw an error if the creation fails.
      */
     public async create(userId: string, body: {
          name: string;
          gifts: Array<{
               name: string;
               quantity: number;
               url: string | null;
          }>;
     }) {
          const giftsData = body.gifts.map(gift => ({
               name: gift.name,
               quantity: gift.quantity,
               url: gift.url ?? '',
               id_user: userId,
          }));

          const createdList = await this.db.listGift.create({
               data: {
                    name: body.name,
                    id_user: userId,
                    gifts: {
                         createMany: {
                              data: giftsData,
                              skipDuplicates: true,
                         },
                    },
               },
               include: {
                    gifts: true,
               },
          });

          return createdList;
     }


     /**
      * Adds a gift list to an event for a specific user, ensuring proper permissions and existence.
      *
      * @param idUser - The ID of the user attempting to add the list to the event.
      * @param body - The request body containing event and list IDs.
      * @param body.idEvent - The ID of the event.
      * @param body.idList - The ID of the gift list to add.
      * @throws Will throw an error if the user is not authorized or if the list/event is invalid.
      */
     public async addListEvent(
          idUser: string,
          idEvent: string,
          idList: string
     ): Promise<void> {

          const participant = await this.participantServices.findParticipantByUserIdAndEventId(
               idUser,
               idEvent,
               false
          );

          if (!participant || !["admin", "gift"].includes(participant.roleRef?.name)) {
               throw throwError(401, "Vous ne pouvez pas ajouter des cadeaux à cet évènement");
          }

          await this.listGiftServices.findOneListGift(idList);

          await this.listEventServices.checkIfListInEvent(participant.id, idEvent);

          await this.listEventServices.addListEvent(participant.id, idEvent, idList);
     }



     /**
      * Retrieves all list events associated with a specific event for a given user.
      *
      * This method first verifies that the user is a participant in the event.
      * It then fetches the roles for 'admin' and 'gift', and retrieves all list events
      * for the specified event ID, filtered by these roles.
      *
      * @param idUser - The unique identifier of the user.
      * @param idEvent - The unique identifier of the event.
      * @returns A promise that resolves to the list of event lists.
      * @throws If the user does not participate in the specified event.
      */
     public async findListEvent(idUser: string, idEvent: string): Promise<ListEvent[]> {

          await this.participantServices.findParticipantByUserIdAndEventId(idUser, idEvent, false, false, 'Vous ne participez pas à cet évènement');

          const adminRole = await this.roleEventServices.findRoleEvent('admin');

          const giftRole = await this.roleEventServices.findRoleEvent('gift');

          const lists = await this.listEventServices.findAllListEventByEventId(
               idEvent,
               adminRole?.id ?? null,
               giftRole?.id ?? null
          );

          return lists;
     }

     /**
      * Removes a list from an event for a specific user.
      *
      * @param idUser - The ID of the user performing the removal.
      * @param idEvent - The ID of the event from which the list will be removed.
      * @param idList - The ID of the list to be removed from the event.
      * @returns A promise that resolves when the list has been removed from the event.
      * @throws Will throw an error if the user is not a participant of the event or if the list cannot be found.
      */
     public async removeListEvent(idUser: string, idEvent: string, idList: string): Promise<void> {

          const participant = (await this.participantServices.findParticipantByUserIdAndEventId(idUser, idEvent, false, true, 'Vous ne pouvez pas enlever des cadeaux à cet évènement'))!

          const listEventParticipant = await this.listEventServices.findOneListByParticipantAndList(participant.id, idList, true);

          await this.listEventServices.removeListEvent(listEventParticipant.id);
     }

     /**
      * Retrieves a gift list by its ID and verifies that the specified user has permission to view it.
      *
      * @param idUser - The ID of the user requesting the gift list.
      * @param idList - The ID of the gift list to retrieve.
      * @returns A promise that resolves to the gift list object.
      * @throws If the user does not have permission to view the gift list, an error is thrown.
      */
     public async findList(idUser: string, idList: string): Promise<ListEvent> {

          const list = (await this.listEventServices.findListById(idList))!;

          await this.participantServices.findParticipantByUserIdAndEventId(idUser, list.id_event, false, false, 'Vous ne pouvez pas voir la liste de cadeaux')

          return list
     }

     /**
      * Updates the "checked" status of a gift for a specific user within an event.
      *
      * This method verifies that the user is a participant in the event associated with the gift's list,
      * then updates the gift's "taken" status and the user who took it.
      *
      * @param userId - The ID of the user performing the action.
      * @param idEvent - The ID of the event containing the gift.
      * @param idGift - The ID of the gift to update.
      * @param checked - Whether the gift is being marked as taken (true) or not taken (false).
      * @throws Will throw an error if the gift, list, or user permissions are invalid.
      */
     public async checkGift(
          userId: string,
          idEvent: string,
          idGift: string,
          checked: boolean
     ): Promise<void> {
          const gift = await this.findGiftById(idGift, true);
          const list = await this.listEventServices.findListByListIdAndEventId(gift!.id_list, idEvent, true);

          await this.participantServices.findParticipantByUserIdAndEventId(
               userId,
               list!.id_event,
               false,
               false,
               'Vous ne pouvez pas voir la liste de cadeaux'
          );

          await this.db.gifts.update({
               where: { id: gift!.id },
               data: {
                    taken: checked,
                    id_userTaken: checked ? userId : null
               }
          });
     }

     /**
      * Deletes a gift from the database for a specific user.
      *
      * @param idGift - The unique identifier of the gift to be deleted.
      * @param idUser - The unique identifier of the user who owns the gift.
      * @returns A promise that resolves when the gift has been deleted.
      */
     public async deleteGift(idGift: string, idUser: string): Promise<void> {
          await this.db.gifts.delete({
               where: { id: idGift, id_user: idUser }
          });
     }

     /**
      * Deletes a gift list for a specific user.
      *
      * @param idList - The unique identifier of the gift list to delete.
      * @param idUser - The unique identifier of the user who owns the gift list.
      * @returns A promise that resolves when the gift list has been deleted.
      */
     public async deleteList(idList: string, idUser: string): Promise<void> {
          await this.db.listGift.delete({
               where: { id: idList, id_user: idUser }
          });
     }

     /**
      * Adds multiple gifts to a specified gift list for a user.
      *
      * @param body - An object containing the gift list ID and an array of gifts to add.
      * @param body.id - The ID of the gift list to which gifts will be added.
      * @param body.gifts - An array of gift objects, each containing a name, quantity, and optional URL.
      * @param userId - The ID of the user adding the gifts.
      * @returns A promise that resolves to the result of the bulk creation operation.
      */
     public async addGift(body: {
          id: string;
          gifts: Array<{
               name: string;
               quantity: number;
               url: string | null;
          }>;
     }, userId: string) {

          const giftsData = body.gifts.map(gift => ({
               name: gift.name,
               quantity: gift.quantity,
               url: gift.url ?? '',
               id_user: userId,
               id_list: body.id
          }));

          const createdList = await this.db.gifts.createMany({
               data: giftsData,
               skipDuplicates: true,
          });

          return createdList;
     }
}


