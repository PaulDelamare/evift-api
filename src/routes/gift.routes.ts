import { Elysia, t } from "elysia";
import { authPlugin } from "../plugins/jwtAuth/authPlugin";
import { jwtConfig } from "../plugins/jwtAuth/jwtConfig";
import { giftModel } from "../models/Gift";
import { GiftServices } from "../services/gift/gift.services";
import { sendResponse } from "../lib/utils/returnSuccess/returnSuccess";
import { handleError } from "../lib/utils/errorHandler/errorHandler";

export const gift = new Elysia({ prefix: "/gift" })

     .decorate("giftServices", new GiftServices())

     .use(jwtConfig)
     .use(authPlugin)

     .use(giftModel)

     .get(
          "/findAll",

          async (ctx) => {
               try {

                    const lists = await ctx.giftServices.findAll(ctx.user.id);
                    return sendResponse(ctx, 200, lists);

               } catch (error) {

                    const { status, error: errorResponse } = handleError(error);
                    throw ctx.error(status, errorResponse);
               }
          },
          {
               detail: {
                    tags: ['Gift'],
                    summary: 'Get all user gift lists',
               },
          }
     )

     .post(
          "/create",

          async (ctx) => {
               try {

                    await ctx.giftServices.create(ctx.user.id, ctx.body);
                    return sendResponse(ctx, 200, "Liste de cadeaux créée avec succès");

               } catch (error) {

                    const { status, error: errorResponse } = handleError(error);
                    throw ctx.error(status, errorResponse);
               }
          },
          {
               detail: {
                    tags: ['Gift'],
                    summary: 'Create a new user gift list'
               },
               body: 'createList',
          }
     )

     .post(
          "/listEvent",

          async (ctx) => {
               try {

                    await ctx.giftServices.addListEvent(ctx.user.id, ctx.body.idEvent, ctx.body.idList);
                    return sendResponse(ctx, 200, "Liste de cadeaux ajoutée à l'événement avec succès");

               } catch (error) {

                    const { status, error: errorResponse } = handleError(error);
                    throw ctx.error(status, errorResponse);
               }
          },
          {
               detail: {
                    tags: ['Gift'],
                    summary: 'Create a new user gift list'
               },
               body: t.Object({
                    idEvent: t.String({ format: "uuid", errors: "L'id de l'evènement n'est pas valide" }),
                    idList: t.String({ format: "uuid", errors: "L'id de la liste n'est pas valide" })
               }),
          }
     )

     .get(
          "/findListEvent/:idEvent",

          async (ctx) => {
               try {

                    const lists = await ctx.giftServices.findListEvent(ctx.user.id, ctx.params.idEvent);
                    return sendResponse(ctx, 200, lists);

               } catch (error) {

                    const { status, error: errorResponse } = handleError(error);
                    throw ctx.error(status, errorResponse);
               }
          },
          {
               detail: {
                    tags: ['Gift'],
                    summary: 'Get all user gift list by event'
               },
               params: t.Object({
                    idEvent: t.String({ format: "uuid", errors: "L'id de l'evènement n'est pas valide" })
               }),
          }
     )

     .delete(
          "/deleteListEvent",

          async (ctx) => {
               try {

                    const lists = await ctx.giftServices.removeListEvent(ctx.user.id, ctx.body.idEvent, ctx.body.idList);
                    return sendResponse(ctx, 200, lists);

               } catch (error) {

                    const { status, error: errorResponse } = handleError(error);
                    throw ctx.error(status, errorResponse);
               }
          },
          {
               detail: {
                    tags: ['Gift'],
                    summary: 'Delete a new user gift list'
               },
               body: t.Object({
                    idEvent: t.String({ format: "uuid", errors: "L'id de l'evènement n'est pas valide" }),
                    idList: t.String({ format: "uuid", errors: "L'id de la liste n'est pas valide" })
               }),
          }
     )

     .get(
          "/findList/:idList",

          async (ctx) => {
               try {

                    const lists = await ctx.giftServices.findList(ctx.user.id, ctx.params.idList);
                    return sendResponse(ctx, 200, lists);

               } catch (error) {

                    const { status, error: errorResponse } = handleError(error);
                    throw ctx.error(status, errorResponse);
               }
          },
          {
               detail: {
                    tags: ['Gift'],
                    summary: 'Get all user gift list'
               },
               params: t.Object({
                    idList: t.String({ format: "uuid", errors: "L'id de la liste n'est pas valide" })
               }),
          }
     )

     .post(
          "/checkGift",

          async (ctx) => {

               try {

                    await ctx.giftServices.checkGift(ctx.user.id, ctx.body.eventId, ctx.body.giftId, ctx.body.taken);
                    return sendResponse(ctx, 200, "Cadeaux enregistrés avec succès");

               } catch (error) {

                    const { status, error: errorResponse } = handleError(error);
                    throw ctx.error(status, errorResponse);
               }
          },
          {
               detail: {
                    tags: ['Gift'],
                    summary: 'Get all user gift list'
               },
               body: t.Object({
                    eventId: t.String({ format: "uuid", errors: "L'id de l'evènement n'est pas valide" }),
                    giftId: t.String({ format: "uuid", errors: "L'id du cadeau n'est pas valide" }),
                    taken: t.Boolean({ errors: "La valeur de checked n'est pas valide" })
               }),
          }
     )

     .delete('/deleteGift/:idGift',

          async (ctx) => {
               try {

                    await ctx.giftServices.deleteGift(ctx.params.idGift, ctx.user.id);
                    return sendResponse(ctx, 200, "Cadeau supprimé avec succès");

               } catch (error) {

                    const { status, error: errorResponse } = handleError(error);
                    throw ctx.error(status, errorResponse);
               }
          },
          {
               detail: {
                    tags: ['Gift'],
                    summary: 'Delete a user gift'
               },
               params: t.Object({
                    idGift: t.String({ format: "uuid", errors: "L'id du cadeau n'est pas valide" })
               }),
          }
     )

     .delete('/deleteList/:idList',

          async (ctx) => {
               try {

                    await ctx.giftServices.deleteList(ctx.params.idList, ctx.user.id);
                    return sendResponse(ctx, 200, "Liste de cadeaux supprimée avec succès");

               } catch (error) {

                    const { status, error: errorResponse } = handleError(error);
                    throw ctx.error(status, errorResponse);
               }
          },
          {
               detail: {
                    tags: ['Gift'],
                    summary: 'Delete a user gift list'
               },
               params: t.Object({
                    idList: t.String({ format: "uuid", errors: "L'id de la liste n'est pas valide" })
               }),
          }
     )

     .post(
          "/addGift/:idGift",

          async (ctx) => {
               try {

                    await ctx.giftServices.addGift(ctx.body, ctx.user.id);
                    return sendResponse(ctx, 200, "Cadeau ajouté avec succès");

               } catch (error) {

                    const { status, error: errorResponse } = handleError(error);
                    throw ctx.error(status, errorResponse);
               }
          },
          {
               detail: {
                    tags: ['Gift'],
                    summary: 'Add a user gift'
               },
               body: 'addGift'
          }
     )
