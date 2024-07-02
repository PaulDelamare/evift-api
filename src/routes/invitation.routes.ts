// ! IMPORTS
import { Elysia, t } from "elysia";
import { InvitationController } from "../controllers/invitation.controller";
import { authPlugin } from "../plugins/jwtAuth/authPlugin";
import { jwtConfig } from "../plugins/jwtAuth/jwtConfig";
import { User } from "../models/User";

// Create Invitaion Route
export const invite = new Elysia({ prefix: "/invitation" })
    // ! CONFIGURATION
    // Declare controller Class
    .decorate("invitationController", new InvitationController())

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

    // ? Post request friends invitation
    .post(
        // - Path
        "/request",

        // - Function
        async ({ body, set, invitationController, user }) => {

            // Define user as User type
            const userData = user! as User;

            // get Response from invitationController
            const response = await invitationController.invitationUser(
                body,
                userData.id
            );

            // Set status with status Reponse
            set.status = response.status;

            // Return response
            return response;
        },

        // - VALIDATION
        {
            // Body must have id with format uuid
            body: t.Object({
                id: t.String({
                    format: "uuid",
                    error: "L'adresse email est invalide",
                }),
            }),
            detail: {
                tags: ['Invitation'],
                summary: 'Send request for add friend to an other user'
            }
        }
    )

    // ? Find all Friends Request for our account
    .get(
        // - Path
        "/findAll",

        // - Function
        async ({ body, set, invitationController, user }) => {

            // Define user as User type
            const userData = user! as User;

            // get Response from invitationController
            const response = await invitationController.findInvitations(
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
    )

    // ? Valide or refuse the Friends request

    .post(
        // - Path
        "/accept",

        // - Function
        async ({ body, set, invitationController, user }) => {

            // Define user as User type
            const userData = user! as User;

            // get Response from invitationController
            // For add friend or just delete request
            const response = await invitationController.acceptInvitation(
                body.id,
                userData.id,
                body.response
            );

            // Set status with status Reponse
            set.status = response.status;

            // Return response
            return response;
        },
        {
            // Define body condition
            body: t.Object({
                // Id must be and uuid
                id: t.String({
                    format: "uuid",
                    error: "L'id est invalide",
                }),
                // Response must me an boolean (tru for accept or false for refuse)
                response: t.Boolean({
                    error: "La réponse doit est true ou false",
                }),
            }),
            // Add this to invitation swagger
            detail: {
                tags: ['Invitation'],
                summary: 'Send request for add friend to an other user'
            }
        }
    )

    // ? Send request for participation in an event
    .post(
        // - Path
        "/requestEvent",

        // - Function
        async ({ body, set, invitationController, user }) => {

            // Define user as User type
            const userData = user! as User;

            // get Response from invitationController
            const response = await invitationController.eventInvitation(
                body.invitationId,
                userData.id,
                body.eventId
            );

            // Set status with status Reponse
            set.status = response.status;

            // Return response
            return response;


        },
        {

            // Body must have id with format uuid
            body: t.Object({
                invitationId: t.Array(
                    t.String({
                        format: "uuid",
                        error: "Les ids des utilisateurs sont invalides",
                    }),
                ),
                eventId: t.String({
                    format: "uuid",
                    error: "L'id de l'evènement est invalide",
                }),
            }),
            detail: {
                tags: ['Event'],
                summary: 'Send request for participation in an event'
            }
        }
    )

    .get(
        // - Path
        "/eventInvitation",

        // - Function
        async ({ set, invitationController, user }) => {

            // Define user as User type
            const userData = user! as User;

            // get Response from invitationController
            const response = await invitationController.getEventInvitations(
                userData.id
            );

            // Set status with status Reponse
            set.status = response.status;

            // Return response
            return response;
        },
        {

            // Body must have id with format uuid
            detail: {
                tags: ['Event'],
                summary: 'Get all request for participation in an event'
            }
        }
    )

    // ? Give response for participation in an event
    .post(
        // - Path
        "/responseEventInvitation",

        // - Function
        async ({ body, set, invitationController, user }) => {

            // Define user as User type
            const userData = user! as User;

            // get Response from invitationController
            const response = await invitationController.responseEventInvitation(
                userData.id,
                body.eventId,
                body.response
            );

            // Set status with status Reponse
            set.status = response.status;

            // Return response
            return response;
        },
        {
            // Body must have id event in uuid format and response in boolean
            body: t.Object({
                eventId: t.String({
                    format: "uuid",
                    error: "L'id de l'evènement est invalide",
                }),
                response: t.Boolean({
                    error: "La réponse doit est true ou false",
                }),
            }),
            // Add this to invitation swagger
            detail: {
                tags: ['Event'],
                summary: 'Give response for participation in an event'
            }
        }
    )


    // ? Count all Friends Request for our account
    .get(
        // - Path
        "/count",

        // - Function
        async ({ body, set, invitationController, user }) => {

            // Define user as User type
            const userData = user! as User;

            // get Response from invitationController
            const response = await invitationController.countInvitations(userData.id);

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
    )