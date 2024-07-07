// ! IMPORTS
import { Elysia, t } from "elysia";
import { jwtConfig } from "../../plugins/jwtAuth/jwtConfig";
import { authPlugin } from "../../plugins/jwtAuth/authPlugin";

// Create Event Route
export const message = new Elysia({ prefix: "/ws" })
     // ! CONFIGURATION
     // Declare controller Class
     // .decorate("eventController", new EventController())

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
     // .use(eventModel)

     // ! ROUTES

     .get(
          // - Path
          "/message",

          // - Function
          async ({ set }) => {
               set.status = 200;
               return { message: "Hello World" };
          },
     )

     // ? Post event
     .ws('/message', {
          // validate incoming message
          body: t.Object({
               message: t.String(),
               test: t.String()
          }),
          message(ws, { message, test }) {
               console.log(ws.data);
               
               ws.send({
                    test,
                    message,
                    time: Date.now()
               })
          }
     })