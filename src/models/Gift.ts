// auth.model.ts
import { Elysia, t } from 'elysia'

export interface CreateListGift{
     name: string;
     gifts: {
          name: string;
          quantity: number;
          url?: string;
     }[]
}

export const giftModel = new Elysia()
     .model({
          createList: t.Object({
               name: t.String({ minLength: 2, maxLength: 100, error: 'Le nom est invalide, il doit être une chaine de caractère entre 2 et 100 caractères' }),
               gifts: t.Array(t.Object({
                    name: t.String({ minLength: 2, maxLength: 100, error: 'Le nom est invalide, il doit être une chaine de caractère entre 2 et 100 caractères' }),
                    quantity: t.Number({ error: 'La quantité est invalide', min: 1, max: 100 }),
                    url: t.Optional(t.String({ error: 'L\'url est invalide, il doit être une chaine de caractère entre 2 et 100 caractères' })),
               })),
          })
     })