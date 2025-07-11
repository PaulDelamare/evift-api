import { Elysia, t } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import swagger from "@elysiajs/swagger";
import { opentelemetry } from '@elysiajs/opentelemetry';
import { cors } from '@elysiajs/cors';
import pino from 'pino';
import fs from 'fs';
import path from 'path';

const logDir = path.join(process.cwd(), 'logs');

if (!fs.existsSync(logDir)) {
     fs.mkdirSync(logDir, { recursive: true });
}

// Créer une instance Pino pour la journalisation dans un fichier
const fileDestination = pino.destination('./logs/app.log');

export const apiConfig = (app: Elysia) => {
     return app
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
          .get('/image', ({ query }) => Bun.file(query.name), {
               query: t.Object({
                    name: t.String()
               }),
               detail: {
                    tags: ['Image'],
                    summary: 'Create sipple path for get Image form API'
               },
          })

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

          .use(opentelemetry())
          .use(rateLimit({
               max: 200,
               errorResponse: 'Vous avez atteint la limite de requêtes'
          }));
};

// Export d'une instance de logger pour utilisation ailleurs dans l'application
export const log = pino({
     level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info'

}, process.env.NODE_ENV !== 'production'
     ? undefined
     : fileDestination
);