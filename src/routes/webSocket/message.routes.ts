import { Elysia, t } from "elysia";
import { jwtVerify } from "jose";
import mongoose from "mongoose";
import { Message } from "../../schemas/message.model";
import { bdd } from "../../lib/prisma";
import { rateLimit } from "elysia-rate-limit";

await mongoose.connect(Bun.env.MONGO_URL!)
     .then(() => console.info("Connected to MongoDB"))
     .catch((err) => console.info(err));

export const message = new Elysia({ prefix: "/ws" })

     .onError(({ code, error }) => {
          if (code === "VALIDATION")
               return { status: error.status, error: error.message };
          // Log only critical errors
          console.error(`[ERROR] Code: ${code}, Message: ${'message' in error ? error.message : String(error)}`);
     })

     .use(rateLimit({
          max: 100,
          errorResponse: new Response(
               JSON.stringify({
                    error: { error: 'Trop de requêtes. Réessayez plus tard.' },
                    message: "Trop de requêtes. Réessayez plus tard."
               }),
               { status: 429, headers: { 'Content-Type': 'application/json' } }
          ),
          countFailedRequest: true,
     }))

     .ws('/message', {
          body: t.Object({
               message: t.String({ minLength: 1, maxLength: 1000 })
          }),
          query: t.Object({
               id_event: t.String({ format: "uuid" }),
               token: t.String()
          }),
          ping: (message) => message,
          pong(message) {
               if (this && this.data) {
                    this.data.lastPong = Date.now();
               }
               return message;
          },
          async open(ws) {
               const { id_event, token } = ws.data.query;

               let payload: any;
               try {
                    payload = await jwtVerify(token, new TextEncoder().encode(Bun.env.JWT_SECRET!));
               } catch {
                    ws.close();
                    return;
               }

               const user = await bdd.user.findUnique({ where: { id: payload.payload.sub } });
               if (!user) {
                    ws.close();
                    return;
               }
               ws.data.user = user;

               const event = await bdd.participant.findFirst({
                    where: { id_event, id_user: user.id }
               });

               if (!event) {
                    ws.close();
                    return;
               }

               ws.subscribe(`conversation-${id_event}`);
               console.info(`[WS] Subscribed to conversation-${id_event}`);

               ws.publish(`conversation-${id_event}`, JSON.stringify({
                    type: "USERS_ADD",
                    data: `${sanitize(user.firstname)} ${sanitize(user.lastname)}`
               }));

               const messages = await Message.find({ eventId: id_event });
               ws.send(JSON.stringify({ type: "MESSAGES_SET", data: messages }));
          },

          async message(ws, { message }) {
               const sanitizedMessage = sanitize(message);
               const msg = await Message.create({
                    message: sanitizedMessage,
                    userId: ws.data.user.id,
                    eventId: ws.data.query.id_event,
                    email: sanitize(ws.data.user.email),
                    firstname: sanitize(ws.data.user.firstname),
                    lastname: sanitize(ws.data.user.lastname)
               });

               ws.publish(`conversation-${ws.data.query.id_event}`, JSON.stringify({
                    type: "MESSAGES_ADD",
                    data: msg
               }));

               ws.send(JSON.stringify({ type: "MESSAGES_ADD", data: msg }));
          }
     });

function sanitize(str: string | undefined | null): string {
     if (!str) return "";
     const escapeHtml = (unsafe: string) => unsafe.replace(/[&<>"'`]/g, c => ({
          '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;'
     }[c] || c));
     return escapeHtml(str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ""));
}
