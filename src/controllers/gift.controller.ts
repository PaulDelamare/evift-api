// ! IMPORTS
import { errorServer } from "../lib/utils/errorServer";
import { PrismaClient } from "@prisma/client";
import { CreateListGift, giftModel } from "../models/Gift";

// ! CLASS
export class GiftController {
     // ! Class Variable
     private readonly bdd: PrismaClient;

     // ! Constructor
     constructor() {
          // Bdd Instance
          this.bdd = new PrismaClient();
     }

     // ! Create List

     /**
      * Creates a new list of gifts for a given user.
      *
      * @param id - The ID of the user.
      * @param body - The details of the list of gifts to create.
      * @return - A promise that resolves to an object with the status code and a success message.
      * If an error occurs, it returns an error server object.
      */
     public async create(id: string, body: CreateListGift) {
          try {
               // Create List
               await this.bdd.listGift.create({
                    // Define data
                    data: {
                         name: body.name,
                         id_user: id,
                         gifts: {
                              // Create gifts
                              createMany: {
                                   data: body.gifts.map(gift => ({
                                        id_user: id,
                                        name: gift.name,
                                        quantity: gift.quantity,
                                        url: gift.url || '',
                                   })),
                              },
                         }
                    },
               });
               return {
                    status: 201,
                    message: 'Liste de cadeaux creer avec succes',
               };
          } catch (error) {
               return errorServer(error, 'Une erreur s\'est produite lors de la creation de la liste de cadeaux');
          }
     }

     /**
      * Retrieves a list of gifts based on the provided user ID.
      *
      * @param id - The ID of the user.
      * @return An object with the status code and the retrieved list of gifts.
      */
     public async findAll(id: string) {
          try {
               const list = await this.bdd.listGift.findMany({
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
               return {
                    status: 200,
                    data: list
               };
          } catch (error) {
               return errorServer(error, 'Une erreur s\'est produite lors de la recuperation des liste de cadeaux');
          }
     }

     /**
      * Finds the list of events for a given user and event.
      *
      * @param idUser - The ID of the user.
      * @param idEvent - The ID of the event.
      * @return - A promise that resolves to an object containing the status code, an optional message, and the list of events.
      */
     public async findListEvent(idUser: string, idEvent: string) {
          // ? Try Request
          try {

               const participants = await this.bdd.participant.findFirst({
                    where: {
                         id_user: idUser,
                         id_event: idEvent
                    }
               })

               if (!participants) {
                    return {
                         status: 401,
                         message: 'Vous ne participez pas à cet évènement'
                    }
               }

               const adminRole = await this.bdd.roleEvent.findFirst({
                    where: {
                         name: "admin",
                    }
               })

               const giftRole = await this.bdd.roleEvent.findFirst({
                    where: {
                         name: "gift",
                    }
               })


               const lists = await this.bdd.listEvent.findMany({
                    where: {
                         id_event: idEvent,
                         participant: {
                              OR: [
                                   { id_role: adminRole?.id },
                                   { id_role: giftRole?.id }
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


               return {
                    status: 200,
                    data: lists
               }
          }
          // ? Catch Error
          catch (error) {
               // If an error occur return error
               return errorServer(error, 'Une erreur s\'est produite lors de la recuperation de la liste de cadeaux');
          }

     }

     /**
      * Adds a list event for a specific user.
      *
      * @param idUser - The ID of the user performing the action.
      * @param body - An object containing the ID of the event and the ID of the list to add.
      * @return An object with the status code and message indicating the success or failure of the list event addition.
      * @throws If an error occurs during the list event addition, an error server object is returned.
      */
     public async addListEvent(idUser: string, body: { idEvent: string; idList: string }) {
          // ? Try Request
          try {
               const participant = await this.bdd.participant.findFirst({
                    where: {
                         id_user: idUser,
                         id_event: body.idEvent
                    },
                    include: {
                         roleRef: true
                    }
               });

               if (!participant || participant.roleRef.name !== "admin" && participant.roleRef.name !== "gift") {
                    return {
                         status: 401,
                         message: 'Vous ne pouvez pas ajouter des cadeaux à cet évènement'
                    }
               }

               const list = await this.bdd.listGift.findFirst({
                    where: {
                         id: body.idList
                    }
               });

               if (!list) {
                    return {
                         status: 404,
                         message: 'Liste de cadeaux introuvable'
                    }
               }

               const listEventParticipant = await this.bdd.listEvent.findFirst({
                    where: {
                         id_participant: participant.id,
                         id_event: body.idEvent
                    }
               });

               if (listEventParticipant) {
                    return {
                         status: 401,
                         error: 'Vous avez déja ajouter ce cadeaux à cet évènement'
                    }
               }

               await this.bdd.listEvent.create({
                    data: {
                         id_event: participant.id_event,
                         id_list: list.id,
                         id_participant: participant.id
                    }
               });

               return {
                    status: 201,
                    message: 'Cadeaux ajouter avec succèss'
               }

          }
          // ? Catch Error
          catch (error) {
               // If an error occurs, return an error message
               return errorServer(error, 'Une erreur s\'est produite lors de l\'ajout de la liste de cadeaux')
          }
     }

     /**
      * A function to remove a list event for a specific user.
      *
      * @param idUser - The ID of the user performing the action.
      * @param body - An object containing the ID of the event and the ID of the list to remove.
      * @return An object with the status and message indicating the success or failure of the list event removal.
      */
     public async removeListEvent(idUser: string, body: { idEvent: string; idList: string }) {
          // ? Try Request
          try {
               const participant = await this.bdd.participant.findFirst({
                    where: {
                         id_user: idUser,
                         id_event: body.idEvent
                    },
                    include: {
                         roleRef: true
                    }
               });

               if (!participant) {
                    return {
                         status: 401,
                         message: 'Vous ne pouvez pas enlever des cadeaux à cet évènement'
                    }
               }

               const listEventParticipant = await this.bdd.listEvent.findFirst({
                    where: {
                         id_participant: participant.id,
                         id_list: body.idList
                    }
               });

               if (!listEventParticipant) {
                    return {
                         status: 401,
                         error: 'Il n\'y a pas de cadeaux à cet évènement'
                    }
               }

               await this.bdd.listEvent.delete({
                    where: {
                         id: listEventParticipant.id
                    }
               });

               return {
                    status: 200,
                    message: 'Cadeaux ajouter avec succèss'
               }

          }
          // ? Catch Error
          catch (error) {
               // If an error occurs, return an error message
               return errorServer(error, 'Une erreur s\'est produite lors de la suppression de la liste de cadeaux')
          }
     }

     /**
      * A function to find a list based on the provided user and list IDs.
      *
      * @param idUser - The ID of the user performing the action.
      * @param idList - The ID of the list to find.
      * @return An object with the status code and the list data if found, or an error message if not found.
      */
     public async findList(idUser: string, idList: string) {

          // ? Try Request
          try {
               const list = await this.bdd.listEvent.findFirst({
                    where: {
                         id: idList
                    },
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

               if (!list) {
                    return {
                         status: 404,
                         message: 'Liste de cadeaux introuvable'
                    }
               }

               const participant = await this.bdd.participant.findFirst({
                    where: {
                         id_user: idUser,
                         id_event: list.id_event
                    }
               });

               if (!participant) {
                    return {
                         status: 401,
                         message: 'Vous ne pouvez pas voir la liste de cadeaux'
                    }
               }

               return {
                    status: 200,
                    data : list
               }
          }
          // ? Catch Error 
          catch (error) {

               // If an error occurs, return an error message
               return errorServer(error, 'Une erreur s\'est produite lors de la recherche de la liste de cadeaux')

          }
     }

     public async checkGift(idUser: string, body: { idEvent: string; idGift: string; checked: boolean }) {
          // ? Try Request
          try {

               const gift = await this.bdd.gifts.findFirst({
                    where: {
                         id: body.idGift
                    }
               });

               if (!gift) {
                    return {
                         status: 404,
                         message: 'Cadeaux introuvable'
                    }
               }

               const list = await this.bdd.listEvent.findFirst({
                    where: {
                         id_list: gift.id_list,
                         id_event : body.idEvent
                    }
               });

               if (!list) {
                    return {
                         status: 404,
                         message: 'Liste de cadeaux introuvable'
                    }
               }

               const participant = await this.bdd.participant.findFirst({
                    where: {
                         id_user: idUser,
                         id_event: list.id_event
                    }
               });

               if (!participant) {
                    return {
                         status: 401,
                         message: 'Vous ne pouvez pas voir la liste de cadeaux'
                    }
               }

               const userTaken = body.checked ? idUser : null;
              
               await this.bdd.gifts.update({
                    where: {
                         id: body.idGift
                    },
                    data: {
                         taken: body.checked,
                         id_userTaken: userTaken
                    }
               });

               return {
                    status: 200,
                    message: 'Cadeaux enregistrer avec succèss'
               }
          }
          // ? Catch Error
          catch (error) {
               // If an error occurs, return an error message
               return errorServer(error, 'Une erreur s\'est produite lors de la suppression de la liste de cadeaux')
          }
     }
}
