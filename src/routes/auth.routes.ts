import { Elysia, t } from "elysia";
import { userModel } from "../models/User";
import { authPlugin } from "../plugins/jwtAuth/authPlugin";
import { ACCESS_TOKEN_EXP } from "../config/auth-config";
import { getExpTimestamp } from "../lib/utils/getExpTimestamp";
import { jwtConfig } from "../plugins/jwtAuth/jwtConfig";
import { AuthServices } from "../services/auth/auth.services";
import { handleError } from "../lib/utils/errorHandler/errorHandler";
import { sendResponse } from "../lib/utils/returnSuccess/returnSuccess";
import { rateLimit } from "elysia-rate-limit";

export const auth = new Elysia({ prefix: "/auth" })
     .use(rateLimit({
          max: 10,
          errorResponse: new Response(
               JSON.stringify({
                    error: { error: 'Trop de requêtes. Réessayez plus tard.' },
                    message: "Trop de requêtes. Réessayez plus tard."
               }),
               {
                    status: 429,
                    headers: { 'Content-Type': 'application/json' }
               }
          ),
          countFailedRequest: true,
     }))

     .use(userModel)

     .decorate('authServices', new AuthServices())

     .use(jwtConfig)


     .post(
          "/login",

          async (ctx) => {

               try {

                    const user = await ctx.authServices.login(ctx.body);

                    const accessJWTToken = await ctx.jwt.sign({
                         sub: user.id,
                         exp: getExpTimestamp(ACCESS_TOKEN_EXP),
                    });

                    ctx.cookie.accessToken.set({
                         value: accessJWTToken,
                         httpOnly: true,
                         maxAge: ACCESS_TOKEN_EXP,
                         path: "/",
                    });

                    return sendResponse(ctx, 200, { user, accessToken: accessJWTToken });

               } catch (err) {
                    const { status, error: errorResponse } = handleError(err);

                    throw ctx.error(status, errorResponse);
               }
          },
          {
               body: 'login',
               detail: {
                    tags: ['Auth'],
                    summary: 'Request to log in a user',
               }
          }
     )

     .post(
          "/register",
          async (ctx) => {
               try {
                    await ctx.authServices.register(ctx.body);

                    return sendResponse(ctx, 201, "Utilisateur créé avec succès");

               } catch (err) {
                    console.error(err);

                    const { status, error: errorResponse } = handleError(err);

                    throw ctx.error(status, errorResponse);
               }
          },

          {
               body: 'user',
               detail: {
                    tags: ['Auth'],
                    summary: 'Request to register a user',
               }
          })

     .post(
          '/generatePasswordReset',

          async (ctx) => {
               try {
                    const { email } = ctx.body;

                    const { message } = await ctx.authServices.generatePasswordReset({ email: email.toLowerCase() });

                    return sendResponse(ctx, 200, message);

               } catch (err) {
                    const { status, error: errorResponse } = handleError(err);

                    throw ctx.error(status, errorResponse);
               }
          },
          {
               body: t.Object({
                    email: t.String({ format: "email", errors: "L'adresse e-mail n'est pas valide" })
               }),
               detail: {
                    tags: ['Auth'],
                    summary: 'Request to generate a password reset link',
               }
          }
     )
     .get(
          '/checkUserRequest',
          async (ctx) => {

               try {

                    await ctx.authServices.checkUserRequest(ctx.query);

                    return sendResponse(ctx, 200, { success: true, message: "Demande de réinitialisation de mot de passe valide" });

               } catch (err) {

                    const { status, error: errorResponse } = handleError(err);

                    throw ctx.error(status, errorResponse);
               }

          }, {
          detail: {
               tags: ['Auth'],
               summary: 'Request to check if a password reset request is valid',
          },
          query: t.Object({
               token: t.String(),
               userId: t.String({ format: 'uuid' })
          }),
     })

     .post(
          '/changePassword',

          async (ctx) => {
               try {
                    const { token, userId, password } = ctx.body;

                    await ctx.authServices.changePassword({ token, userId, password });

                    return sendResponse(ctx, 200, "Mot de passe changé avec succès");

               } catch (err) {
                    const { status, error: errorResponse } = handleError(err);

                    throw ctx.error(status, errorResponse);
               }
          },
          {
               body: t.Object({
                    token: t.String(),
                    userId: t.String({ format: 'uuid' }),
                    password: t.String({
                         error: 'Le mot de passe est invalide, il doit comporter au moins 8 caractères, dont une majuscule, un chiffre et un caractère spécial (@$!%*?&)',
                         pattern: '^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,30}$'

                    })
               }),
               detail: {
                    tags: ['Auth'],
                    summary: 'Request to change a user\'s password',
               }
          }
     )

export const authLogged = new Elysia({ prefix: "/auth" })

     .decorate('authServices', new AuthServices())

     .use(jwtConfig)

     .use(authPlugin)

     .get('/me', ({ user }) => {

          return user
     },
          {
               detail: {
                    tags: ['Auth'],
                    summary: 'Request to get the connected user\'s information',
               }
          })