import usertable from "../../models/user.js";
import bcrypt from "bcryptjs";
import { success, fail } from "../../middlewares/responseHandler.js";
import { generateOTP, hashDataWithExpiry } from "../../utils/otputils.js";
import { sendLoginOTPEmail } from "../../utils/emailutils.js";
import { verifyTurnstileToken } from "../../utils/turnstile.js";

const login = async (req, res) => {
  try {
    const { email, password, captchaToken } = req.body;
    const isCaptchaEnabled = process.env.ENFORCE_LOGIN_CAPTCHA === "true";

    if (!email || !password) {
      return fail(res, { message: "Email and password are required" }, 400);
    }

    if (isCaptchaEnabled) {
      const captchaValidation = await verifyTurnstileToken(captchaToken, req);
      if (!captchaValidation.success) {
        return fail(res, { message: captchaValidation.reason }, 400);
      }
    }

    const user = await usertable.findOne({ email }).populate('selectedBrands', 'name logo slug isActive _id description website shippingAddress billingAddress');

    if (!user) {
      return fail(res, { message: "Invalid credentials" }, 401);
    }

    // Check if email is verified
    if (user.isEmailVerified === 0) {
      return fail(res, { message: "Email not verified. Please verify your email before logging in." }, 403);
    }

    // Check if user is active
    if (user.isActive === 0) {
      return fail(res, { message: "Account is deactivated. Please contact support." }, 403);
    }

    // Check if architect is verified by admin
    if (user.role === 'architect' && !user.isVerified) {
      return fail(res, { message: "Let admin verify your details first please wait" }, 403);
    }

    const isMatch = await bcrypt.compare(password.trim(), user.password);
    if (!isMatch) {
      return fail(res, { message: "Invalid credentials" }, 401);
    }

    if (user.login_otp_blocked_until && user.login_otp_blocked_until > new Date()) {
      const waitTime = Math.ceil((user.login_otp_blocked_until - new Date()) / (60 * 1000));
      return fail(res, { message: `Too many failed OTP attempts. Try again after ${waitTime} minutes.` }, 403);
    }

    const otp = generateOTP();
    const login_otp_hash = hashDataWithExpiry(otp, 5);

    user.login_otp_hash = login_otp_hash;
    user.login_otp_attempts = 0;
    user.login_otp_blocked_until = undefined;
    await user.save();

    const emailResult = await sendLoginOTPEmail(user.email, otp);
    if (!emailResult.success) {
      return fail(res, { message: "Failed to send OTP email. Please try again." }, 500);
    }

    return success(res, {
      message: "OTP sent to your email",
      requireLoginOtp: true,
      email: user.email
    });

  } catch (error) {
    console.error("Login error:", error);
    return fail(res, { message: "Internal server error" }, 500);
  }
};

export default login;
