// ! IMPORTS
import { Elysia, t } from "elysia";
import { authPlugin } from "../plugins/jwtAuth/authPlugin";
import { eventModel } from "../models/Event";
import { EventServices } from "../services/event/event.services";
import { handleError, throwError } from "../lib/utils/errorHandler/errorHandler";
import { sendResponse } from "../lib/utils/returnSuccess/returnSuccess";

// Create Event Route
export const event = new Elysia({ prefix: "/event" })
     .decorate("eventServices", new EventServices())
     .use(authPlugin)
     .use(eventModel)

     .post(
          "/create",
          async (ctx) => {
               try {

                    const eventId = await ctx.eventServices.create(ctx.user.id, ctx.body);
                    return sendResponse(ctx, 201, { eventId });

               } catch (err) {

                    const { status, error: errorResponse } = handleError(err);
                    throw ctx.error(status, errorResponse);
               }
          },

          {
               detail: {
                    tags: ['Event'],
                    summary: 'Create an event and add the creator as a participant with admin role',
               },
               body: 'create',
          }
     )

     .get(
          "/getAll",
          async (ctx) => {
               try {

                    const events = await ctx.eventServices.findAllUserEvent(ctx.user.id);
                    return sendResponse(ctx, 200, events);

               } catch (error) {

                    const { status, error: errorResponse } = handleError(error);
                    throw ctx.error(status, errorResponse);
               }
          },

          {
               detail: {
                    tags: ['Event'],
                    summary: 'Find all events for a user',
               }
          }
     )

     .get(
          "/getOneEvent/:id",
          async (ctx) => {
               try {

                    const event = await ctx.eventServices.findOneEvent(ctx.user.id, ctx.params.id);
                    return sendResponse(ctx, 200, event);

               } catch (error) {

                    const { status, error: errorResponse } = handleError(error);
                    throw ctx.error(status, errorResponse);
               }
          },

          {
               params: t.Object({
                    id: t.String({ format: "uuid", error: "L'id doit être un uuid" }),
               }),
               detail: {
                    tags: ['Event'],
                    summary: 'Find information about a specific event',
               }
          }
     )

     .get(
          "/getAllParticipantsForEvent/:id",
          async (ctx) => {
               try {

                    const participants = await ctx.eventServices.getAllParticipantsForEvent(ctx.user.id, ctx.params.id);
                    return sendResponse(ctx, 200, participants);

               } catch (error) {

                    const { status, error: errorResponse } = handleError(error);
                    throw ctx.error(status, errorResponse);
               }
          },
          {
               params: t.Object({
                    id: t.String({ format: "uuid", error: "L'id doit être un uuid" }),
               }),
               detail: {
                    tags: ['Event'],
                    summary: 'Get all participants for a specific event',
               }
          }
     )

     .patch(
          "/updateParticipant",
          async (ctx) => {
               try {

                    if (ctx.user.id === ctx.body.id_user) {
                         throw throwError(400, "Vous ne pouvez pas modifier votre propre rôle");
                    }

                    await ctx.eventServices.updateParticipant(ctx.body, ctx.user.id);
                    return sendResponse(ctx, 200, "Participant modifié avec succès");

               } catch (error) {

                    const { status, error: errorResponse } = handleError(error);
                    throw ctx.error(status, errorResponse);
               }
          },

          {
               body: t.Object({
                    id_user: t.String({ format: "uuid", error: "L'id doit être un uuid" }),
                    id_event: t.String({ format: "uuid", error: "L'id doit être un uuid" }),
                    id_role: t.String({ format: "uuid", error: "L'id doit être un uuid" }),
               }),
               detail: {
                    tags: ['Event'],
                    summary: 'Update participant for event'
               }
          }
     );

