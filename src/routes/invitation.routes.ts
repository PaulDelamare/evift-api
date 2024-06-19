// ! IMPORTS
import { Elysia, t } from "elysia";
import { InvitationController } from "../controllers/invitation.controller";
import { authPlugin } from "../plugins/jwtAuth/authPlugin";

import { jwtConfig } from "../plugins/jwtAuth/jwtConfig";
import { User } from "../models/User";

// Create Invittaion Route
export const invite = new Elysia({ prefix: "/invitation" })
    // ! CONFIGURATION
    // Declare controller Class
    .decorate("invitationController", new InvitationController())

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
    .post(
        "/request",
        async ({ body, set, invitationController, user }) => {
            const userData = user! as User;

            // get Response from register method
            const response = await invitationController.invitationUser(
                body,
                userData.id
            );

            // Set status with status Reponse
            set.status = response.status;

            // Return response
            return response;
        },
        {
            body: t.Object({
                id: t.String({
                    format: "uuid",
                    error: "L'adresse email est invalide",
                }),
            }),
        }
    );
