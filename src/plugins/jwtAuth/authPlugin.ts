import Elysia from "elysia";
import { bdd } from "../../lib/prisma";
import { jwtConfig } from "./jwtConfig";

const authPlugin = (app: Elysia) =>
  app
    .use(jwtConfig)
    .derive(async ({ jwt, cookie: { accessToken }, set }) => {

        if (!accessToken.value) {
        // handle error for access token is not available
            set.status = "Unauthorized";
            throw new Error("Vous devez vous authentifier");
        }
        const jwtPayload = await jwt.verify(accessToken.value);
        if (!jwtPayload) {
            // handle error for access token is tempted or incorrect
            set.status = "Forbidden";
            throw new Error("Accès invalide");
        }

        const userId = jwtPayload.sub;
        const user = await bdd.user.findUnique({
            where: {
            id: userId,
            },
        });

        if (!user) {
            // handle error for user not found from the provided access token
            set.status = "Forbidden";
            throw new Error("Access token is invalid");
        }

        return {
            user,
        };
    });

export { authPlugin };