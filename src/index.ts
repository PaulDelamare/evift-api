// Import
import { Elysia } from "elysia";
import cors from "@elysiajs/cors";

// Variable
// Get Port form .env
const port = process.env.PORT!;


const app = new Elysia()
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
  .listen(port);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
