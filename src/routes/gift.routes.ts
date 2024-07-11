// ! IMPORTS
import { Elysia, t } from "elysia";
import { authPlugin } from "../plugins/jwtAuth/authPlugin";
import { jwtConfig } from "../plugins/jwtAuth/jwtConfig";
import { User } from "../models/User";
import { GiftController } from "../controllers/gift.controller";
import { giftModel } from "../models/Gift";

// Create Gift Route
export const gift = new Elysia({ prefix: "/gift" })
     // ! CONFIGURATION
     // Declare controller Class
     .decorate("giftController", new GiftController())

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
     .use(giftModel)

     // ! ROUTES

     .get(
          // - Path
          "/findAll",

          // - Function
          async ({ set, giftController, user }) => {
               // Define user as User type
               const userData = user! as User;

               // get Response from invitationController
               const response = await giftController.findAll(userData.id);

               // Set status with status Reponse
               set.status = response.status;

               // Return response
               return response;
          },
          {
               detail: {
                    tags: ['Gift'],
                    summary: 'Get all user gift list'
               },
          }
     )

     // ? Post new gift
     .post(
          // - Path
          "/create",

          // - Function
          async ({ body, set, giftController, user }) => {

               // Define user as User type
               const userData = user! as User;

               // get Response from invitationController
               const response = await giftController.create(
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
                    tags: ['Gift'],
                    summary: 'Create a new user gift list'
               },
               body: 'createList',
          }
     )

     .post(
          // - Path
          "/listEvent",

          // - Function
          async ({ body, set, giftController, user }) => {
               // Define user as User type
               const userData = user! as User;

               // get Response from invitationController
               const response = await giftController.addListEvent(
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
                    tags: ['Gift'],
                    summary: 'Create a new user gift list'
               },
               body: t.Object({
                    idEvent: t.String({ format: "uuid", errors: "L'id de l'evènement n'est pas valide" }),
                    idList: t.String({ format: "uuid", errors: "L'id de la liste n'est pas valide" })
               }),
          }
     )

     .get(
          // - Path
          "/findListEvent/:idEvent",

          // - Function
          async ({ set, giftController, user, params }) => {
               // Define user as User type
               const userData = user! as User;

               // get Response from invitationController
               const response = await giftController.findListEvent(userData.id, params.idEvent);

               // Set status with status Reponse
               set.status = response.status;

               // Return response
               return response;
          },
          {
               detail: {
                    tags: ['Gift'],
                    summary: 'Get all user gift list by event'
               },
               params: t.Object({
                    idEvent: t.String({ format: "uuid", errors: "L'id de l'evènement n'est pas valide" })
               }),
          }
     )

     .delete(
          // - Path
          "/deleteListEvent",

          // - Function
          async ({ set, giftController, user, body }) => {
               // Define user as User type
               const userData = user! as User;

               // get Response from invitationController
               const response = await giftController.removeListEvent(userData.id, body);

               // Set status with status Reponse
               set.status = response.status;

               // Return response
               return response;
          },

          // - VALIDATION
          {
               detail: {
                    tags: ['Gift'],
                    summary: 'Delete a new user gift list'
               },
               body: t.Object({
                    idEvent: t.String({ format: "uuid", errors: "L'id de l'evènement n'est pas valide" }),
                    idList: t.String({ format: "uuid", errors: "L'id de la liste n'est pas valide" })
               }),
          }
     )

     .get(
          // - Path
          "/findList/:idList",

          // - Function
          async ({ set, giftController, user, params }) => {
               // Define user as User type
               const userData = user! as User;

               // get Response from invitationController
               const response = await giftController.findList(userData.id, params.idList);

               // Set status with status Reponse
               set.status = response.status;

               // Return response
               return response;
          },
          {
               detail: {
                    tags: ['Gift'],
                    summary: 'Get all user gift list'
               },
               params: t.Object({
                    idList: t.String({ format: "uuid", errors: "L'id de la liste n'est pas valide" })
               }),
          }
     )

     .post(
          // - Path
          "/checkGift",

          // - Function
          async ({ set, giftController, user, body }) => {

               // Define user as User type
               const userData = user! as User;

               // get Response from invitationController
               const response = await giftController.checkGift(userData.id, body);

               // Set status with status Reponse
               set.status = response.status;

               // Return response
               return response;
          },

          // - VALIDATION
          {
               detail: {
                    tags: ['Gift'],
                    summary: 'Get all user gift list'
               },
               body: t.Object({
                    idEvent: t.String({ format: "uuid", errors: "L'id de l'evènement n'est pas valide" }),
                    idGift: t.String({ format: "uuid", errors: "L'id du cadeau n'est pas valide" }),
                    checked: t.Boolean({errors: "La valeur de checked n'est pas valide"})
               }),
          }
     )
