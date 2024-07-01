// ! IMPORTS
import { Elysia, t } from "elysia";
import { authPlugin } from "../plugins/jwtAuth/authPlugin";
import { jwtConfig } from "../plugins/jwtAuth/jwtConfig";
import { User } from "../models/User";
import { eventModel } from "../models/Event";
import { EventController } from "../controllers/event.controller";

// Create Invitaion Route
export const event = new Elysia({ prefix: "/event" })
     // ! CONFIGURATION
     // Declare controller Class
     .decorate("eventController", new EventController())

     // ! Error Handler
     .onError(({ code, error }) => {
          // If Error is an instance of ValidationError
          if (code === "VALIDATION")
               // Throw Error
               return { status: error.status, error: error.message };
     })

     // ? Use jwtConfig
     .use(jwtConfig)

     // HANDLER

     // ? Use Plugin for check if user is logged
     .use(authPlugin)

     // Import model for user
     .use(eventModel)

     // ! ROUTES

     // ? Post request friends invitation
     .post(
          // - Path
          "/create",

          // - Function
          async ({ body, set, eventController, user }) => {
               console.log(body)

               // Define user as User type
               const userData = user! as User;

               // get Response from invitationController
               const response = await eventController.create(
                    userData.id,
                    body
               );

               // Set status with status Reponse
               set.status = response.status;

               // Return response
               return response;
          },

          // - VALIDATION
          {
               detail: {
                    tags: ['Event'],
                    summary: 'Request for create event'
               },
               body: 'create',

          }
     );
