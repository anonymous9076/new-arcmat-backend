import mongoose from "mongoose";

const moodboardTemplateSchema = mongoose.Schema(
    {
        templateId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ProjectTemplate',
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
        productMetadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        customPhotos: {
            type: Array,
            default: [],
        },
        customRows: {
            type: Array,
            default: [],
        },
        canvasBackgroundColor: {
            type: String,
            default: '#f0eee9',
        },
    },
    {
        timestamps: true,
    }
);

const MoodboardTemplate = mongoose.model("MoodboardTemplate", moodboardTemplateSchema);
export default MoodboardTemplate;
