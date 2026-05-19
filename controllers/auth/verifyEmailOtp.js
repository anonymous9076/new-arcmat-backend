import usertable from "../../models/user.js";
import { verifyHashedData } from "../../utils/otputils.js";
import { success, fail } from "../../middlewares/responseHandler.js";

/**
 * POST /api/user/verify-email-otp
 * Authenticated. Verifies the OTP sent to the user's email address.
 */
const verifyEmailOtp = async (req, res) => {
    try {
        const userId = req.user.id;
        const { otp } = req.body;

        if (!otp) {
            return fail(res, { message: "OTP is required" }, 400);
        }

        const user = await usertable.findById(userId);
        if (!user) {
            return fail(res, { message: "User not found" }, 404);
        }

        if (!user.email) {
            return fail(res, { message: "No email address found. Please add an email first." }, 400);
        }

        if (user.isEmailVerified === 1) {
            return success(res, { message: "Email is already verified" });
        }

        if (!user.email_otp_hash) {
            return fail(res, { message: "No verification code found. Please request a new one." }, 400);
        }

        const isValid = verifyHashedData(otp, user.email_otp_hash);

        if (!isValid) {
            return fail(res, { message: "Invalid or expired verification code" }, 401);
        }

        // Mark email as verified and clear the OTP hash
        user.isEmailVerified = 1;
        user.email_otp_hash = undefined;
        await user.save();

        return success(res, {
            message: "Email verified successfully!",
            email: user.email,
            isEmailVerified: 1
        });

    } catch (error) {
        console.error("Verify Email OTP Error:", error);
        return fail(res, { message: "Internal server error" }, 500);
    }
};

export default verifyEmailOtp;
