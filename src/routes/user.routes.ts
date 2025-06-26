import { Elysia, t } from "elysia";
import { authPlugin } from "../plugins/jwtAuth/authPlugin";
import { jwtConfig } from "../plugins/jwtAuth/jwtConfig";
import { UserServices } from "../services/user/user.services";
import { sendResponse } from "../lib/utils/returnSuccess/returnSuccess";
import { handleError } from "../lib/utils/errorHandler/errorHandler";

export const user = new Elysia({ prefix: "/user" })

    .decorate("userServices", new UserServices())

    .use(jwtConfig)
    .use(authPlugin)

    .get(
        "/findUser/:email",

        async (ctx) => {

            try {

                const roles = await ctx.userServices.findUserByEmail(ctx.params.email);
                return sendResponse(ctx, 200, roles);

            } catch (error) {

                const { status, error: errorResponse } = handleError(error);
                throw ctx.error(status, errorResponse);
            }
        },
        {
            params: t.Object({
                email: t.String({
                    format: "email",
                    error: "L'adresse email est invalide",
                }),
            }),
            detail: {
                tags: ['User'],
                summary: 'Find an user by email'
            }
        }
    );
