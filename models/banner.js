import mongoose from 'mongoose';

// Declare the Schema of the Mongo model
const bannerSchema = new mongoose.Schema({
    banner_name: {
        type: String,
        required: [true, "banner name is required"],
    },
    banner_alt: {
        type: String,
        required: [true, "banner Alt is required"],
    },
    banner_link: {
        type: String,
        required: [true, "banner link is required"],
    },
    banner_type: {
        type: String,
        required: [true, "banner type is required"],
    },
    description: {
        type: String,
        required: [true, "description is required"],
    },
    status: {
        type: Number,
        default: 1,
    },
    banner: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },

}, { timestamps: true });

//Export the model
export default mongoose.model('banner', bannerSchema);