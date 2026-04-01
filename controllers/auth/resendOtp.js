import usertable from "../../models/user.js";
import { generateOTP, hashDataWithExpiry } from "../../utils/otputils.js";
import { sendOTPEmail } from "../../utils/emailutils.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const resendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return fail(res, { message: "Email is required" }, 400);
        }
        const user = await usertable.findOne({ email });

        if (!user) {
            return fail(res, { message: "User not found" }, 404);
        }
        if (user.isEmailVerified === 1) {
            return success(res, { message: "Email is already verified" });
        }

        // Check if resending is blocked
        if (user.otp_blocked_until && user.otp_blocked_until > new Date()) {
            const waitTime = Math.ceil((user.otp_blocked_until - new Date()) / (60 * 1000));
            return fail(res, { message: `Resending OTP is blocked. Please try again after ${waitTime} minutes.` }, 403);
        }

        // Generate new OTP Flow
        const otp = generateOTP();
        const otp_hash = hashDataWithExpiry(otp, 5); // 5 minutes expiry

        // Update otp_hash in database
        user.otp_hash = otp_hash;
        await user.save();

        // Send Email
        const emailResult = await sendOTPEmail(email, otp);

        if (!emailResult.success) {
            return fail(res, { message: "Failed to send OTP email", error: emailResult.error }, 500);
        }

        return success(res, { message: "OTP has been resent to your email", email: email });

    } catch (error) {
        console.error("Resend OTP Error:", error);
        return fail(res, error, 500);
    }
};

export default resendOtp;
