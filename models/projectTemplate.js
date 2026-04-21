import mongoose from "mongoose";

const projectTemplateSchema = mongoose.Schema(
    {
        creatorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usertable',
            required: true,
            index: true,
        },
        templateName: {
            type: String,
            required: true,
            trim: true,
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
        coverImage: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const ProjectTemplate = mongoose.model("ProjectTemplate", projectTemplateSchema);
export default ProjectTemplate;
