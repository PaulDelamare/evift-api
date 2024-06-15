// Import
import { Elysia } from "elysia";
import cors from "@elysiajs/cors";
import { PrismaClient } from '@prisma/client'
import { swagger } from '@elysiajs/swagger'
import { auth } from "./routes/auth.routes";

const db = new PrismaClient() 


// Variable
// Get Port form .env
const port = process.env.PORT!;


const app = new Elysia()
  .use(swagger({provider: "swagger-ui", documentation: {
    tags: [
      { name: 'Auth', description: 'Authentication request' },
    ]
  }})) 
  .use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "api-key",
        "accept",
        "origin",
        "x-requested-with",
      ],
    }),
  )

  .get("/", () => "Hello Elysia")
  .group('/api', (app) =>
    app.use(auth),
  )
  
  .listen(port);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
