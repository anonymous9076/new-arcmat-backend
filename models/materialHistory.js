import mongoose from "mongoose";

const materialHistorySchema = mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: true,
            index: true,
        },
        spaceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Moodboard',
            required: true,
            index: true,
        },
        spaceName: {
            type: String,
            trim: true,
        },
        materialId: {
            type: String,
            default: null,
        },
        materialName: {
            type: String,
            trim: true,
        },
        materialImage: {
            type: String,
            default: null,
        },
        version: {
            type: Number,
            default: 1,
        },
        previousMaterialId: {
            type: String,
            default: null,
        },
        previousMaterialName: {
            type: String,
            trim: true,
            default: null,
        },
        previousMaterialImage: {
            type: String,
            default: null,
        },
        reason: {
            type: String,
            trim: true,
            default: null,
        },
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usertable',
            required: true,
        },
        changeDate: {
            type: Date,
            default: Date.now,
        },
        // Approval tracking
        status: {
            type: String,
            enum: ['Pending', 'Approved', 'Rejected', 'Replaced'],
            default: 'Pending',
        },
        approvalStatus: {
            type: String,
            enum: ['Pending', 'Approved', 'Rejected'],
            default: 'Pending',
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usertable',
            default: null,
        },
        approvalDate: {
            type: Date,
            default: null,
        },
        isFinal: {
            type: Boolean,
            default: false,
        },
        phase: {
            type: String,
            trim: true,
        },
        // Track who has seen this notification/approval request
        readBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usertable'
        }],
    },
    {
        timestamps: true,
    }
);

const MaterialHistory = mongoose.model("MaterialHistory", materialHistorySchema);
export default MaterialHistory;
