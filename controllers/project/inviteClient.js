import Project from "../../models/project.js";
import { sendInvitationEmail } from "../../utils/emailutils.js";
import Usertable from "../../models/user.js";
import { success, fail } from '../../middlewares/responseHandler.js';

export const inviteClient = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { email, name } = req.body;
        const architectId = req.user.id;

        if (!email || !name) {
            return fail(res, new Error("Client email and name are required"), 400);
        }

        const project = await Project.findOne({ _id: projectId, architectId });
        if (!project) {
            return fail(res, new Error("Project not found or unauthorized"), 404);
        }

        // Check if client already invited
        const existingClientIndex = project.clients.findIndex(c => c.email === email);
        if (existingClientIndex !== -1) {
            const client = project.clients[existingClientIndex];

            if (client.status === 'Accepted') {
                return fail(res, new Error("Client has already accepted the invitation"), 400);
            }

            // Check if 5 minutes have passed
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            if (client.invitedAt > fiveMinutesAgo) {
                const timeLeft = Math.ceil((client.invitedAt - fiveMinutesAgo) / 1000 / 60);
                return fail(res, new Error(`Please wait ${timeLeft} more minute(s) before resending the invitation`), 400);
            }

            // If we're here, we can resend. We'll update invitedAt and name, and let the logic continue.
            project.clients[existingClientIndex].name = name;
            project.clients[existingClientIndex].invitedAt = new Date();
        } else {
            // Add new client to project (don't save yet, will save after email success)
            project.clients.push({ email, name, status: 'Pending', invitedAt: new Date() });
        }

        const architect = await Usertable.findById(architectId);
        const architectName = architect?.fullName || "An architect";

        // Professional invitation message
        const invitationLink = `${process.env.FRONTEND_URL}/invite/accept?projectId=${projectId}&email=${encodeURIComponent(email)}`;

        const emailResult = await sendInvitationEmail(email, name, architectName, project.projectName, invitationLink);

        if (!emailResult.success) {
            return fail(res, new Error("Failed to send invitation email"), 500);
        }

        // Save project with new/updated invitation
        await project.save();

        return success(res, {
            message: "Invitation sent successfully",
            client: { email, status: 'Pending' }
        }, 200);
    } catch (error) {
        console.error("Error in inviteClient:", error);
        return fail(res, error, 500);
    }
};
