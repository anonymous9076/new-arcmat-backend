import usertable from "../../models/user.js";
import { generateOTP, hashDataWithExpiry } from "../../utils/otputils.js";
import { sendLoginOTPEmail } from "../../utils/emailutils.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const resendLoginOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return fail(res, { message: "Email is required" }, 400);
    }

    const user = await usertable.findOne({ email });
    if (!user) {
      return fail(res, { message: "User not found" }, 404);
    }

    if (user.login_otp_blocked_until && user.login_otp_blocked_until > new Date()) {
      const waitTime = Math.ceil((user.login_otp_blocked_until - new Date()) / (60 * 1000));
      return fail(res, { message: `Resending OTP is blocked. Try again after ${waitTime} minutes.` }, 403);
    }

    const otp = generateOTP();
    user.login_otp_hash = hashDataWithExpiry(otp, 5);
    user.login_otp_attempts = 0;
    user.login_otp_blocked_until = undefined;
    await user.save();

    const emailResult = await sendLoginOTPEmail(user.email, otp);
    if (!emailResult.success) {
      return fail(res, { message: "Failed to send OTP email. Please try again." }, 500);
    }

    return success(res, { message: "Login OTP has been resent", email: user.email });
  } catch (error) {
    console.error("Resend login OTP error:", error);
    return fail(res, { message: "Internal server error" }, 500);
  }
};

export default resendLoginOtp;
