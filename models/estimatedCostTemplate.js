import mongoose from "mongoose";

const estimatedCostTemplateSchema = mongoose.Schema(
    {
        templateId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ProjectTemplate',
            required: true,
            index: true,
        },
        moodboardTemplateId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MoodboardTemplate',
            required: true,
            index: true,
        },
        productIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'RetailerProduct',
            },
        ],
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

const EstimatedCostTemplate = mongoose.model("EstimatedCostTemplate", estimatedCostTemplateSchema);
export default EstimatedCostTemplate;
