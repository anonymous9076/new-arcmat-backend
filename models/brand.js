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
        bespokePage: {
            headline: String,
            bio: String,
            tags: [String],
            theme: mongoose.Schema.Types.Mixed,
            contact: mongoose.Schema.Types.Mixed,
            heroImage: mongoose.Schema.Types.Mixed,
            customImage: mongoose.Schema.Types.Mixed,
            galleryMedia: [{
                type: mongoose.Schema.Types.Mixed
            }],
            collections: [{
                title: String,
                description: String,
                image: mongoose.Schema.Types.Mixed,
                productIds: [{
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product'
                }],
                materials: [String],
                variants: [String],
                specs: [String]
            }],
            catalogs: [{
                title: String,
                year: String,
                pages: Number,
                featured: Boolean,
                cover: mongoose.Schema.Types.Mixed,
                file: mongoose.Schema.Types.Mixed,
                url: String
            }],
            videos: [{
                title: String,
                provider: String,
                videoId: String,
                poster: mongoose.Schema.Types.Mixed,
                url: String
            }],
            news: [{
                title: String,
                date: String,
                readTime: String,
                image: mongoose.Schema.Types.Mixed,
                excerpt: String,
                body: String
            }],
            selectedProductIds: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product'
            }],
            selectedRetailerIds: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Usertable'
            }],
            selectedContractorIds: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Contractor'
            }],
            reviews: [{
                name: String,
                role: String,
                rating: {
                    type: Number,
                    min: 1,
                    max: 5,
                    default: 5
                },
                comment: String
            }],
            isPublished: {
                type: Boolean,
                default: true
            }
        },
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
