import mongoose from "mongoose";

const sampleRequestSchema = mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: false,
            default: null,
            index: true,
        },
        spaceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Moodboard',
            default: null,
        },
        professionalId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usertable',
            required: true,
            index: true,
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        productName: {
            type: String,
            trim: true,
        },
        // Shipping address for sample delivery
        shippingAddress: {
            name: { type: String, trim: true },
            phone: { type: String, trim: true },
            address: { type: String, trim: true },
            city: { type: String, trim: true },
            pincode: { type: String, trim: true },
        },
        status: {
            type: String,
            enum: ['Sample Requested', 'Sample Approved', 'Sample Dispatched', 'Sample Delivered'],
            default: 'Sample Requested',
        },
        notes: {
            type: String,
            trim: true,
            default: null,
        },
        retailerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usertable',
            default: null,
            index: true,
        },
        dispatchedAt: {
            type: Date,
            default: null,
        },
        deliveredAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const SampleRequest = mongoose.model("SampleRequest", sampleRequestSchema);
export default SampleRequest;
