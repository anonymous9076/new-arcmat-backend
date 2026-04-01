import mongoose from "mongoose";

const discussionSchema = mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: false,
            index: true,
        },
        spaceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Moodboard',
            default: null,
            index: true,
        },
        authorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usertable',
            required: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        // Optional: link comment to a specific material (Catalog ID or Custom Photo ID)
        referencedMaterialId: {
            type: String,
            default: null,
        },
        referencedMaterialName: {
            type: String,
            trim: true,
            default: null,
        },
        // For material approval comments - "approve" | "comment" | "reject"
        type: {
            type: String,
            enum: ['comment', 'approve', 'reject'],
            default: 'comment',
        },
        // Material history reference (if this is an approval)
        materialHistoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MaterialHistory',
            default: null,
        },
        isInternal: {
            type: Boolean,
            default: false,
        },
        // Track who has read this message
        readBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usertable'
        }],
        retailerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usertable',
            default: null,
            index: true,
        },
        attachments: [{
            type: String,
            default: [],
        }],
    },
    {
        timestamps: true,
    }
);

const Discussion = mongoose.model("Discussion", discussionSchema);
export default Discussion;
