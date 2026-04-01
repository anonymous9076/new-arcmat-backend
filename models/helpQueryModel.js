import mongoose from "mongoose";

const helpQuerySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Usertable",
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    query: {
        type: String,
        required: true
    },
    attachments: [{
        type: String // URLs or file paths
    }],
    status: {
        type: String,
        enum: ["pending", "in-progress", "resolved", "closed"],
        default: "pending"
    },
    timeline: [{
        status: String,
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Usertable"
        },
        comment: String,
        updatedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

const HelpQuery = mongoose.model("HelpQuery", helpQuerySchema);

export default HelpQuery;
