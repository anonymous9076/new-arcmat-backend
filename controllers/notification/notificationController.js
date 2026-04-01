import Notification from "../../models/notification.js";
import { success, fail } from "../../middlewares/responseHandler.js";

export const createNotification = async (req, res) => {
    try {
        const { recipient, recipientType, recipientRole, type, message, relatedData, actionStatus } = req.body;
        const sender = req.user.id || req.user._id;

        const notification = new Notification({
            sender,
            recipient,
            recipientType,
            recipientRole,
            type,
            message,
            relatedData,
            actionStatus: actionStatus || (type === 'RETAILER_CONTACT_REQUEST' ? 'pending' : 'none')
        });

        await notification.save();
        return success(res, notification, 201);
    } catch (err) {
        console.error("createNotification error:", err);
        return fail(res, err, 500);
    }
};

export const getMyNotifications = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const userRole = req.user.role;

        const notifications = await Notification.find({
            $or: [
                { recipient: userId },
                { recipientType: 'role', recipientRole: userRole },
                { recipientType: 'all' }
            ]
        })
            .populate('sender', 'fullName name email profile mobile retailerProfile')
            .populate('relatedData.productId', 'product_name product_images skucode')
            .populate('relatedData.projectId', 'projectName location phase')
            .sort({ createdAt: -1 });

        return success(res, notifications, 200);
    } catch (err) {
        console.error("getMyNotifications error:", err);
        return fail(res, err, 500);
    }
};

export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
        if (!notification) return fail(res, { message: "Notification not found" }, 404);
        return success(res, notification, 200);
    } catch (err) {
        return fail(res, err, 500);
    }
};

export const handleAction = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'confirmed' or 'declined'

        const notification = await Notification.findById(id);
        if (!notification) return fail(res, { message: "Notification not found" }, 404);

        notification.actionStatus = status;
        await notification.save();

        // If RETAILER_CONTACT_REQUEST status updated, notify the architect back
        if (notification.type === 'RETAILER_CONTACT_REQUEST') {
            let architectMessage = '';
            if (status === 'confirmed') {
                architectMessage = `Great news! The retailer has shared their contact details for ${notification.message.split('using ')[1]?.split(' for')[0] || 'the product'}. You can now contact them directly.`;
            } else if (status === 'declined') {
                architectMessage = `The retailer was unable to share contact details for ${notification.message.split('using ')[1]?.split(' for')[0] || 'the product'} at this time.`;
            }

            if (architectMessage) {
                const architectNotify = new Notification({
                    sender: req.user.id || req.user._id, // The retailer
                    recipient: notification.sender, // The architect
                    type: 'CONTACT_SHARE_CONFIRMED',
                    message: architectMessage,
                    relatedData: {
                        ...notification.relatedData,
                        actionStatus: status
                    },
                    actionStatus: 'none'
                });
                await architectNotify.save();
            }
        }

        return success(res, notification, 200);
    } catch (err) {
        console.error("handleAction error:", err);
        return fail(res, err, 500);
    }
};
