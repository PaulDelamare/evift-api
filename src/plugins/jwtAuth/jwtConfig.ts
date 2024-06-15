// ! IMPORTS
import jwt from "@elysiajs/jwt";
import Elysia from "elysia";
import { JWT_NAME } from "../../config/auth-config";

// ! CONFIGURATION
const jwtConfig = (app: Elysia) =>
    app
        .use(
            // Define jwt
            jwt({
                name: JWT_NAME,
                secret: Bun.env.JWT_SECRET!,
                exp: '7d'
            })
        )

// ! EXPORT
export { jwtConfig };