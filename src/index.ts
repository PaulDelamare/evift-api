// ! IMPORTS
import { Elysia } from "elysia";
import cors from "@elysiajs/cors";
import { swagger } from '@elysiajs/swagger'
import { auth } from "./routes/auth.routes";
import { checkApiKey } from "./plugins/checkApiKey";


// Variable
// Get Port form .env
const port = process.env.PORT!;

// ! INSTANCE 
const app = new Elysia()

  // ! SWAGGER
  .use(swagger({
    provider: "swagger-ui", documentation: {
      tags: [
        { name: 'Auth', description: 'Authentication request' },
      ]
    }
  }))

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
    }),
  )

  // ! HELLO WORLD !
  .get("/", () => "Hello Elysia")

  // ! GROUP ROUTES
  .group('/api', (app) =>

    // - Auth routes
    app.use(auth),
  )

  // ! RUN SERVER
  .listen(port);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
