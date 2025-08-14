import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { hashPassword } from "./hashPassword";

describe('AuthServices.hashPassword', () => {
          let originalHash: typeof Bun.password.hash;


          it('should return the hashed password string', async () => {
               Bun.password.hash = async (pwd: string) => 'hashedPwd';

               const result = await hashPassword('myPassword');

               expect(result).toBe('hashedPwd');
          });

          it('should pass through errors from Bun.password.hash', async () => {
               Bun.password.hash = async () => { throw new Error('Expected hashPassword to throw'); };

               try {

                    await hashPassword('badPassword');
                    throw new Error('Expected hashPassword to throw');

               } catch (err: any) {

                    expect(err.message).toBe('Expected hashPassword to throw');
               }
          });
     });