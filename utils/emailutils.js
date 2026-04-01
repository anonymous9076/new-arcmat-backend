import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export const sendOTPEmail = async (to, otp) => {
    const transporter = nodemailer.createTransport({
        service: process.env.SMPT_SERVICE || 'gmail',
        host: process.env.SMPT_HOST || 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.SMPT_MAIL,
            pass: process.env.SMPT_PASSWORD
        },
    });

    const mailOptions = {
        from: `"Arcmat Support" <${process.env.SMPT_MAIL}>`,
        to: to,
        subject: 'Your OTP for Account Verification',
        text: `Your OTP is: ${otp}. It will expire in 5 minutes.`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #333;">Account Verification</h2>
                <p>Hello,</p>
                <p>Thank you for registering. Please use the following One-Time Password (OTP) to verify your account:</p>
                <div style="font-size: 24px; font-weight: bold; color: #4CAF50; padding: 10px; background-color: #f9f9f9; border-radius: 5px; text-align: center; margin: 20px 0;">
                    ${otp}
                </div>
                <p>This OTP is valid for <strong>5 minutes</strong>. If you did not request this, please ignore this email.</p>
                <br>
                <p>Best regards,<br>Arcmat Team</p>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        return { success: false, error: error.message };
    }
};


export const sendInvitationEmail = async (to, clientName, architectName, projectName, invitationLink) => {
    const transporter = nodemailer.createTransport({
        service: process.env.SMPT_SERVICE || 'gmail',
        host: process.env.SMPT_HOST || 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.SMPT_MAIL,
            pass: process.env.SMPT_PASSWORD
        },
    });

    const mailOptions = {
        from: `"Arcmat Projects" <${process.env.SMPT_MAIL}>`,
        to: to,
        subject: `Invitation to collaborate on ${projectName}`,
        text: `${architectName} has invited you to view the project overview for "${projectName}" on Arcmat. View here: ${invitationLink}`,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 16px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2d3142; margin: 0; font-size: 24px; font-weight: 800;">ARCMAT</h1>
                </div>
                <div style="background-color: #fef7f2; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
                    <h2 style="color: #2d3142; margin-top: 0; font-size: 20px;">Project Invitation</h2>
                    <p style="color: #4a4a4a; line-height: 1.6; font-size: 16px;">
                        Hello ${clientName},
                    </p>
                    <p style="color: #4a4a4a; line-height: 1.6; font-size: 16px;">
                        <strong>${architectName}</strong> would like to invite you to collaborate on the project <strong>"${projectName}"</strong>.
                    </p>
                    <p style="color: #4a4a4a; line-height: 1.6; font-size: 16px;">
                        As a client, you can view the concept designs, material selections, and project overviews curated specifically for you.
                    </p>
                    <div style="text-align: center; margin: 35px 0;">
                        <a href="${invitationLink}" style="background-color: #d9a88a; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(217, 168, 138, 0.2);">
                            View Project Overview
                        </a>
                    </div>
                </div>
                <p style="color: #888888; font-size: 14px; line-height: 1.5; text-align: center;">
                    If you have any questions, feel free to reply to this email or contact your architect directly.
                </p>
                <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 30px 0;">
                <p style="color: #bbbbbb; font-size: 12px; text-align: center;">
                    &copy; ${new Date().getFullYear()} Arcmat. All rights reserved.
                </p>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending invitation email: ', error);
        return { success: false, error: error.message };
    }
};

export const sendProductLeadEmail = async (leadData) => {
    const transporter = nodemailer.createTransport({
        service: process.env.SMPT_SERVICE || 'gmail',
        host: process.env.SMPT_HOST || 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.SMPT_MAIL,
            pass: process.env.SMPT_PASSWORD
        },
    });

    const requests = [];
    if (leadData.catalogue) requests.push('Catalogue');
    if (leadData.priceList) requests.push('Price List');
    if (leadData.bimCad) requests.push('BIM/CAD');
    if (leadData.retailersList) requests.push('Retailers List');
    if (leadData.contactRepresentative) requests.push('Contact Representative');

    const mailOptions = {
        from: `"Arcmat Leads" <${process.env.SMPT_MAIL}>`,
        to: process.env.SMPT_MAIL, // Assuming admin receives at the same configured email or another admin email env
        subject: `New Product Lead for ${leadData.productName}`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                <h2 style="color: #d9a88a;">New Product Inquiry</h2>
                <p>A new lead has been submitted for <strong>${leadData.productName}</strong>.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                
                <h3 style="color: #333;">Customer Details:</h3>
                <p><strong>Name:</strong> ${leadData.firstName} ${leadData.lastName}</p>
                <p><strong>Email:</strong> <a href="mailto:${leadData.email}">${leadData.email}</a></p>
                <p><strong>Profession:</strong> ${leadData.profession}</p>
                <p><strong>Company:</strong> ${leadData.company || 'N/A'}</p>
                <p><strong>City:</strong> ${leadData.city}</p>
                <p><strong>Address:</strong> ${leadData.address || 'N/A'}, ${leadData.no || ''}</p>
                <p><strong>Postcode:</strong> ${leadData.postcode || 'N/A'}</p>
                <p><strong>Phone:</strong> ${leadData.tel || 'N/A'}</p>
                
                <h3 style="color: #333;">Request Details:</h3>
                <p><strong>Interests:</strong> ${requests.join(', ') || 'General Inquiry'}</p>
                <p><strong>Message:</strong></p>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; font-style: italic;">
                    ${leadData.message || 'No message provided.'}
                </div>
                
                <p style="margin-top: 30px; font-size: 12px; color: #999;">
                    Submitted on: ${new Date().toLocaleString()}
                </p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Error sending lead email:', error);
        return { success: false, error: error.message };
    }
};
