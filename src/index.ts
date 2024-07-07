// ! IMPORTS
import { Elysia, t } from "elysia";
import cors from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { auth } from "./routes/auth.routes";
import { user } from "./routes/user.routes";
import { invite } from "./routes/invitation.routes";
import { friends } from "./routes/friends.routes";
import { event } from "./routes/event.routes";
import { rolesEvent } from "./routes/rolesEvent.routes";
import { message } from "./routes/webSocket/message.routes";
import { checkApiKey } from "./plugins/checkApiKey";
// For access to the static files

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
        ],
      },
    })
  )

  // ! IMAGE
  // Get the image
  .get('/image', ({ query }) => Bun.file(query.name), {
    query: t.Object({
      name: t.String()
    })
  })
  // ! HELLO WORLD !
  .get("/", ({ headers }) => {
    return { name: "Hello Elysia" };
  })

  // ! API KEY
  .use(checkApiKey)

  // ! CORS
  .use(
    cors({
      origin: "*",
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
      // Events roles
      .use(rolesEvent)
      // Message
      .use(message)
  )

  // ! RUN SERVER
  .listen(port);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
