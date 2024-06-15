// !IMPORTS
import Elysia from "elysia";

/**
 * Returns an authentication plugin that verifies the access token and retrieves the user information.
 *
 * @param app - The Elysia application instance.
 * @return - A promise that resolves to an object containing the user information.
 * @throws - Throws an error if the access token is not available, invalid, or the user is not found.
 */
const checkApiKey = (app: Elysia) =>
     app
          .onBeforeHandle(({ headers, set }) => {
               const apiKeyHeader = headers["x-api-key"];
               if (apiKeyHeader === Bun.env.API_KEY) {
               } else {
                    // handle error for user not found from the provided access token
                    set.status = "Forbidden";
                    throw new Error("La clef api ets invalide");
               }
          });

// export
export { checkApiKey };