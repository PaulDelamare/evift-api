// ! IMPORTS
import { Elysia, t } from "elysia";
import { auth, authLogged } from "./routes/auth.routes";
import { user } from "./routes/user.routes";
import { invite } from "./routes/invitation.routes";
import { friends } from "./routes/friends.routes";
import { event } from "./routes/event.routes";
import { gift } from "./routes/gift.routes";
import { requestAccount } from "./routes/requestAccount.routes";
import { rolesEvent } from "./routes/rolesEvent.routes";
import { apiConfig } from "./config/api-config";
import { checkApiKey } from "./plugins/checkApiKey";
import { message } from "./routes/webSocket/message.routes";
import { bring } from "./routes/bringItem.services";

const port = process.env.PORT!;

// ! INSTANCE
const app = new Elysia()
     .use(apiConfig)

     .onError(({ code, error }) => {
          if (code === 'VALIDATION') {
               interface ValidationError {
                    path: string;
                    schema: {
                         error?: string;
                         [key: string]: unknown;
                    };
                    [key: string]: unknown;
               }

               interface ErrorObject {
                    error: string;
               }

               const errorsObject = (error.all as ValidationError[]).reduce(
                    (acc: Record<string, ErrorObject>, curr: ValidationError) => {
                         const key = 'path' in curr ? curr.path.replace(/^\//, '') : '';
                         acc[key] = {
                              error:
                                   'schema' in curr && curr.schema.error !== undefined
                                        ? String(curr.schema.error)
                                        : 'Unknown error',
                         };
                         return acc;
                    },
                    {}
               );
               return {
                    error: errorsObject
               };
          }
     })

     .use(message)

     .get("/", ({ }) => {
          return { name: "Hello Elysia" };
     })

     .group("/api", (app) =>

          app
               .use(checkApiKey)

               .use(authLogged)
               .use(user)
               .use(invite)
               .use(friends)
               .use(event)
               .use(rolesEvent)
               .use(gift)
               .use(requestAccount)
               .use(bring)
               .use(auth)
     )

     .listen(port);

console.info(
     `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
