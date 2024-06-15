//////////
//! REQUIRE
//Require nodemailer for email
import  nodemailer  from "nodemailer";

//Require email compil html
import handlebars  from "handlebars";

// Import fs for Interract with files
import fs  from "fs";

// Import email config
import { emailConfig } from "../config/email-config";

// ! FUNCTION
/**
+ * Sends an email with the specified content and attachments.
+ *
+ * @param to - The email address who receive the email to
+ * @param sender - The email address who send the email to
+ * @param subject - The subject line of the email
+ * @param templateName - The name of the email template to use
+ * @param data - The data to insert into the email template
+ * @param attachments - (Optional) An array of file attachments
+ * @return A Promise that resolves after the email is sent
+ */
export async function sendEmail(to: string, sender: string, subject: string, templateName: string, data: any) {

    // Create a transporter
    const transporter = nodemailer.createTransport(emailConfig);

    // Get the root path
    const rootPath = import.meta.dir;

    // Compile the footer and header email
    const headerSource = fs.readFileSync(`${rootPath}/emails/layouts/header.hbs`, 'utf8');
    const footerSource = fs.readFileSync(`${rootPath}/emails/layouts/footer.hbs`, 'utf8');

    // Compile the header email
    const headerTemplate = handlebars.compile(headerSource);
    // Compile the footer email
    const footerTemplate = handlebars.compile(footerSource);

    // Compile the template email
    const templateSource = fs.readFileSync(`${rootPath}/emails/templates/${templateName}.hbs`, 'utf8');
    const template = handlebars.compile(templateSource);

    //Split recipients 
    const recipients = to.split(',').map(email => email.trim());

    // Get the api url
    const url = process.env.API_URL;

    //Pass the url in data
    data.url = url;

    // For each recipient send an email
    for (const recipient of recipients) {

        // Compil the email
        const html = template({
            header: headerTemplate,
            footer: footerTemplate,
            ...data
        });

        //Mail option for send
        const mailOptions = {
            from: sender,
            to : recipient,
            subject,
            html
        };

        // Send Email
        await transporter.sendMail(mailOptions);
    }  
}
