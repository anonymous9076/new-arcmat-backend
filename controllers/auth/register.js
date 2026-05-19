import usertable from "../../models/user.js";
import bcrypt from "bcryptjs";
import { success, fail } from "../../middlewares/responseHandler.js";
import { generateOTP, hashDataWithExpiry } from "../../utils/otputils.js";
import { sendOTPMessage } from "../../utils/smsutils.js";
import { sendOTPEmail } from "../../utils/emailutils.js";
import dotenv from 'dotenv';
dotenv.config();


const register = async (req, res) => {
  try {
    const { name, email, mobile, password, role, profile, professionalType, providerType, sendOtpTo } = req.body;

    if (!name || !mobile || !password || !role) {
      return fail(res, { message: "Name, mobile, password and role are required" }, 400);
    }
    if (role === 'admin') {
      return fail(res, { message: "Admin cannot be registered" }, 400);
    }

    const normalizedMobile = String(mobile).replace(/\D/g, "");
    if (!/^\d{10}$/.test(normalizedMobile)) {
      return fail(res, { message: "Please provide a valid 10-digit mobile number" }, 400);
    }

    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    const existingUser = await usertable.findOne({
      $or: [
        { mobile: normalizedMobile },
        ...(normalizedEmail ? [{ email: normalizedEmail }] : [])
      ]
    });

    if (existingUser) {
      if (existingUser.mobile === normalizedMobile) {
        return fail(res, { message: "Mobile is already registered" }, 409);
      }
      return fail(res, { message: "Email is already registered" }, 409);
    }

    const salt = await bcrypt.genSalt(10);
    const bcrypt_password = await bcrypt.hash(password, salt);

    // Build user object — only include email if actually provided
    const userData = {
      name,
      mobile: normalizedMobile,
      password: bcrypt_password,
      role,
      profile,
      professionalType,
      providerType,
      isPhoneVerified: 0,
      verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    };
    if (normalizedEmail) {
      userData.email = normalizedEmail;
      userData.isEmailVerified = 0;
    }
    const createuser = new usertable(userData);
    const response = await createuser.save();
    const otp = generateOTP();
    const otp_hash = hashDataWithExpiry(otp, 5);

    // Save otp_hash to user
    await usertable.findByIdAndUpdate(response._id, { otp_hash });

    // Determine OTP delivery channel:
    // If the user has provided an email AND explicitly chose email, send via email
    const useEmail = sendOtpTo === 'email' && normalizedEmail;

    if (useEmail) {
      const emailResult = await sendOTPEmail(normalizedEmail, otp);
      if (!emailResult.success) {
        return fail(res, { message: "Failed to send OTP email", error: emailResult.error }, 500);
      }
      return success(res, {
        message: "OTP sent to your email address",
        mobile: normalizedMobile,
        email: normalizedEmail,
        sentTo: 'email'
      }, 201);
    }

    // Default: send OTP via SMS to mobile
    const smsResult = await sendOTPMessage(normalizedMobile, otp);
    if (!smsResult.success) {
      return fail(res, { message: "Failed to send OTP SMS", error: smsResult.error }, 500);
    }

    return success(res, {
      message: "OTP sent to your mobile number",
      mobile: normalizedMobile,
      email: normalizedEmail || undefined,
      sentTo: 'mobile'
    }, 201);
  } catch (errors) {
    console.error("register error:", errors);

    // Handle MongoDB duplicate key errors (E11000) with friendly messages
    if (errors.code === 11000) {
      const field = Object.keys(errors.keyPattern || {})[0];
      if (field === 'mobile') {
        return fail(res, { message: "Mobile is already registered" }, 409);
      }
      if (field === 'email') {
        return fail(res, { message: "Email is already registered" }, 409);
      }
      return fail(res, { message: "An account with these details already exists" }, 409);
    }

    return fail(res, { message: errors.message || "Registration failed" }, 422);
  }
};

export default register;
