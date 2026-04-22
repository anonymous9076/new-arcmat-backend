import jwt from "jsonwebtoken";
import usertable from "../../models/user.js";
import bcrypt from "bcryptjs";
import { success, fail } from "../../middlewares/responseHandler.js";

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return fail(res, { message: "Email and password are required" }, 400);
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

    // Generate token
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

    // Sanitize user object (remove password and internal fields)
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      professionalType: user.professionalType,
      profile: user.profile,
      selectedBrands: user.selectedBrands || []
    };

    return success(res, {
      message: "Login successful",
      token: token,
      user: userResponse
    });

  } catch (error) {
    console.error("Login error:", error);
    return fail(res, { message: "Internal server error" }, 500);
  }
};

export default login;
