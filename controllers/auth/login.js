import usertable from "../../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { success, fail } from "../../middlewares/responseHandler.js";
import { verifyTurnstileToken } from "../../utils/turnstile.js";

const login = async (req, res) => {
  try {
    const { mobile, email, loginId, identifier, password, captchaToken } = req.body;
    const isCaptchaEnabled = process.env.ENFORCE_LOGIN_CAPTCHA === "true";
    const rawLogin = String(loginId || identifier || email || mobile || "").trim();
    const loginDigits = rawLogin.replace(/\D/g, "");
    const isEmailLogin = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawLogin);

    if (!rawLogin || !password) {
      return fail(res, { message: "Email or mobile and password are required" }, 400);
    }

    let userQuery = null;

    if (isEmailLogin) {
      userQuery = { email: rawLogin.toLowerCase() };
    } else if (loginDigits.length === 10) {
      userQuery = { mobile: loginDigits };
    } else if (loginDigits.length === 12 && loginDigits.startsWith("91")) {
      userQuery = { mobile: loginDigits.slice(2) };
    } else {
      return fail(res, { message: "Please provide a valid email or 10-digit mobile number" }, 400);
    }

    if (isCaptchaEnabled) {
      const captchaValidation = await verifyTurnstileToken(captchaToken, req);
      if (!captchaValidation.success) {
        return fail(res, { message: captchaValidation.reason }, 400);
      }
    }

    const user = await usertable.findOne(userQuery).populate('selectedBrands', 'name logo slug isActive _id description website shippingAddress billingAddress');

    if (!user) {
      return fail(res, { message: "Invalid credentials" }, 401);
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

    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        mobile: user.mobile,
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
      },
      emailVerificationStatus: user.email ? (user.isEmailVerified ? "verified" : "unverified") : "missing"
    });

  } catch (error) {
    console.error("Login error:", error);
    return fail(res, { message: "Internal server error" }, 500);
  }
};

export default login;
