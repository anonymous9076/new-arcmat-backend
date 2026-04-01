import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
});

async function sendEmail(to, subject, text, html) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FORM || process.env.EMAIL_USER,
      to: to,
      subject: subject,
      text: text,
      html: html
    };
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export default sendEmail;