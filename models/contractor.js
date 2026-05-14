import mongoose from 'mongoose';

const contractorSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usertable',
            required: true
        },
        providerType: {
            type: String,
            enum: ['contractor', 'custom_maker', 'bespoke_vendor'],
            default: 'contractor',
            required: true
        },
        businessName: {
            type: String,
            required: true,
            trim: true
        },
        slug: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },
        tagline: String,
        overview: String,
        profileImage: mongoose.Schema.Types.Mixed,
        coverImage: mongoose.Schema.Types.Mixed,
        gallery: [mongoose.Schema.Types.Mixed],
        videos: [String],
        
        // Categorization
        categoryId: {
            type: mongoose.Schema.Types.Mixed,
            ref: 'Category'
        },
        subcategoryId: {
            type: mongoose.Schema.Types.Mixed,
            ref: 'Category'
        },
        subcategoryIds: [{
            type: mongoose.Schema.Types.Mixed,
            ref: 'Category'
        }],
        otherCategoryName: String,
        otherSubcategoryName: String,
        serviceIds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category'
        }],
        customServices: [String],
        
        // Capability Tags
        tags: [String],
        bespokeCapabilities: [String],
        materials: [String],
        workTypes: [String],
        projectTypes: [String],
        
        // Professional Details
        experienceYears: Number,
        teamSize: Number,
        completedProjects: Number,
        certifications: [String],
        
        // Location Details
        location: {
            city: String,
            state: String,
            country: { type: String, default: 'India' },
            address: String,
            pincode: String,
            coordinates: {
                lat: Number,
                lng: Number
            }
        },
        serviceAreas: [String],
        
        // Contact Details
        contact: {
            phone: {
                type: String,
                match: [/^\d{10}$/, "Please provide a valid 10-digit phone number"]
            },
            whatsapp: {
                type: String,
                match: [/^\d{10}$/, "Please provide a valid 10-digit WhatsApp number"]
            },
            email: String,
            website: String,
            instagram: String,
            linkedin: String,
            portfolioUrl: String,
            preferredContactMethod: {
                type: String,
                enum: ['phone', 'whatsapp', 'email'],
                default: 'phone'
            }
        },
        
        // Pricing Details
        pricing: {
            startingPrice: Number,
            perSqFtRate: Number,
            hourlyRate: Number,
            dayRate: Number,
            consultationFee: Number,
            currency: { type: String, default: 'INR' },
            pricingType: {
                type: String,
                enum: ['fixed', 'per_sq_ft', 'hourly', 'quote_based', 'consultation'],
                default: 'quote_based'
            },
            budgetRangeMin: Number,
            budgetRangeMax: Number,
            showPricingPublicly: { type: Boolean, default: true }
        },
        
        // Availability
        availability: {
            status: { type: String, enum: ['available', 'busy', 'away'], default: 'available' },
            workingHours: {
                monday: { from: String, to: String, isClosed: { type: Boolean, default: false } },
                tuesday: { from: String, to: String, isClosed: { type: Boolean, default: false } },
                wednesday: { from: String, to: String, isClosed: { type: Boolean, default: false } },
                thursday: { from: String, to: String, isClosed: { type: Boolean, default: false } },
                friday: { from: String, to: String, isClosed: { type: Boolean, default: false } },
                saturday: { from: String, to: String, isClosed: { type: Boolean, default: false } },
                sunday: { from: String, to: String, isClosed: { type: Boolean, default: false } }
            }
        },
        responseTime: String,
        views: { type: Number, default: 0 },
        
        // Marketplace Status
        status: {
            type: String,
            enum: ['draft', 'pending_review', 'approved', 'rejected', 'suspended', 'archived'],
            default: 'draft'
        },
        isFeatured: { type: Boolean, default: false },
        isVerified: { type: Boolean, default: false },
        isTopRated: { type: Boolean, default: false },
        
        // Admin Metadata
        adminNotes: String,
        rejectionReason: String,
        publishedAt: Date,
        visibility: {
            type: String,
            enum: ['public', 'private'],
            default: 'public'
        }
    },
    { timestamps: true }
);

// Indexes
contractorSchema.index({ slug: 1 }, { unique: true });
contractorSchema.index({ businessName: 'text', tagline: 'text', overview: 'text' });
contractorSchema.index({ "location.city": 1 });
contractorSchema.index({ categoryId: 1 });
contractorSchema.index({ status: 1 });

// Middleware to normalize slug
contractorSchema.pre('save', function (next) {
    if (this.slug && typeof this.slug === 'string') {
        this.slug = this.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }
    next();
});

const Contractor = mongoose.model('Contractor', contractorSchema);
export default Contractor;
