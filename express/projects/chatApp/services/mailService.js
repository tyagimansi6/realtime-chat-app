const nodemailer = require('nodemailer');


const createGmailTransporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

const sendEmail = async (to, subject, htmlContent, textContent = "") => {
    try {
        const info = await createGmailTransporter.sendMail({
            from: `"Sumit Kumar Saw" <${process.env.GMAIL_USER}>`,
            to, subject, html: htmlContent, text: textContent
        });
        return { success: true, messageId: info.messageId };
    } catch (err) {
        console.error("Error sending mail:", err.message);
        return { success: false, error: err.message };
    }
};


const sendWelcomeEmail = (email, username) => {
    return sendEmail(
        email,
        "Welcome to ChatAPP",
        `<h1>Welcome ${username}!</h1><p>You’ve successfully registered.</p>`,
        `Welcome ${username}!`
    );
};

const sendResetEmail = (email, token) => {
    const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    return sendEmail(
        email,
        "Reset Password",
        `<p>Click below to reset password:</p><a href="${link}">${link}</a>`,
        `Reset password: ${link}`
    );
};


exports.sendEmail = sendEmail;
exports.sendWelcomeEmail = sendWelcomeEmail;
exports.sendResetEmail = sendResetEmail;
