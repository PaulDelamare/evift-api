import { Elysia, t } from "elysia";
import { authPlugin } from "../plugins/jwtAuth/authPlugin";
import { jwtConfig } from "../plugins/jwtAuth/jwtConfig";
import { sendResponse } from "../lib/utils/returnSuccess/returnSuccess";
import { handleError } from "../lib/utils/errorHandler/errorHandler";
import { RequestAccountServices } from "../services/requestAccount/requestAccount.services";

export const requestAccount = new Elysia({ prefix: "/requestAccount" })

     .decorate("requestAccount", new RequestAccountServices())

     .use(jwtConfig)

     .post('/createAccount',

          async (ctx) => {
               try {
                    await ctx.requestAccount.createRequestAccount(ctx.body);
                    return sendResponse(ctx, 201, "Le compte a été créé avec succès.");
               } catch (error) {
                    const { status, error: errorResponse } = handleError(error);
                    throw ctx.error(status, errorResponse);
               }
          },
          {
               body: t.Object({
                    firstname: t.String({ error: "Le prénom est requis" }),
                    lastname: t.String({ error: "Le nom est requis" }),
                    email: t.String({
                         format: "email",
                         error: "L'adresse email est invalide",
                    }),
                    password: t.String({
                         error: 'Le mot de passe est invalide, il doit comporter au moins 8 caractères, dont une majuscule, un chiffre et un caractère spécial (@$!%*?&)',
                         pattern: '^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,30}$'

                    }),
                    token: t.String({ error: "Le token est requis" }),
               }),
               detail: {
                    tags: ['Invitation'],
                    summary: 'Creates a new user account and associates all existing invitations with this account.',
               }
          }
     )

     .get('/check/:email/:token',

          async (ctx) => {
               try {

                    await ctx.requestAccount.checkRequestAccount(ctx.params.email.toLowerCase(), ctx.params.token, true);

                    return sendResponse(ctx, 200, "La demande de création de compte est valide.");

               } catch (error) {

                    const { status, error: errorResponse } = handleError(error);
                    throw ctx.error(status, errorResponse);
               }
          },
          {
               params: t.Object({
                    email: t.String({
                         format: "email",
                         error: "L'adresse email est invalide",
                    }),
                    token: t.String({ error: "Le token est requis" }),
               }),
               detail: {
                    tags: ['Invitation'],
                    summary: 'Simply checks that the user has a valid invitation.',
               }
          }
     )


     .use(authPlugin)

     .post(
          "/",

          async (ctx) => {

               try {

                    await ctx.requestAccount.requestAccount(ctx.body.email.toLowerCase(), ctx.user.id, ctx.body.id_event);

                    return sendResponse(ctx, 200, "La demande a été envoyée avec succès.");

               } catch (error) {

                    const { status, error: errorResponse } = handleError(error);
                    throw ctx.error(status, errorResponse);
               }
          },
          {
               body: t.Object({
                    email: t.String({
                         format: "email",
                         error: "L'adresse email est invalide",
                    }),
                    id_event: t.Nullable(t.String({
                         format: "uuid",
                         error: "L'identifiant de l'événement est invalide",
                    }))
               }),
               detail: {
                    tags: ['Invitation'],
                    summary: 'Send an invitation email to a user without an account. When the user creates their account, all invitations assigned to them will be available on the platform.',
               }
          }
     )

