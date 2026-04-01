import mongoose from "mongoose";

const moodboardSchema = mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: true,
            index: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usertable',
            required: true,
            index: true,
        },
        moodboard_name: {
            type: String,
            required: true,
            trim: true,
        },
        estimatedCostId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'EstimatedCost',
            default: null,
            index: true,
        },
        canvasState: {
            type: Array,
            default: [],
        },
        totalBudget: {
            type: Number,
            default: 0,
        },
        coverImage: {
            type: String,
            default: null,
        },
        // Per-product metadata: { [productId]: { status, tags, notes } }
        productMetadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        // Custom user-uploaded photos
        customPhotos: {
            type: Array,
            default: [],
        },
        // Manually-added export rows
        customRows: {
            type: Array,
            default: [],
        },
        canvasBackgroundColor: {
            type: String,
            default: '#f0eee9',
        },
        // Controls whether client can see prices for this space
        showPriceToClient: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const Moodboard = mongoose.model("Moodboard", moodboardSchema);
export default Moodboard;
