//////////
//! REQUIRE
//Require nodemailer for email
import nodemailer from "nodemailer";

//Require email compil html
import handlebars from "handlebars";

// Import fs for Interract with files
import fs from "fs";

// Import email config
import { emailConfig } from "../config/email-config";

interface EmailData {
    [key: string]: any;
}

/**
 * Sends an email using a specified template and dynamic data.
 *
 * @param to - A comma-separated list of recipient email addresses.
 * @param sender - The sender's email address.
 * @param subject - The subject line of the email.
 * @param templateName - The name of the Handlebars template to use for the email body.
 * @param data - An object containing dynamic data to be injected into the email template.
 * @returns A Promise that resolves when all emails have been sent.
 *
 * @remarks
 * - Uses Handlebars for templating and Nodemailer for sending emails.
 * - Registers several custom Handlebars helpers for use within templates.
 * - Reads header, footer, and main templates from the filesystem.
 * - Sends the email to each recipient in parallel.
 *
 * @throws Will throw an error if reading template files fails or if sending an email fails.
 */
export async function sendEmail(
    to: string,
    sender: string,
    subject: string,
    templateName: string,
    data: EmailData
): Promise<void> {
    const rootPath = import.meta.dir;

    const transporter = nodemailer.createTransport(emailConfig);

    const headerTemplate = handlebars.compile(fs.readFileSync(`${rootPath}/emails/layouts/header.hbs`, 'utf8'));
    const footerTemplate = handlebars.compile(fs.readFileSync(`${rootPath}/emails/layouts/footer.hbs`, 'utf8'));
    const template = handlebars.compile(fs.readFileSync(`${rootPath}/emails/templates/${templateName}.hbs`, 'utf8'));

    const recipients = to.split(',').map(email => email.trim());
    
    data.url = process.env.API_URL;

    // Enregistrement des helpers handlebars de manière concise
    const helpers: Record<string, Handlebars.HelperDelegate> = {
        parseJSON: (context: string) => {
            try {
                return JSON.parse(context);
            } catch (error) {
                console.error('Erreur de parsing JSON:', error);
                return [];
            }
        },
        json: (context: any) => JSON.stringify(context, null, 2),
        log: (context: any) => { console.log(context); return ''; },
        getNameRole: (index: number) => data.roles?.[index]?.name,
        getByRoleId: (index: number) => data.roles?.[index]?._id,
        siteUrl: () => process.env.SITE_URL,
        token: () => data.token,
    };
    Object.entries(helpers).forEach(([key, fn]) => handlebars.registerHelper(key, fn));

    const html = template({ header: headerTemplate, footer: footerTemplate, ...data });
    await Promise.all(
        recipients.map(recipient =>
            transporter.sendMail({ from: sender, to: recipient, subject, html })
        )
    );
}
