// !IMPORTS
import Elysia from "elysia";
import { bdd } from "../../lib/prisma";
import { jwtConfig } from "./jwtConfig";

/**
 * Returns an authentication plugin that verifies the access token and retrieves the user information.
 *
 * @param app - The Elysia application instance.
 * @return - A promise that resolves to an object containing the user information.
 * @throws - Throws an error if the access token is not available, invalid, or the user is not found.
 */
const authPlugin = (app: Elysia) =>
    app
        // Use jwtConfig
        .use(jwtConfig)

        .derive(async ({ jwt, cookie: { accessToken }, set }) => {

            // Verify access token
            if (!accessToken.value) {
                // handle error for access token is not available
                set.status = "Unauthorized";
                throw new Error("Vous devez vous authentifier");
            }

            // Verify access token
            const jwtPayload = await jwt.verify(accessToken.value);
            if (!jwtPayload) {
                // handle error for access token is tempted or incorrect
                set.status = "Forbidden";
                throw new Error("Accès invalide");
            }

            // Find user from access token
            const userId = jwtPayload.sub;
            const user = await bdd.user.findUnique({
                where: {
                    id: userId,
                },
            });

            // Verify user
            if (!user) {
                // handle error for user not found from the provided access token
                set.status = "Forbidden";
                throw new Error("Access token is invalid");
            }

            // Return user
            return {
                user,
            };
        });

// export
export { authPlugin };