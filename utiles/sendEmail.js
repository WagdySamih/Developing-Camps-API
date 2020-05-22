const nodemailer = require("nodemailer");

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    service: process.env.SMTP_HOST,
    auth: {
        user: process.env.SMTP_EMAIL,  
        pass: process.env.SMTP_EMAIL_PASSWORD  
    }
});

const ResetPasswordTokenEmail = (options) => {
    transporter.sendMail({ 
        from: `${process.env.SMTP_EMAIL_NAME} <${process.env.SMTP_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        text: options.message
    }) 
}

module.exports = ResetPasswordTokenEmail