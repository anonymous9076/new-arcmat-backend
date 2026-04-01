import mongoose from "mongoose";

const ratingSchema = mongoose.Schema(
    {
        who_rates: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usertable',
            required: true,
            index: true,
        },
        rates_to: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usertable',
            required: true,
            index: true,
        },
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
        },
        ratings: [
            {
                label: { type: String, required: true },
                rating: { type: Number, required: true, min: 1, max: 5 },
                message: { type: String, default: "" }
            }
        ]
    },
    {
        timestamps: true,
    }
);

const Rating = mongoose.model("Rating", ratingSchema);
export default Rating;
