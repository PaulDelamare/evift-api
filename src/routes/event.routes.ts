// ! IMPORTS
import { Elysia, t } from "elysia";
import { authPlugin } from "../plugins/jwtAuth/authPlugin";
import { jwtConfig } from "../plugins/jwtAuth/jwtConfig";
import { User } from "../models/User";
import { eventModel } from "../models/Event";
import { EventController } from "../controllers/event.controller";

// Create Event Route
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

     // ? Post event
     .post(
          // - Path
          "/create",

          // - Function
          async ({ body, set, eventController, user }) => {

               // Define user as User type
               const userData = user!  as unknown as User;

               // get Response from eventController
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
     )

     .get(
          // - Path
          "/getAll",

          // - Function
          async ({ set, eventController, user }) => {

               // Define user as User type
               const userData = user!  as unknown as User;
               // get Response from eventController
               const response = await eventController.getAll(userData.id);
               // Set status with status Reponse
               set.status = response.status;
               // Return response
               return response;
          },

          // - VALIDATION
          {
               // For swagger
               detail: {
                    tags: ['Event'],
                    summary: 'Get all events'
               }
          }
     )

     .get(
          // - Path
          "/getOneEvent/:id",

          // - Function
          async ({ set, eventController, user, params }) => {

               // Define user as User type
               const userData = user!  as unknown as User;
               // get Response from eventController
               const response = await eventController.getOneEvent(userData.id, params.id);
               // Set status with status Reponse
               set.status = response.status;
               // Return response
               return response;
          },
          {
               params: t.Object({
                    id: t.String({ format: "uuid", error: "L'id doit être un uuid" }),
               }),
               detail: {
                    tags: ['Event'],
                    summary: 'Get one event'
               }
          }
     )

     .get(
          // - Path
          "/getAllParticipantsForEvent/:id",

          // - Function
          async ({ set, eventController, user, params }) => {

               // Define user as User type
               const userData = user!  as unknown as User;
               // get Response from eventController
               const response = await eventController.getAllParticipantsForEvent(params.id, userData.id);
               // Set status with status Reponse
               set.status = response.status;
               // Return response
               return response;
          },

          // - VALIDATION
          {
               params: t.Object({
                    id: t.String({ format: "uuid", error: "L'id doit être un uuid" }),
               }),
               detail: {
                    tags: ['Event'],
                    summary: 'Get all participants for event'
               }
          }
     )

     .patch(
          // - Path
          "/updateParticipant",

          // - Function
          async ({ body, set, eventController, user, params }) => {

               // Define user as User type
               const userData = user!  as unknown as User;

               if (userData.id !== body.id_user) {
                    // get Response from eventController
                    const response = await eventController.updateParticipant(body.id_event, body.id_user, body.id_role, userData.id);
                    // Set status with status Reponse
                    set.status = response.status;
                    // Return response
                    return response;
               }
               return { status: 400, error: "Vous ne pouvez pas vous modifier" };

          },

          // - VALIDATION
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
     )
