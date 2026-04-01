import mongoose from 'mongoose';

const retailerBrandSelectionSchema = new mongoose.Schema({
    retailerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usertable',
        required: true,
        index: true
    },
    brandId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand',
        required: true,
        index: true
    },
    city: {
        type: String,
        trim: true
    },
    state: {
        type: String,
        trim: true
    },
    selectedAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Index for analytics queries
retailerBrandSelectionSchema.index({ brandId: 1, city: 1, state: 1 });
retailerBrandSelectionSchema.index({ selectedAt: 1 });

const RetailerBrandSelection = mongoose.model('RetailerBrandSelection', retailerBrandSelectionSchema);

export default RetailerBrandSelection;
