// ! IMPORTS
import { Elysia, t } from "elysia";
import cors from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { auth } from "./routes/auth.routes";
import { user } from "./routes/user.routes";
import { invite } from "./routes/invitation.routes";
import { friends } from "./routes/friends.routes";
import { event } from "./routes/event.routes";
import { gift } from "./routes/gift.routes";
import { rolesEvent } from "./routes/rolesEvent.routes";
import { message } from "./routes/webSocket/message.routes";
import { checkApiKey } from "./plugins/checkApiKey";

// Variable
// Get Port form .env
const port = process.env.PORT!;

// ! INSTANCE
const app = new Elysia()

  // ! SWAGGER
  .use(
    swagger({
      provider: "swagger-ui",
      documentation: {
        tags: [
          { name: "Auth", description: "Authentication request" },
          { name: "User", description: "User request" },
          { name: "Invitation", description: "Friends Invitation request" },
          { name: "Event", description: "All the request link to the event gestion" },
          { name: "Role", description: "All the request link to the role gestion" },
          { name: "Gift", description: "All the request link to the gift gestion" },
          { name: "Image", description: "Request for get Image from API" },
          { name: "Friends", description: "All the request link to the friends gestion" },
        ],
      },
    })
  )

  // ! IMAGE
  // Get the image
  .get('/image', ({ query }) => Bun.file(query.name), {
    query: t.Object({
      name: t.String()
    }),
    detail: {
      tags: ['Image'],
      summary: 'Create sipple path for get Image form API'
    },
  })
  // ! HELLO WORLD !
  .get("/", ({ headers }) => {
    return { name: "Hello Elysia" };
  })

  // ! WEBSOCKET
  .use(message)


  // ! API KEY
  .use(checkApiKey)

  // ! CORS

  .use(
    cors({
      origin: "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "x-api-key",
        "accept",
        "origin",
        "x-requested-with",
      ],
    })
  )

  // ! GROUP ROUTES
  .group("/api", (app) =>
    // - Auth routes
    // Auth route
    app.use(auth)
      // User route
      .use(user)

      // Invitation route
      .use(invite)

      // Friends route
      .use(friends)

      // Events route
      .use(event)

      // Role route
      .use(rolesEvent)

      // Gifts routes
      .use(gift)
  )

  // ! RUN SERVER
  .listen(port);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
