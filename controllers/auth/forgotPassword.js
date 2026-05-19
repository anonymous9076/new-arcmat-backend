import usertable from "../../models/user.js";
import { generateOTP, hashDataWithExpiry } from "../../utils/otputils.js";
import { sendOTPMessage } from "../../utils/smsutils.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const forgotPassword = async (req, res) => {
    try {
        const { mobile } = req.body;
        const normalizedMobile = String(mobile || "").replace(/\D/g, "");

        if (!normalizedMobile) {
            return fail(res, { message: "Mobile is required" }, 400);
        }
        if (!/^\d{10}$/.test(normalizedMobile)) {
            return fail(res, { message: "Please provide a valid 10-digit mobile number" }, 400);
        }

        const user = await usertable.findOne({ mobile: normalizedMobile });

        if (!user) {
            return fail(res, { message: "User with this mobile does not exist" }, 404);
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

        const smsResult = await sendOTPMessage(normalizedMobile, otp);

        if (!smsResult.success) {
            return fail(res, { message: "Failed to send reset OTP SMS", error: smsResult.error }, 500);
        }
        const smsRequestId = smsResult?.data?.request_id || smsResult?.data?.message;

        return success(res, { message: "Password reset OTP has been sent to your mobile", mobile: normalizedMobile, smsRequestId });

    } catch (error) {
        console.error("Forgot Password Error:", error);
        return fail(res, { message: "Internal server error" }, 500);
    }
};

export default forgotPassword;
