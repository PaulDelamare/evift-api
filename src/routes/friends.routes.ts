import { Elysia, t } from "elysia";
import { authPlugin } from "../plugins/jwtAuth/authPlugin";
import { jwtConfig } from "../plugins/jwtAuth/jwtConfig";
import { userModel } from "../models/User";
import { FriendsServices } from "../services/friends/friends.services";
import { sendResponse } from "../lib/utils/returnSuccess/returnSuccess";
import { handleError } from "../lib/utils/errorHandler/errorHandler";

export const friends = new Elysia({ prefix: "/friends" })

    .decorate("friendsServices", new FriendsServices())

    .use(jwtConfig)
    .use(authPlugin)

    .use(userModel)


    .get(
        "/findAll",

        async (ctx) => {
            try {

                const friends = await ctx.friendsServices.findAll(ctx.user.id);
                return sendResponse(ctx, 200, friends);

            } catch (error) {

                const { status, error: errorResponse } = handleError(error);
                throw ctx.error(status, errorResponse);
            }
        },

        {
            detail: {
                tags: ['Friends'],
                summary: 'Get all friends of a user',
            },
        }
    )

    .delete(
        "/delete/:id",

        async (ctx) => {
            try {
                await ctx.friendsServices.deleteFriends(ctx.user.id, ctx.params.id);

                return sendResponse(ctx, 200, 'Ami supprimé avec succès');
            } catch (error) {
                const { status, error: errorResponse } = handleError(error);
                throw ctx.error(status, errorResponse);
            }
        },
        {
            params: t.Object({
                id: t.String({ format: "uuid", errors: "L'id de l'ami n'est pas valide" }),
            }),
            detail: {
                tags: ['Friends'],
                summary: 'Delete a friend by ID',
            },
        }
    )
