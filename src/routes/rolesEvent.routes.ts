import { Elysia, t } from "elysia";
import { authPlugin } from "../plugins/jwtAuth/authPlugin";
import { jwtConfig } from "../plugins/jwtAuth/jwtConfig";
import { RoleEventServices } from "../services/roleEvent/roleEvent.services";
import { sendResponse } from "../lib/utils/returnSuccess/returnSuccess";
import { handleError } from "../lib/utils/errorHandler/errorHandler";

export const rolesEvent = new Elysia({ prefix: "/rolesEvent" })
     .decorate("roleServices", new RoleEventServices())


     .use(jwtConfig)
     .use(authPlugin)

     .get(
          "/findAll",

          async (ctx) => {
               try {

                    const roles = await ctx.roleServices.findAll();
                    return sendResponse(ctx, 200, roles);

               } catch (error) {

                    const { status, error: errorResponse } = handleError(error);
                    throw ctx.error(status, errorResponse);
               }
          },
          {
               detail: {
                    tags: ['Role'],
                    summary: 'Request for get all event role',
               }
          }
     )
