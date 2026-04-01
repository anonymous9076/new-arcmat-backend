import mongoose from 'mongoose';

const retailerProductSchema = new mongoose.Schema({
    retailerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usertable',
        required: true,
        index: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true
    },
    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'variant',
        required: true,
        index: true
    },
    mrp_price: {
        type: Number,
        required: true,
        min: 0
    },
    selling_price: {
        type: Number,
        required: true,
        min: 0
    },
    stock: {
        type: Number,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound index to ensure a retailer only has one override per variant
retailerProductSchema.index({ retailerId: 1, productId: 1, variantId: 1 }, { unique: true });

const RetailerProduct = mongoose.model('RetailerProduct', retailerProductSchema);

export default RetailerProduct;
