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
        .use(jwtConfig)
        .derive(async ({ jwt, cookie: { accessToken }, set }) => {
            if (!accessToken || !accessToken.value) {
                set.status = 401;
                throw new Error("Vous devez vous authentifier");
            }

            let jwtPayload;
            try {
                jwtPayload = await jwt.verify(accessToken.value);
            } catch {
                set.status = 403;
                throw new Error("Accès invalide");
            }

            if (!jwtPayload) {
                set.status = 403;
                throw new Error("Accès invalide");
            }

            const userId = jwtPayload.sub;

            let user;
            try {
                user = await bdd.user.findUnique({
                    where: { id: userId },
                    select: { id: true, email: true, firstname: true, lastname: true, createdAt: true, firstLogin: true },
                });
            } catch {
                set.status = 500;
                throw new Error("Erreur interne lors de la récupération de l'utilisateur");
            }

            if (!user) {
                set.status = 403;
                throw new Error("Access token est invalide");
            }

            return {
                user,
            };
        });

export { authPlugin };
