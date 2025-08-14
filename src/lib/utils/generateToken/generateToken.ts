import crypto from 'crypto';

/**
 * Generates a random token string.
 * @param length Length of the token (default: 32)
 * @returns A random token string
 */
export function generateToken(length: number = 32): string {
     return crypto.randomBytes(length).toString('hex');
}