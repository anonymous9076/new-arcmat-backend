import jwt from "jsonwebtoken";
import usertable from "../../models/user.js";
import { verifyHashedData } from "../../utils/otputils.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const MAX_LOGIN_OTP_ATTEMPTS = 5;

const verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return fail(res, { message: "Email and OTP are required" }, 400);
    }

    const user = await usertable
      .findOne({ email })
      .populate("selectedBrands", "name logo slug isActive _id description website shippingAddress billingAddress");

    if (!user) {
      return fail(res, { message: "User not found" }, 404);
    }

    if (!user.login_otp_hash) {
      return fail(res, { message: "No login OTP request found for this user" }, 400);
    }

    if (user.login_otp_blocked_until && user.login_otp_blocked_until > new Date()) {
      const waitTime = Math.ceil((user.login_otp_blocked_until - new Date()) / (60 * 1000));
      return fail(res, { message: `Too many failed attempts. Try again after ${waitTime} minutes.` }, 403);
    }

    const isValid = verifyHashedData(otp, user.login_otp_hash);
    if (!isValid) {
      user.login_otp_attempts = (user.login_otp_attempts || 0) + 1;

      if (user.login_otp_attempts >= MAX_LOGIN_OTP_ATTEMPTS) {
        user.login_otp_blocked_until = new Date(Date.now() + 15 * 60 * 1000);
      }

      await user.save();

      const message =
        user.login_otp_attempts >= MAX_LOGIN_OTP_ATTEMPTS
          ? "Maximum attempts reached. Login is blocked for 15 minutes."
          : "Invalid or expired OTP";

      return fail(
        res,
        {
          message,
          attemptsRemaining: Math.max(0, MAX_LOGIN_OTP_ATTEMPTS - user.login_otp_attempts)
        },
        401
      );
    }

    user.login_otp_hash = undefined;
    user.login_otp_attempts = 0;
    user.login_otp_blocked_until = undefined;
    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        professionalType: user.professionalType
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return success(res, {
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        professionalType: user.professionalType,
        profile: user.profile,
        selectedBrands: user.selectedBrands || []
      }
    });
  } catch (error) {
    console.error("Verify login OTP error:", error);
    return fail(res, { message: "Internal server error" }, 500);
  }
};

export default verifyLoginOtp;
