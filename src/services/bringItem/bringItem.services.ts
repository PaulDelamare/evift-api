import { throwError } from "../../lib/utils/errorHandler/errorHandler";
import { BaseService } from "../base.services";
import { UserServices } from "../user/user.services";
import { ParticipantServices } from "../participant/participant.services";

/**
 * Service pour gérer les produits "à ramener".
 * Hypothèse : Prisma models -> bringItem, taken (voir schéma discuté).
 */
export class BringItemServices extends BaseService {
     public userServices: UserServices;
     public participantServices: ParticipantServices;

     constructor(...args: any[]) {
          super(...args);
          this.userServices = new UserServices();
          this.participantServices = new ParticipantServices();
     }

     private async findBringItemOrThrow(id: string) {
          const item = await this.db.bringItem.findUnique({
               where: { id },
               select: {
                    id: true,
                    eventId: true,
                    name: true,
                    requestedQuantity: true,
                    isTaken: true,
                    createdById: true,
               },
          });
          if (!item) throw throwError(404, "Produit introuvable");
          return item;
     }

     private async ensureUserIsParticipant(eventId: string, userId: string) {
          await this.participantServices.findParticipantByUserIdAndEventId(userId, eventId, true, true, "Vous n'êtes pas participant de cet événement");
     }


     /**
      * Créer un produit à ramener. Vérifie que l'utilisateur est participant.
      */
     public async createBringItem(eventId: string, userId: string, name: string, requestedQuantity = 1) {

          await this.ensureUserIsParticipant(eventId, userId);

          return this.db.bringItem.create({
               data: {
                    eventId,
                    name: name.trim(),
                    requestedQuantity,
                    createdById: userId,
               },
          });
     }

     /**
      * Prendre (ou mettre à jour) une quantité pour un produit.
      * Transaction atomique : upsert taken + recalcul total + maj isTaken.
      */
     public async takeItem(bringItemId: string, userId: string, quantity: number) {

          const item = await this.findBringItemOrThrow(bringItemId);
          await this.ensureUserIsParticipant(item.eventId, userId);

          return this.db.$transaction(async (tx) => {
               const upserted = await tx.taken.upsert({
                    where: { bringItemId_userId: { bringItemId, userId } },
                    update: { quantity },
                    create: { bringItemId, userId, quantity },
               });

               const agg = await tx.taken.aggregate({ where: { bringItemId }, _sum: { quantity: true } });
               const totalTaken = agg._sum.quantity ?? 0;

               const current = await tx.bringItem.findUnique({ where: { id: bringItemId }, select: { requestedQuantity: true, isTaken: true } });
               if (!current) throw throwError(404, "Produit introuvable pendant la transaction");

               if (totalTaken >= current.requestedQuantity && !current.isTaken) {
                    await tx.bringItem.update({ where: { id: bringItemId }, data: { isTaken: true, takenAt: new Date() } });
               } else if (totalTaken < current.requestedQuantity && current.isTaken) {
                    await tx.bringItem.update({ where: { id: bringItemId }, data: { isTaken: false, takenAt: null } });
               }

               return { upserted, totalTaken, requested: current.requestedQuantity };
          });
     }

     /**
      * Annuler sa prise (supprime la ligne taken pour l'utilisateur) et recalcul isTaken.
      */
     public async releaseTake(bringItemId: string, userId: string) {
          const item = await this.findBringItemOrThrow(bringItemId);
          await this.ensureUserIsParticipant(item.eventId, userId);

          return this.db.$transaction(async (tx) => {
               const existing = await tx.taken.findUnique({ where: { bringItemId_userId: { bringItemId, userId } } });
               if (!existing) throw throwError(404, "Vous n'avez pas de prise pour ce produit");

               await tx.taken.delete({ where: { id: existing.id } });

               // recalcul
               const agg = await tx.taken.aggregate({ where: { bringItemId }, _sum: { quantity: true } });
               const totalTaken = agg._sum.quantity ?? 0;

               const current = await tx.bringItem.findUnique({ where: { id: bringItemId }, select: { requestedQuantity: true, isTaken: true } });
               if (!current) throw throwError(404, "Produit introuvable après suppression");

               if (totalTaken < current.requestedQuantity && current.isTaken) {
                    await tx.bringItem.update({ where: { id: bringItemId }, data: { isTaken: false, takenAt: null } });
               }

               return { totalTaken, requested: current.requestedQuantity };
          });
     }

     /**
      * Lister les items d'un event avec qui a pris quoi (vérifie participation).
      */
     public async listItems(eventId: string, userId: string) {
          await this.ensureUserIsParticipant(eventId, userId);

          return this.db.bringItem.findMany({
               where: { eventId },
               include: {
                    takers: {
                         include: { user: { select: { id: true, firstname: true, lastname: true, email: true } } },
                         orderBy: { createdAt: "asc" },
                    },
               },
               orderBy: { createdAt: "asc" },
          });
     }

     /**
      * Supprimer totalement un produit de la liste.
      * Autorisé : le créateur OU un participant ayant un rôle d'organisateur/owner (liste configurable).
      */
     public async deleteBringItem(bringItemId: string, userId: string) {
          const item = await this.findBringItemOrThrow(bringItemId);

          // si le créateur supprime -> ok
          if (item.createdById === userId) {
               await this.db.bringItem.delete({ where: { id: bringItemId } });
               return { message: "Produit supprimé" };
          }

          // sinon vérifier rôle du participant (adaptable selon ton schema roleRef)
          const participant = await this.participantServices.findOneParticipant(userId, item.eventId);
          if (!participant) throw throwError(401, "Vous n'êtes pas participant de cet événement");

          // Roles considérés comme organisateurs — adapte ces strings selon ton implémentation (ex: 'OWNER', 'ADMIN', 'HOST')
          const allowedOrganizerRoles = ["owner", "organizer", "admin", "host"];
          const roleName = (participant.roleRef?.name || "").toString().toLowerCase();

          if (!allowedOrganizerRoles.includes(roleName)) {
               throw throwError(403, "Vous n'êtes pas autorisé à supprimer ce produit");
          }

          // suppression
          await this.db.bringItem.delete({ where: { id: bringItemId } });
          return { message: "Produit supprimé par un organisateur" };
     }
}
