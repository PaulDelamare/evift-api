// auth.model.ts
import { Elysia, t } from 'elysia'

export interface Event {
     id: string
     name: string;
     description: string;
     date: Date;
     address: string;
     img: string;
     id_user: string;
     createdAt?: Date;
     udpatedAt?: Date;
}

export const eventModel = new Elysia()
     .model({
          create: t.Object({
               name: t.String({ minLength: 2, maxLength: 100, error: 'Le nom est invalide, il doit être une chaine de caractère entre 2 et 100 caractères' }),
               description: t.String({ minLength: 3, maxLength: 300, error: 'La description est invalide, il doit être une chaine de caractère entre 3 et 300 caractères' }),
               address: t.String({ minLength: 3, maxLength: 300, error: 'L\'adresse est invalide, il doit être une chaine de caractère entre 3 et 300 caractères' }),
               date: t.Date({ error: 'La date est invalide', minimumTimestamp: Date.now() }),
               img: t.Optional(t.File({ error: 'L\'image est invalide', maxSize: 10485760, types: ['image/png', 'image/jpeg', 'image/jpg'] })),
               time: t.String({ error: 'L\'heure est invalide', regex: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ })
          })
     })