// ! IMPORTS
import { Elysia } from "elysia";
import { userModel } from "../models/User";
import { authPlugin } from "../plugins/jwtAuth/authPlugin";
import { ACCESS_TOKEN_EXP } from "../config/auth-config";
import { getExpTimestamp } from "../lib/utils/getExpTimestamp";
import { jwtConfig } from "../plugins/jwtAuth/jwtConfig";
import { AuthServices } from "../services/auth/auth.services";
import { handleError } from "../lib/utils/errorHandler/errorHandler";
import { sendResponse } from "../lib/utils/returnSuccess/returnSuccess";

export const auth = new Elysia({ prefix: "/auth" })

     .use(userModel)

     // Declare AuthServices as a dependency
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

     // ? Use Plugin for check if user is logged 
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