import Project from "../../models/project.js";
import Usertable from "../../models/user.js";
import { success, fail } from '../../middlewares/responseHandler.js';
import bcrypt from "bcryptjs";

/**
 * Public endpoint for clients to accept an invitation to a project.
 * URL: PATCH /api/project/accept-invite
 */
export const acceptInvite = async (req, res) => {
    try {
        const { projectId, email, password } = req.body;

        if (!projectId || !email) {
            return fail(res, new Error("Project ID and email are required"), 400);
        }

        const project = await Project.findById(projectId);
        if (!project) {
            return fail(res, new Error("Project not found"), 404);
        }

        // Find the client in the project's clients array
        const clientIndex = project.clients.findIndex(c => c.email.toLowerCase() === email.toLowerCase());

        if (clientIndex === -1) {
            return fail(res, new Error("No invitation found for this email on this project"), 404);
        }

        // Update status to Accepted
        project.clients[clientIndex].status = 'Accepted';

        // Also add to User record if they exist and link back to project
        let user = await Usertable.findOne({ email: email.toLowerCase() });

        // If user doesn't exist and password is provided, create the account
        if (!user && !password) {
            return success(res, {
                requiresPassword: true,
                projectName: project.projectName,
                email: email
            }, 200);
        }

        if (!user && password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            user = await Usertable.create({
                name: project.clients[clientIndex].name || email.split('@')[0],
                email: email.toLowerCase(),
                password: hashedPassword,
                role: 'customer',
                isEmailVerified: 1, // Invited users are verified by clicking the link
                mobile: 'Not Provided' // Default or placeholder
            });
        }

        if (user) {
            // 1. Add userId to Project client record (metadata array)
            project.clients[clientIndex].userId = user._id;

            // 2. Add projectId to User's invitedProjects record
            if (!user.invitedProjects.includes(projectId)) {
                user.invitedProjects.push(projectId);
                await user.save();
            }
        }

        await project.save();

        return success(res, {
            message: "Invitation accepted successfully",
            projectName: project.projectName
        }, 200);
    } catch (error) {
        console.error("Error in acceptInvite:", error);
        return fail(res, error, 500);
    }
};
