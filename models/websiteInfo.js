import mongoose from 'mongoose';

// Declare the Schema of the Mongo model
const webinfoSchema = new mongoose.Schema({
    website_name: {
        type: String,
    },
    mobile_no: {
        type: [String],
        default: [],
    },
    address: {
        type: [String],
        default: [],
    },
    email: {
        type: [String],
        default: [],
    },
    facebook: {
        type: String,
        default: null,
    },
    instagram: {
        type: String,
        default: null,
    },
    youtube: {
        type: String,
        default: null,
    },
    twitter: {
        type: String,
        default: null,
    },
    pinterest: {
        type: String,
        default: null,
    },
    gstno: {
        type: String,
        default: null,
    },
    logo: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },

}, { timestamps: true });

//Export the model
export default mongoose.model('Webinfo', webinfoSchema);