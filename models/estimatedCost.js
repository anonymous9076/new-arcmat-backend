import mongoose from "mongoose";

const estimatedCostSchema = mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: true,
            index: true,
        },
        productIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'RetailerProduct',
            },
        ],
        moodboardId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Moodboard',
            required: true,
            index: true,
        },
        costing: {
            type: Number,
            required: true,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

const EstimatedCost = mongoose.model("EstimatedCost", estimatedCostSchema);
export default EstimatedCost;
