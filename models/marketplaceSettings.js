import mongoose from 'mongoose';

const marketplaceSettingsSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        value: mongoose.Schema.Types.Mixed,
        description: String,
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usertable'
        }
    },
    { timestamps: true }
);

const MarketplaceSettings = mongoose.model('MarketplaceSettings', marketplaceSettingsSchema);
export default MarketplaceSettings;
