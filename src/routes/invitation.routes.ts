// ! IMPORTS
import { Elysia, t } from "elysia";
import { InvitationController } from "../controllers/invitation.controller";
import { authPlugin } from "../plugins/jwtAuth/authPlugin";
import { jwtConfig } from "../plugins/jwtAuth/jwtConfig";
import { User } from "../models/User";
import { InvitationServices } from "../services/invitation/invitation.services";
import { sendResponse } from "../lib/utils/returnSuccess/returnSuccess";
import { handleError } from "../lib/utils/errorHandler/errorHandler";
import { EventInvitationServices } from "../services/eventInvitation/eventInvitation.services";

// Create Invitaion Route
export const invite = new Elysia({ prefix: "/invitation" })

     .decorate("invitationController", new InvitationController())
     .decorate("invitationServices", new InvitationServices())
     .decorate("eventInvitationServices", new EventInvitationServices())

     .use(jwtConfig)
     .use(authPlugin)


     .post(
          "/request",

          async (ctx) => {

               try {

                    const message = await ctx.invitationServices.invitationUser(ctx.body.id, ctx.user.id);
                    return sendResponse(ctx, 200, message);

               } catch (error) {

                    const { status, error: errorResponse } = handleError(error);
                    throw ctx.error(status, errorResponse);
               }
          },
          {
               body: t.Object({
                    id: t.String({
                         format: "uuid",
                         error: "L'adresse email est invalide",
                    }),
               }),
               detail: {
                    tags: ['Invitation'],
                    summary: 'Send request for add friend to an other user or validate a reverse request',
               }
          }
     )

     .get(
          "/findAll",

          async (ctx) => {
               try {

                    const invitation = await ctx.invitationServices.findInvitations(ctx.user.id);
                    return sendResponse(ctx, 200, invitation);

               } catch (error) {

                    const { status, error: errorResponse } = handleError(error);
                    throw ctx.error(status, errorResponse);
               }
          },
          {
               detail: {
                    tags: ['Invitation'],
                    summary: 'Find all Friends Request for our account'
               }
          }
     )

     .post(
          "/accept",

          async (ctx) => {
               try {
                    const invitation = await ctx.invitationServices.acceptInvitation(
                         ctx.body.id,
                         ctx.user.id,
                         ctx.body.response
                    );
                    return sendResponse(ctx, 200, invitation);

               } catch (error) {

                    const { status, error: errorResponse } = handleError(error);
                    throw ctx.error(status, errorResponse);
               }
          },
          {
               body: t.Object({
                    id: t.String({
                         format: "uuid",
                         error: "L'id est invalide",
                    }),
                    response: t.Boolean({
                         error: "La réponse doit est true ou false",
                    }),
               }),
               detail: {
                    tags: ['Invitation'],
                    summary: 'Send response for add friend or just delete request'
               }
          }
     )

     // ? Send request for participation in an event
     .post(
          "/requestEvent",

          async (ctx) => {
               try {

                    await ctx.eventInvitationServices.eventInvitation(
                         ctx.body.invitationId,
                         ctx.user.id,
                         ctx.body.eventId
                    );
                    return sendResponse(ctx, 200, "Invitation(s) envoyée(s) avec succès !");

               } catch (error) {

                    const { status, error: errorResponse } = handleError(error);
                    throw ctx.error(status, errorResponse);
               }
          },
          {
               body: t.Object({
                    invitationId: t.Array(
                         t.String({
                              format: "uuid",
                              error: "Les ids des utilisateurs sont invalides",
                         }),
                    ),
                    eventId: t.String({
                         format: "uuid",
                         error: "L'id de l'evènement est invalide",
                    }),
               }),
               detail: {
                    tags: ['Invitation'],
                    summary: 'Send request for participation in an event'
               }
          }
     )

     .get(
          "/eventInvitation",

          async (ctx) => {
               try {

                    const invitations = await ctx.eventInvitationServices.getEventInvitations(
                         ctx.user.id
                    );
                    return sendResponse(ctx, 200, invitations);

               } catch (error) {

                    const { status, error: errorResponse } = handleError(error);
                    throw ctx.error(status, errorResponse);
               }
          },
          {

               detail: {
                    tags: ['Invitation'],
                    summary: 'Get all request for participation in an event'
               }
          }
     )

     .post(
          "/responseEventInvitation",

          async (ctx) => {
               try {

                    const message = await ctx.eventInvitationServices.responseEventInvitation(
                         ctx.user.id,
                         ctx.body.invitationId,
                         ctx.body.response
                    );
                    return sendResponse(ctx, 200, message);

               } catch (error) {

                    const { status, error: errorResponse } = handleError(error);
                    throw ctx.error(status, errorResponse);
               }
          },
          {
               body: t.Object({
                    invitationId: t.String({
                         format: "uuid",
                         error: "L'id de l'evènement est invalide",
                    }),
                    response: t.Boolean({
                         error: "La réponse doit est true ou false",
                    }),
               }),
               detail: {
                    tags: ['Invitation'],
                    summary: 'Give response for participation in an event'
               }
          }
     )

     .get(
          "/count",

          async (ctx) => {
               try {

                    const notifications = await ctx.eventInvitationServices.getInvitationNotifications(
                         ctx.user.id
                    );
                    return sendResponse(ctx, 200, notifications);

               } catch (error) {

                    const { status, error: errorResponse } = handleError(error);
                    throw ctx.error(status, errorResponse);
               }
          },
          {
               detail: {
                    tags: ['Invitation'],
                    summary: 'Get count for event and friends invitation'
               }
          }
     )