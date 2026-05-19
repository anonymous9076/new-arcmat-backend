import usertable from "../../models/user.js";
import jwt from "jsonwebtoken";
import { verifyHashedData } from "../../utils/otputils.js";
import { success, fail } from "../../middlewares/responseHandler.js";


const verifyOtp = async (req, res) => {
    try {
        const { mobile, otp } = req.body;
        const normalizedMobile = String(mobile || "").replace(/\D/g, "");

        if (!normalizedMobile || !otp) {
            return fail(res, { message: "Mobile and OTP are required" }, 400);
        }
        if (!/^\d{10}$/.test(normalizedMobile)) {
            return fail(res, { message: "Please provide a valid 10-digit mobile number" }, 400);
        }

        const user = await usertable.findOne({ mobile: normalizedMobile }).populate('selectedBrands', 'name logo slug isActive _id description website shippingAddress billingAddress');

        if (!user) {
            return fail(res, { message: "User not found" }, 404);
        }

        if (!user.otp_hash) {
            return fail(res, { message: "No OTP request found for this user" }, 400);
        }

        const isValid = verifyHashedData(otp, user.otp_hash);

        if (!isValid) {
            // Increment OTP attempts
            user.otp_attempts = (user.otp_attempts || 0) + 1;

            if (user.otp_attempts >= 3) {
                user.otp_blocked_until = new Date(Date.now() + 15 * 60 * 1000);
            }

            await user.save();

            const message = user.otp_attempts >= 3
                ? "Maximum attempts reached. Resending OTP is blocked for 15 minutes."
                : "Invalid or expired OTP";

            return fail(res, { message, attemptsRemaining: Math.max(0, 3 - user.otp_attempts) }, 401);
        }

        user.isPhoneVerified = 1;
        if (!user.email) {
            user.isEmailVerified = 0;
        }
        user.otp_hash = undefined;
        user.otp_attempts = 0;
        user.otp_blocked_until = undefined;
        user.verificationExpires = undefined;
        await user.save();

        if (user.role === 'architect' && !user.isVerified) {
            return success(res, {
                message: "OTP verified successfully",
                requireAdminVerification: true,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    mobile: user.mobile,
                    role: user.role
                },
                emailVerificationStatus: user.email ? (user.isEmailVerified ? "verified" : "unverified") : "missing"
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                mobile: user.mobile,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        return success(res, {
            message: "OTP verified successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role
            },
            emailVerificationStatus: user.email ? (user.isEmailVerified ? "verified" : "unverified") : "missing"
        });

    } catch (error) {
        console.error("OTP Verification Error:", error);
        return fail(res, { message: "Internal server error" }, 500);
    }
};

export default verifyOtp;
