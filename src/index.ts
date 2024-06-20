// ! IMPORTS
import { Elysia } from "elysia";
import cors from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { auth } from "./routes/auth.routes";
import { user } from "./routes/user.routes";
import { invite } from "./routes/invitation.routes";
import {friends} from "./routes/friends.routes";
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
        ],
      },
    })
  )
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
  )

  // ! RUN SERVER
  .listen(port);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
