import usertable from "../../models/user.js";
import { generateOTP, hashDataWithExpiry } from "../../utils/otputils.js";
import { sendOTPEmail } from "../../utils/emailutils.js";
import { success, fail } from "../../middlewares/responseHandler.js";

/**
 * POST /api/user/add-email
 * Authenticated. Lets a user add an email to their account (if they don't have one yet).
 * Sends a verification OTP to the provided email.
 */
const addEmail = async (req, res) => {
    try {
        const userId = req.user.id;
        const { email } = req.body;

        if (!email || typeof email !== 'string' || !email.trim()) {
            return fail(res, { message: "Email is required" }, 400);
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Basic email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            return fail(res, { message: "Please provide a valid email address" }, 400);
        }

        // Check if email is already taken by another user
        const existingUser = await usertable.findOne({ email: normalizedEmail });
        if (existingUser && existingUser._id.toString() !== userId) {
            return fail(res, { message: "This email is already registered to another account" }, 409);
        }

        // Get current user
        const user = await usertable.findById(userId);
        if (!user) {
            return fail(res, { message: "User not found" }, 404);
        }

        // If email is already set and verified, don't allow replacement via this endpoint
        if (user.email && user.isEmailVerified === 1) {
            return fail(res, { message: "Your email is already verified. Use change-email to update it." }, 400);
        }

        // Generate OTP and save to user
        const otp = generateOTP();
        const otp_hash = hashDataWithExpiry(otp, 10); // 10 minute expiry

        user.email = normalizedEmail;
        user.isEmailVerified = 0;
        user.email_otp_hash = otp_hash;
        await user.save();

        // Send OTP via email
        const emailResult = await sendOTPEmail(normalizedEmail, otp);
        if (!emailResult.success) {
            // Rollback the email save if sending fails
            user.email = undefined;
            user.email_otp_hash = undefined;
            await user.save();
            return fail(res, { message: "Failed to send verification email. Please try again." }, 500);
        }

        return success(res, {
            message: "Verification code sent to your email address",
            email: normalizedEmail
        });

    } catch (error) {
        console.error("Add Email Error:", error);
        if (error.code === 11000) {
            return fail(res, { message: "This email is already registered to another account" }, 409);
        }
        return fail(res, { message: "Internal server error" }, 500);
    }
};

export default addEmail;
