// ! IMPORTS
import { Elysia, t } from "elysia";
import { jwtConfig } from "../../plugins/jwtAuth/jwtConfig";
import { authPlugin } from "../../plugins/jwtAuth/authPlugin";
import mongoose from "mongoose";
import { Message } from "../../schemas/message.model";
import { bdd } from "../../lib/prisma";

await mongoose.connect(Bun.env.MONGO_URL!)
     .then(() => console.log("Connected to MongoDB"))
     .catch((err) => console.log(err));

// Create Event Route
export const message = new Elysia({ prefix: "/ws" })
     // ! CONFIGURATION


     // ! Error Handler
     .onError(({ code, error }) => {
          if (code === "VALIDATION")
               // Throw Error
               return { status: error.status, error: error.message };
     })

     // ? Use jwtConfig
     .use(jwtConfig)

     // HANDLER

     // ? Use Plugin for check if user is logged
     .use(authPlugin)

     // Import model for user
     // .use(eventModel)

     // ! ROUTES

     // ? WebSocket for message
     .ws('/message', {
          // validate incoming message
          body: t.Object({
               message: t.String()
          }),
          query: t.Object({
               id_event: t.String({ format: "uuid", error: "L'id de l'event est invalide" }),
          }),
          async open(ws) {
               const eventId = ws.data.query.id_event;

               const event = await bdd.participant.findFirst({
                    where: {
                         id_event: eventId,
                         id_user: ws.data.user.id
                    }
               });

               if (!event) {
                    ws.close();
                    return
               }

               ws.subscribe(`conversation-${ws.data.query.id_event}`);
               ws.publish(
                    `conversation-${ws.data.query.id_event}`,
                    JSON.stringify({ type: "USERS_ADD", data: `${ws.data.user.firstname} ${ws.data.user.lastname}` })
               );

               const messages = await Message.find({
                    eventId : eventId
               });

               ws.send(JSON.stringify({ type: "MESSAGES_SET", data: messages }));
          },
          async message(ws, { message }) {

               const messageSend = await Message.create({
                    message,
                    userId: ws.data.user.id,
                    eventId: ws.data.query.id_event,
                    email: ws.data.user.email,
                    firstname: ws.data.user.firstname,
                    lastname: ws.data.user.lastname
               });


               ws.publish(
                    `conversation-${ws.data.query.id_event}`,
                    JSON.stringify({ type: "MESSAGES_ADD", data: messageSend })
               );
               ws.send(
                    JSON.stringify({ type: "MESSAGES_ADD", data: messageSend })
               );

          }
     })