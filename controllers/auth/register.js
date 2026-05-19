import usertable from "../../models/user.js";
import bcrypt from "bcryptjs";
import { success, fail } from "../../middlewares/responseHandler.js";
import { generateOTP, hashDataWithExpiry } from "../../utils/otputils.js";
import { sendOTPMessage } from "../../utils/smsutils.js";
import dotenv from 'dotenv';
dotenv.config();


const register = async (req, res) => {
  try {
    const { name, email, mobile, password, role, profile, professionalType, providerType } = req.body;

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
    const createuser = new usertable({
      name,
      email: normalizedEmail || undefined,
      mobile: normalizedMobile,
      password: bcrypt_password,
      role,
      profile,
      professionalType,
      providerType,
      isEmailVerified: normalizedEmail ? 0 : 0,
      isPhoneVerified: 0,
      verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    });
    const response = await createuser.save();
    const otp = generateOTP();
    const otp_hash = hashDataWithExpiry(otp, 5);

    // Save otp_hash to user
    await usertable.findByIdAndUpdate(response._id, { otp_hash });

    const smsResult = await sendOTPMessage(normalizedMobile, otp);
    if (!smsResult.success) {
      return fail(res, { message: "Failed to send OTP SMS", error: smsResult.error }, 500);
    }
    const smsRequestId = smsResult?.data?.request_id || smsResult?.data?.message;

    return success(res, {
      message: "OTP sent to your mobile number",
      mobile: normalizedMobile,
      emailRequiredForNotifications: !normalizedEmail,
      smsRequestId
    }, 201);
  } catch (errors) {
    console.error("register error:", errors);
    return fail(res, errors, 422);
  }
};

export default register;
