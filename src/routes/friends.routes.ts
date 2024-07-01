// ! IMPORTS
import { Elysia, t } from "elysia";
import { authPlugin } from "../plugins/jwtAuth/authPlugin";
import { jwtConfig } from "../plugins/jwtAuth/jwtConfig";
import { User } from "../models/User";
import { FriendsController } from "../controllers/friends.controller";

// Create Invitaion Route
export const friends = new Elysia({ prefix: "/friends" })
    // ! CONFIGURATION
    // Declare controller Class
    .decorate("friendsController", new FriendsController())

    // ! Error Handler
    .onError(({ code, error }) => {
        // If Error is an instance of ValidationError
        if (code === "VALIDATION")
            // Throw Error
            return { status: error.status, error: error };
    })

    // ? Use jwtConfig
    .use(jwtConfig)

    // HANDLER

    // ? Use Plugin for check if user is logged
    .use(authPlugin)

    // ! ROUTES

    // ? Post request friends invitation
    .get(
        // - Path
        "/findAll",

        // - Function
        async ({ body, set, friendsController, user }) => {

            // Define user as User type
            const userData = user! as User;

            // get Response from invitationController
            const response = await friendsController.findAll(
                userData.id
            );

            // Set status with status Reponse
            set.status = response.status;

            // Return response
            return response;
        },

        // - VALIDATION
        {
            detail: {
                tags: ['Invitation'],
                summary: 'Send request for add friend to an other user'
            }
        }
    );
