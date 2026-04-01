import mongoose from 'mongoose';
const brandSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: [true, "Already registered"]
        },
        slug: {
            type: String,
            required: true,
            trim: true,
            unique: [true, "Already registered"]
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usertable'
        },
        shippingAddress: {
            type: String,
            ref: 'address'
        },
        billingAddress: {
            type: String,
            ref: 'address'
        },
        country: String,
        logo: mongoose.Schema.Types.Mixed,

        description: String,
        website: String,
        isActive: { type: Number, default: 1 },
        showOnHomepage: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// Create case-insensitive unique indexes for `name` and `slug`.
// Note: existing duplicate documents must be removed before these indexes can be created successfully.
brandSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
brandSchema.index({ slug: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

// Normalize values to help ensure uniqueness (trim & lowercase slug)
brandSchema.pre('save', function (next) {
    if (this.name && typeof this.name === 'string') this.name = this.name.trim();
    if (this.slug && typeof this.slug === 'string') this.slug = this.slug.trim().toLowerCase();
    return next();
});

export default mongoose.model('Brand', brandSchema);
