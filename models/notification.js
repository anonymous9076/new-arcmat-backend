import mongoose from "mongoose";

const notificationSchema = mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usertable',
            required: true,
        },
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usertable',
            required: false, // Optional if it's role-based
        },
        recipientType: {
            type: String,
            enum: ['individual', 'role', 'all'],
            default: 'individual',
        },
        recipientRole: {
            type: String,
            enum: ['admin', 'architect', 'retailer', 'brand', 'customer'],
            required: false,
        },
        type: {
            type: String,
            required: true,
            enum: ['RETAILER_CONTACT_REQUEST', 'SYSTEM_ANNOUNCEMENT', 'CONTACT_SHARE_CONFIRMED', 'NEW_MESSAGE', 'REQUEST_STATUS_UPDATE', 'SAMPLE_REQUEST'],
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        relatedData: {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            retailerProductId: { type: mongoose.Schema.Types.ObjectId, ref: 'RetailerProduct' },
            projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
            city: { type: String, trim: true },
        },
        actionStatus: {
            type: String,
            enum: ['pending', 'confirmed', 'declined', 'none'],
            default: 'none',
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
