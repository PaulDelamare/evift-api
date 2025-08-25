import { Elysia, t } from "elysia";
import { authPlugin } from "../plugins/jwtAuth/authPlugin";
import { jwtConfig } from "../plugins/jwtAuth/jwtConfig";
import { BringItemServices } from "../services/bringItem/bringItem.services";
import { sendResponse } from "../lib/utils/returnSuccess/returnSuccess";
import { handleError } from "../lib/utils/errorHandler/errorHandler";

export const bring = new Elysia({ prefix: "/bring" })

     .decorate("bringItemServices", new BringItemServices())

     .use(jwtConfig)
     .use(authPlugin)

     /**
      * Create a bring item
      * body: { eventId, name, requestedQuantity }
      */
     .post(
          "/create",
          async (ctx) => {
               try {
                    const { eventId, name, requestedQuantity } = ctx.body;
                    const item = await ctx.bringItemServices.createBringItem(eventId, ctx.user.id, name, requestedQuantity);
                    return sendResponse(ctx, 201, item);
               } catch (error) {
                    const { status, error: errorResponse } = handleError(error);
                    throw ctx.error(status, errorResponse);
               }
          },
          {
               body: t.Object({
                    eventId: t.String({ format: "uuid", error: "eventId invalide" }),
                    name: t.String({ minLength: 1, error: "Nom requis" }),
                    requestedQuantity: t.Number({ default: 1, minimum: 1, error: "Quantité invalide" }),
               }),
               detail: {
                    tags: ["BringItem"],
                    summary: "Create an item to bring for an event",
               },
          }
     )

     /**
      * Take / update a quantity for an item
      * body: { bringItemId, quantity }
      */
     .post(
          "/take",
          async (ctx) => {
               try {
                    const { bringItemId, quantity } = ctx.body;
                    const res = await ctx.bringItemServices.takeItem(bringItemId, ctx.user.id, quantity);
                    return sendResponse(ctx, 200, res);
               } catch (error) {
                    const { status, error: errorResponse } = handleError(error);
                    throw ctx.error(status, errorResponse);
               }
          },
          {
               body: t.Object({
                    bringItemId: t.String({ format: "uuid", error: "bringItemId invalide" }),
                    quantity: t.Number({ minimum: 1, error: "Quantité invalide" }),
               }),
               detail: {
                    tags: ["BringItem"],
                    summary: "Take / update a quantity for an item",
               },
          }
     )

     /**
      * Release (delete) the current user's take for an item
      * body: { bringItemId }
      */
     .delete(
          "/take",
          async (ctx) => {
               try {
                    const { bringItemId } = ctx.body;
                    const res = await ctx.bringItemServices.releaseTake(bringItemId, ctx.user.id);
                    return sendResponse(ctx, 200, res);
               } catch (error) {
                    const { status, error: errorResponse } = handleError(error);
                    throw ctx.error(status, errorResponse);
               }
          },
          {
               body: t.Object({
                    bringItemId: t.String({ format: "uuid", error: "bringItemId invalide" }),
               }),
               detail: {
                    tags: ["BringItem"],
                    summary: "Cancel your take for an item",
               },
          }
     )

     /**
      * List all items for an event (path param eventId)
      */
     .get(
          "/list/:eventId",
          async (ctx) => {
               try {
                    const { eventId } = ctx.params as { eventId?: string };
                    if (!eventId) throw ctx.error(400, "eventId manquant");
                    // Optionnel: vérification simple du format UUID (si besoin plus stricte, utiliser une util)
                    const items = await ctx.bringItemServices.listItems(eventId, ctx.user.id);
                    return sendResponse(ctx, 200, items);
               } catch (error) {
                    const { status, error: errorResponse } = handleError(error);
                    throw ctx.error(status, errorResponse);
               }
          },
          {
               detail: {
                    tags: ["BringItem"],
                    summary: "List the products of an event and who took what",
               },
          }
     )

     /**
      * Delete an item completely (creator OR organizer)
      * path param bringItemId
      */
     .delete(
          "/item/:bringItemId",
          async (ctx) => {
               try {
                    const { bringItemId } = ctx.params as { bringItemId?: string };
                    if (!bringItemId) throw ctx.error(400, "bringItemId manquant");
                    const res = await ctx.bringItemServices.deleteBringItem(bringItemId, ctx.user.id);
                    return sendResponse(ctx, 200, res);
               } catch (error) {
                    const { status, error: errorResponse } = handleError(error);
                    throw ctx.error(status, errorResponse);
               }
          },
          {
               detail: {
                    tags: ["BringItem"],
                    summary: "Delete a product entirely (creator or organizer only)",
               },
          }
     );
