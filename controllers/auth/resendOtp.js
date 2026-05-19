import usertable from "../../models/user.js";
import { generateOTP, hashDataWithExpiry } from "../../utils/otputils.js";
import { sendOTPMessage } from "../../utils/smsutils.js";
import { sendOTPEmail } from "../../utils/emailutils.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const resendOtp = async (req, res) => {
    try {
        const { mobile, sendOtpTo } = req.body;
        const normalizedMobile = String(mobile || "").replace(/\D/g, "");

        if (!normalizedMobile) {
            return fail(res, { message: "Mobile is required" }, 400);
        }
        if (!/^\d{10}$/.test(normalizedMobile)) {
            return fail(res, { message: "Please provide a valid 10-digit mobile number" }, 400);
        }
        const user = await usertable.findOne({ mobile: normalizedMobile });

        if (!user) {
            return fail(res, { message: "User not found" }, 404);
        }
        if (user.isPhoneVerified === 1) {
            return success(res, { message: "Mobile is already verified" });
        }

        // Check if resending is blocked
        if (user.otp_blocked_until && user.otp_blocked_until > new Date()) {
            const waitTime = Math.ceil((user.otp_blocked_until - new Date()) / (60 * 1000));
            return fail(res, { message: `Resending OTP is blocked. Please try again after ${waitTime} minutes.` }, 403);
        }

        // Generate new OTP
        const otp = generateOTP();
        const otp_hash = hashDataWithExpiry(otp, 5); // 5 minutes expiry

        // Update otp_hash in database
        user.otp_hash = otp_hash;
        await user.save();

        // Determine channel: use email if explicitly requested and user has an email
        const useEmail = sendOtpTo === 'email' && user.email;

        if (useEmail) {
            const emailResult = await sendOTPEmail(user.email, otp);
            if (!emailResult.success) {
                return fail(res, { message: "Failed to send OTP email", error: emailResult.error }, 500);
            }
            return success(res, {
                message: "OTP has been resent to your email address",
                mobile: normalizedMobile,
                sentTo: 'email'
            });
        }

        // Default: SMS
        const smsResult = await sendOTPMessage(normalizedMobile, otp);
        if (!smsResult.success) {
            return fail(res, { message: "Failed to send OTP SMS", error: smsResult.error }, 500);
        }
        const smsRequestId = smsResult?.data?.request_id || smsResult?.data?.message;

        return success(res, {
            message: "OTP has been resent to your mobile",
            mobile: normalizedMobile,
            sentTo: 'mobile',
            smsRequestId
        });

    } catch (error) {
        console.error("Resend OTP Error:", error);
        return fail(res, error, 500);
    }
};

export default resendOtp;
