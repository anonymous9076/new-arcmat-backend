import mongoose from 'mongoose';

const inspirationGallerySchema = new mongoose.Schema({
    imageUrl: {
        type: String,
        required: true
    },
    renderId: {
        type: String,
        required: true
    },
    title: {
        type: String,
        trim: true,
        default: ''
    },
    architectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usertable',
        required: true
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    order: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

export default mongoose.model('InspirationGallery', inspirationGallerySchema);
