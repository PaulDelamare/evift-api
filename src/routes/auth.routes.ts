// ! IMPORTS
import { Elysia, t } from "elysia";
import { AuthController } from "../controllers/auth.controller";
import { userModel } from "../models/User";
import { authPlugin } from "../plugins/jwtAuth/authPlugin";
import { ACCESS_TOKEN_EXP } from "../config/auth-config";
import { getExpTimestamp } from "../lib/utils/getExpTimestamp";
import { jwtConfig } from "../plugins/jwtAuth/jwtConfig";

// Create Authentication Route
export const auth = new Elysia({ prefix: "/auth" })
  // ! CONFIGURATION
  // Import model for user
  .use(userModel)
  // Declare controller Class
  .decorate('authController', new AuthController())

  // ! Error Handler
  .onError(({ code, error }) => {
    // If Error is an instance of ValidationError
    if (code === 'VALIDATION')
      // Throw Error
      return { message: error.message }
  })

  // ? Use jwtConfig
  .use(jwtConfig)

  // ! ROUTES
  //? Create login route
  .post(
    // Accessible with /login path
    "/login",

    // Function
    async ({ authController, body, jwt, cookie: { accessToken }, set }) => {

      // Controller Method
      const response = await authController.login(body);

      // Set status with status Reponse
      set.status = response.status;

      // If Error in response
      if ('error' in response) {
        // Throw Error
        throw new Error(response.error);
      }

      // Get user from response
      const user = response.data;

      // create access token
      const accessJWTToken = await jwt.sign({
        // Use user.id
        sub: user.id,
        // Set exp time
        exp: getExpTimestamp(ACCESS_TOKEN_EXP),
      });

      // set access token cookie
      accessToken.set({
        // Use accessJWTToken
        value: accessJWTToken,
        // Declare cookie options
        httpOnly: true,
        // Set exp time
        maxAge: ACCESS_TOKEN_EXP,
        // Accesible for all routes
        path: "/",
      });

      // Return response
      return {
        // Success message
        message: "Connexion réussie",
        // Return data
        data: {
          // Return user
          user: user,
          // Return access token
          accessToken: accessJWTToken,
        },
      };
    },
    {
      // Use Login verification
      body: 'login',
      // Detail for swagger
      detail: {
        tags: ['Auth']
      }
    }
  )

  //? Create register route
  .post(
    // Accessible with /register path
    "/register",
    // CONTROLLER
    async ({ authController, body, set }) => {

      // get Response from register method
      const response = await authController.register(body);

      // Set status with status Reponse
      set.status = response.status;

      // Return response
      return response;
    },

    // HANDLER
    {
      //- Validation Based on model
      body: 'user',
      //- Detail for swagger
      detail: {
        tags: ['Auth']
      }
    })
  // .use(authPlugin)

  // ? Use Plugin for check if user is logged 
  .use(authPlugin)

  // ? Get current user
  .get('/me', ({ user }) => {

    // Return user
    return user
  })