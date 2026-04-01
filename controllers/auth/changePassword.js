import usertable from "../../models/user.js";
import bcrypt from "bcryptjs";
import { success, fail } from "../../middlewares/responseHandler.js";


const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user.id;

        if (!oldPassword || !newPassword) {
            return fail(res, { message: "Both old and new passwords are required" }, 400);
        }

        const user = await usertable.findById(userId);
        if (!user) {
            return fail(res, { message: "User not found" }, 404);
        }

        // Verify old password
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return fail(res, { message: "Incorrect old password" }, 401);
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update the user's password
        user.password = hashedPassword;
        await user.save();

        return success(res, { message: "Password updated successfully" });

    } catch (error) {
        console.error("Change Password Error:", error);
        return fail(res, { message: "Internal server error" }, 500);
    }
};

export default changePassword;
