import mongoose from "mongoose";

const projectSchema = mongoose.Schema(
    {
        architectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usertable',
            required: true,
            index: true,
        },
        projectName: {
            type: String,
            required: true,
            trim: true,
        },
        clientName: {
            type: String,
            trim: true,
            default: '',
        },
        location: {
            city: { type: String, trim: true },
            country: { type: String, trim: true },
            address: { type: String, trim: true },
        },
        estimatedDuration: {
            month: { type: Number },
            year: { type: Number },
        },
        budget: {
            type: String,
            trim: true,
        },
        type: {
            type: String,
            trim: true,
        },
        phase: {
            type: String,
            trim: true,
            enum: [
                'Concept Design',
                'Design Development',
                'Material Specification',
                'Construction',
                'Completed'
            ],
            default: 'Concept Design'
        },
        size: {
            type: String,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            trim: true,
            enum: ['Active', 'On hold', 'Completed', 'Canceled', 'Archived'],
            default: 'Active',
        },
        coverImage: {
            type: String,
            default: null,
        },
        renders: [
            {
                imageUrl: { type: String, required: true },
                public_id: { type: String, required: true },
                title: { type: String, trim: true, default: '' },
                uploadedAt: { type: Date, default: Date.now },
            }
        ],
        clients: [
            {
                email: { type: String, trim: true },
                name: { type: String, trim: true },
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Usertable',
                    default: null
                },
                status: {
                    type: String,
                    enum: ['Pending', 'Accepted'],
                    default: 'Pending'
                },
                invitedAt: { type: Date, default: Date.now }
            }
        ],
        // Privacy controls: what clients can see
        privacyControls: {
            showPriceToClient: { type: Boolean, default: false },
            showMaterials: { type: Boolean, default: true },
            showRenders: { type: Boolean, default: true },
            showMoodboards: { type: Boolean, default: true },
        },
        retailers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Usertable',
            }
        ],
    },
    {
        timestamps: true,
    }
);

const Project = mongoose.model("Project", projectSchema);
export default Project;
