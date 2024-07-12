// ! IMPORTS
import { Elysia, t } from "elysia";
import { authPlugin } from "../plugins/jwtAuth/authPlugin";
import { jwtConfig } from "../plugins/jwtAuth/jwtConfig";
import { RolesController } from "../controllers/roles.controller";

// Create RoleEvent Route
export const rolesEvent = new Elysia({ prefix: "/rolesEvent" })
     // ! CONFIGURATION
     // Declare controller Class
     .decorate("roleController", new RolesController())

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

     // ! ROUTES

     // ? Create new role Event
     // ! TO USE LATER WHEN OTHER REAL ROLE WILL BE CREATED
     // .post(
     //      // - Path
     //      "/create",

     //      // - Function
     //      async ({ body, set, roleController }) => {

     //           // get Response from invitationController
     //           const response = await roleController.create(
     //                body.name
     //           );

     //           // Set status with status Reponse
     //           set.status = response.status;

     //           // Return response
     //           return response;
     //      },

     //      // - VALIDATION
     //      {
     //           detail: {
     //                tags: ['Role'],
     //                summary: 'Request for create new role for user in the event'
     //           },
     //           body: t.Object({
     //                name: t.String()
     //           }),
     //      }
     // )

     .get(
          // - Path
          "/findAll",

          // - Function
          async ({ body, set, roleController }) => {

               // get Response from invitationController
               const response = await roleController.findAll();

               // Set status with status Reponse
               set.status = response.status;

               // Return response
               return response;
          },

          // - VALIDATION
          {
               response: {
                    200: t.Object({
                         data: t.Array(t.Object({
                              id: t.String(),
                              name: t.String(),
                              createdAt: t.Date()
                         })),
                         status: t.Number(),
                    }),
                    500: t.Object({
                         status: t.Number(),
                         error: t.String(),
                    })
               },

               detail: {
                    tags: ['Role'],
                    summary: 'Request for get all event role',
               }

          }
     )
