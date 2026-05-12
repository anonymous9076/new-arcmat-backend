import mongoose from 'mongoose';

const brandLeadSchema = new mongoose.Schema({
    brandId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usertable'
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
        match: [/^\d{10}$/, "Please provide a valid 10-digit phone number"]
    },
    location: {
        type: String,
        required: true
    },
    query: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Reviewed', 'Contacted'],
        default: 'Pending'
    }
}, { timestamps: true });

const BrandLead = mongoose.model('BrandLead', brandLeadSchema);

export default BrandLead;
