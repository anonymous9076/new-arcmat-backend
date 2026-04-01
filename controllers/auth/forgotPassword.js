import usertable from "../../models/user.js";
import { generateOTP, hashDataWithExpiry } from "../../utils/otputils.js";
import { sendOTPEmail } from "../../utils/emailutils.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return fail(res, { message: "Email is required" }, 400);
        }

        const user = await usertable.findOne({ email });

        if (!user) {
            return fail(res, { message: "User with this email does not exist" }, 404);
        }

        // Check if resending is blocked
        if (user.otp_blocked_until && user.otp_blocked_until > new Date()) {
            const waitTime = Math.ceil((user.otp_blocked_until - new Date()) / (60 * 1000));
            return fail(res, { message: `Too many attempts. Please try again after ${waitTime} minutes.` }, 403);
        }

        // Generate OTP
        const otp = generateOTP();
        const otp_hash = hashDataWithExpiry(otp, 10); // 10 minutes expiry for password reset

        // Update user with OTP hash and reset attempts
        user.otp_hash = otp_hash;
        user.otp_attempts = 0;
        user.otp_blocked_until = undefined;
        await user.save();

        // Send Email
        const emailResult = await sendOTPEmail(email, otp);

        if (!emailResult.success) {
            return fail(res, { message: "Failed to send reset OTP email", error: emailResult.error }, 500);
        }

        return success(res, { message: "Password reset OTP has been sent to your email", email });

    } catch (error) {
        console.error("Forgot Password Error:", error);
        return fail(res, { message: "Internal server error" }, 500);
    }
};

export default forgotPassword;
