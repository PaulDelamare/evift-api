// ! IMPORTS
import { Elysia, t } from "elysia";
import { authPlugin } from "../plugins/jwtAuth/authPlugin";
import { jwtConfig } from "../plugins/jwtAuth/jwtConfig";
import { userModel } from "../models/User";
import { FriendsServices } from "../services/friends/friends.services";
import { sendResponse } from "../lib/utils/returnSuccess/returnSuccess";
import { handleError } from "../lib/utils/errorHandler/errorHandler";

// Create Invitaion Route
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
                summary: 'Send request for add friend to an other user'
            },
        }
    );
