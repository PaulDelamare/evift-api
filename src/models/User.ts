// auth.model.ts
import { Elysia, t } from 'elysia'

export interface User{
    firstname: string;
    lastname: string;
    email: string;
    password: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export const userModel = new Elysia()
    .model({
        user: t.Object({
            firstname: t.String({minLength: 2, maxLength: 30, error: 'Le prénom est invalide, il doit être une chaine de caractère entre 2 et 30 caractères'}),
            lastname: t.String({minLength: 3, maxLength: 30, error: 'Le nom est invalide, il doit être une chaine de caractère entre 2 et 30 caractères'}),
            email: t.String({format: 'email', error: 'L\'adresse email est invalide'}),
            // password: t.String({minLength: 2, maxLength: 30, format: 'regex', regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,30}$/}),
            password: t.RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,30}$/)
        }),
        login: t.Object({
            email: t.String({ format: "email", error: 'L\'adresse email est invalide' }),
            password: t.RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,30}$/),
        })
    })