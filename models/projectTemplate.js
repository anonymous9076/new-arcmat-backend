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
        type: {
            type: String,
            trim: true,
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
