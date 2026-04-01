import mongoose from "mongoose";

const retailerRequestSchema = mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: false,
            index: true,
        },
        professionalId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usertable',
            required: true,
            index: true,
        },
        // The material the architect wants a retailer for
        materialId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            default: null,
        },
        materialName: {
            type: String,
            trim: true,
            default: null,
        },
        city: {
            type: String,
            trim: true,
        },
        notes: {
            type: String,
            trim: true,
            default: null,
        },
        status: {
            type: String,
            enum: ['Pending', 'Processing', 'Confirmed', 'Closed'],
            default: 'Pending',
        },
        // Link to a specific retailer user on the platform
        retailerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usertable',
            default: null,
        },
        // Retailer contact info shared back after Arcmat confirms
        retailerDetails: {
            name: { type: String, trim: true },
            phone: { type: String, trim: true },
            city: { type: String, trim: true },
            brands: [{ type: String, trim: true }],
        },
        confirmedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const RetailerRequest = mongoose.model("RetailerRequest", retailerRequestSchema);
export default RetailerRequest;
