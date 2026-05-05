import mongoose from 'mongoose';

const contractorPortfolioItemSchema = new mongoose.Schema(
    {
        contractorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Contractor',
            required: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: String,
        images: [mongoose.Schema.Types.Mixed],
        videos: [String],
        
        beforeImage: mongoose.Schema.Types.Mixed,
        afterImage: mongoose.Schema.Types.Mixed,
        
        projectType: String,
        location: String,
        budgetRange: String,
        duration: String,
        materials: [String],
        servicesUsed: [String],
        
        isFeatured: {
            type: Boolean,
            default: false
        },
        displayOrder: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

contractorPortfolioItemSchema.index({ contractorId: 1, displayOrder: 1 });

const ContractorPortfolioItem = mongoose.model('ContractorPortfolioItem', contractorPortfolioItemSchema);
export default ContractorPortfolioItem;
