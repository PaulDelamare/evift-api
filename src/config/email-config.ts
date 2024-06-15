// Email configuration
export const emailConfig = {
        host: process.env.SMTP_HOST!,
        port: parseInt(process.env.SMTP_PORT!),
        auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASSWORD!
        }
    };