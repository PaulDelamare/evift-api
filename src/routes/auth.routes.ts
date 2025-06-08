// ! IMPORTS
import { Elysia, t } from "elysia";
import { AuthController } from "../controllers/auth.controller";
import { userModel } from "../models/User";
import { authPlugin } from "../plugins/jwtAuth/authPlugin";
import { ACCESS_TOKEN_EXP } from "../config/auth-config";
import { getExpTimestamp } from "../lib/utils/getExpTimestamp";
import { jwtConfig } from "../plugins/jwtAuth/jwtConfig";

export const auth = new Elysia({ prefix: "/auth" })
  // ! CONFIGURATION

  // Import model for user
  .use(userModel)

  // Declare controller Class
  .decorate('authController', new AuthController())

  // ! Error Handler
  .onError(({ code, error }) => {
    if (code === 'VALIDATION')
      return {  status: error.status, error: error };
  })

  .use(jwtConfig)

  // ! ROUTES
  .post(
    "/login",

    async ({ authController, body, jwt, cookie: { accessToken }, set }) => {

      const response = await authController.login(body);

      set.status = response.status;

      if ('error' in response) {
        return response;
      }

      const user = response.data;

      // create access token
      const accessJWTToken = await jwt.sign({
        sub: user.id,
        exp: getExpTimestamp(ACCESS_TOKEN_EXP),
      });

      // set access token cookie
      accessToken.set({
        value: accessJWTToken,
        httpOnly: true,
        maxAge: ACCESS_TOKEN_EXP,
        path: "/",
      });

      return {
        message: "Connexion réussie",
        data: {
          user: user,
          accessToken: accessJWTToken,
          status: 200
        },
      };
    },
    {
      body: 'login',
      detail: {
        tags: ['Auth'],
        summary: 'For login register'
      }
    }
  )

  .post(
    "/register",
    async ({ authController, body, set }) => {

      const response = await authController.register(body);

      set.status = response.status;

      return response;
    },

    {
      body: 'user',
      detail: {
        tags: ['Auth'],
        summary: 'For login user'
      }
    })

  // ? Use Plugin for check if user is logged 
  .use(authPlugin)

  // ? Get current user
  .get('/me', ({ user }) => {

    return user
  },
    {
      detail: {
        tags: ['Auth'],
        summary: 'Get current user information if is logged'
      }
    })