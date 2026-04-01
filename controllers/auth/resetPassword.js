import usertable from "../../models/user.js";
import bcrypt from "bcryptjs";
import { verifyHashedData } from "../../utils/otputils.js";
import { success, fail } from "../../middlewares/responseHandler.js";

/**
 * Controller to reset user password using verified OTP.
 */
const resetPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        const email = req.user.email
        if (!newPassword) {
            return fail(res, { message: " New Password are required" }, 400);
        }

        const user = await usertable.findOne({ email });

        if (!user) {
            return fail(res, { message: "User not found" }, 404);
        }

        // Double check block status
        if (user.otp_blocked_until && user.otp_blocked_until > new Date()) {
            return fail(res, { message: "You are currently blocked. Please try again later." }, 403);
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password and clear security fields
        user.password = hashedPassword;
        user.otp_hash = undefined;
        user.otp_attempts = 0;
        user.otp_blocked_until = undefined;

        // Also ensure user is verified if they resets password
        user.isEmailVerified = 1;
        user.verificationExpires = undefined;

        await user.save();

        return success(res, { message: "Password has been reset successfully" });

    } catch (error) {
        console.error("Reset Password Error:", error);
        return fail(res, { message: "Internal server error" }, 500);
    }
};

export default resetPassword;
