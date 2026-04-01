import mongoose from 'mongoose';

const bentoSchema = new mongoose.Schema({
    title: {
        type: String,
        default: ""
    },
    subtitle: {
        type: String,
        default: ""
    },
    link: {
        type: String,
        default: ""
    },
    order: {
        type: Number,
        required: true,
        unique: true
    },
    image: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    }
}, { timestamps: true });

export default mongoose.model('Bento', bentoSchema);
