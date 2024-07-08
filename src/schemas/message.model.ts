import * as mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
     userId: {
          type: String,
          required: true
     },
     eventId: {
          type: String,
          required: true
     },
     firstname: {
          type: String,
          required: true
     },
     lastname: {
          type: String,
          required: true
     },
     email: {
          type: String,
          required: true
     },
     message: {
          type: String,
          required: true,
     },
     sendAt: {
          type: Date,
          required: true,
          default: Date.now
     }
});

export type Message = mongoose.InferSchemaType<typeof messageSchema>;

export const Message = mongoose.model('Message', messageSchema, 'messages');