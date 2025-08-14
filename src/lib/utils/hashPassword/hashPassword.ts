export const hashPassword = (password: string): Promise<string> => {
     return Bun.password.hash(password);
}