import usertable from "../../models/user.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import emailconfig from "../../middlewares/emailConfig.js";
import { success, fail } from "../../middlewares/responseHandler.js";
import { generateOTP, hashDataWithExpiry } from "../../utils/otputils.js";
import { sendOTPEmail } from "../../utils/emailutils.js";
import dotenv from 'dotenv';
dotenv.config();


const register = async (req, res) => {
  try {
    const { name, email, mobile, password, role, profile, professionalType } = req.body;

    if (!name || !email || !mobile || !password || !role) {
      return fail(res, { message: "All fields are required" }, 400);
    }
    if (role === 'admin') {
      return fail(res, { message: "Admin cannot be registered" }, 400);
    }
    const salt = await bcrypt.genSalt(10);
    const bcrypt_password = await bcrypt.hash(password, salt);
    const createuser = new usertable({
      name,
      email,
      mobile,
      password: bcrypt_password,
      role,
      profile,
      professionalType,
      verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    });
    const response = await createuser.save();
    const otp = generateOTP();
    const otp_hash = hashDataWithExpiry(otp, 5);

    // Save otp_hash to user
    await usertable.findByIdAndUpdate(response._id, { otp_hash });

    // Send Email
    await sendOTPEmail(email, otp);

    return success(res, { message: "OTP is sent to your email", email: email }, 201);
  } catch (errors) {
    console.error("register error:", errors);
    return fail(res, errors, 422);
  }
};

export default register;
