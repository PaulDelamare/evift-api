// ! IMPORTS
import { Elysia, t } from "elysia";
import { authPlugin } from "../plugins/jwtAuth/authPlugin";
import { jwtConfig } from "../plugins/jwtAuth/jwtConfig";
import { UserController } from "../controllers/user.controller";

// Create User Route
export const user = new Elysia({ prefix: "/user" })
    // ! CONFIGURATION

    // Declare controller Class
    .decorate("userController", new UserController())

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

    // ? Get user by email
    .get(
        // - Path
        "/findUser/:email",

        // - Function
        async ({ userController, params: { email }, set }) => {

            // get Response from register method
            const response = await userController.findByEmail(email);

            // Set status with status Reponse
            set.status = response.status;

            // Return response
            return response;
        },

        // - VALIDATION
        {
            // Params must be an email
            params: t.Object({
                email: t.String({
                    format: "email",
                    error: "L'adresse email est invalide",
                }),
            }),
        }
    );
