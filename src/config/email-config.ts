export const emailConfig = {
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },

    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    tls: {
        rejectUnauthorized: true,
    },
};