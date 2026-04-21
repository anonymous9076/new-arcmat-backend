import Project from "../../models/project.js";
import Moodboard from "../../models/moodboard.js";
import EstimatedCost from "../../models/estimatedCost.js";
import ProjectTemplate from "../../models/projectTemplate.js";
import MoodboardTemplate from "../../models/moodboardTemplate.js";
import EstimatedCostTemplate from "../../models/estimatedCostTemplate.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const hasNonEmptyString = (value) => typeof value === "string" && value.trim() !== "";

const resolveLocation = (incomingLocation, templateLocation) => {
    const hasIncomingLocation = incomingLocation && typeof incomingLocation === "object" && [
        incomingLocation.address,
        incomingLocation.city,
    ].some(hasNonEmptyString);

    return hasIncomingLocation
        ? { ...(templateLocation || {}), ...incomingLocation }
        : templateLocation;
};

const resolveEstimatedDuration = (incomingDuration, templateDuration) => {
    const hasIncomingDuration = incomingDuration && typeof incomingDuration === "object" && (
        (incomingDuration.month !== undefined && incomingDuration.month !== "") ||
        (incomingDuration.year !== undefined && incomingDuration.year !== "")
    );

    return hasIncomingDuration
        ? { ...(templateDuration || {}), ...incomingDuration }
        : templateDuration;
};

const useTemplate = async (req, res) => {
    try {
        const { templateId } = req.params;
        const userId = req.user.id;
        const role = req.user.role;
        const {
            projectName,
            clientName,
            location,
            type,
            phase,
            size,
            budget,
            estimatedDuration,
            description,
        } = req.body;

        const template = await ProjectTemplate.findById(templateId);
        if (!template) {
            return fail(res, new Error("Template not found"), 404);
        }

        const isOwner = template.creatorId && template.creatorId.toString() === userId.toString();
        if (role !== "admin" && !isOwner) {
            return fail(res, new Error("Unauthorized to use this template"), 403);
        }

        const normalizedProjectName = hasNonEmptyString(projectName)
            ? projectName.trim().replace(/\s+/g, " ")
            : `${template.templateName} Copy`;

        // 1. Create new Project from template
        const projectData = {
            architectId: userId,
            projectName: normalizedProjectName,
            clientName: hasNonEmptyString(clientName) ? clientName.trim() : '',
            location: resolveLocation(location, template.location),
            type: hasNonEmptyString(type) ? type.trim() : template.type,
            phase: hasNonEmptyString(phase) ? phase.trim() : (template.phase || 'Concept Design'),
            size: hasNonEmptyString(size) ? size.trim() : template.size,
            budget: hasNonEmptyString(budget) ? budget.trim() : template.budget,
            estimatedDuration: resolveEstimatedDuration(estimatedDuration, template.estimatedDuration),
            description: hasNonEmptyString(description) ? description.trim() : template.description,
            coverImage: template.coverImage,
            status: 'Active',
        };
        const newProject = await Project.create(projectData);

        // 2. Fetch all MoodboardTemplates for this template
        const mbTemplates = await MoodboardTemplate.find({ templateId });

        for (const mbTemplate of mbTemplates) {
            // 3. Create new Moodboard from template
            const moodboardData = {
                projectId: newProject._id,
                userId: userId,
                moodboard_name: mbTemplate.moodboard_name,
                canvasState: mbTemplate.canvasState,
                totalBudget: mbTemplate.totalBudget,
                coverImage: mbTemplate.coverImage,
                productMetadata: mbTemplate.productMetadata,
                customPhotos: mbTemplate.customPhotos,
                customRows: mbTemplate.customRows,
                canvasBackgroundColor: mbTemplate.canvasBackgroundColor
            };
            const newMoodboard = await Moodboard.create(moodboardData);

            // 4. Fetch EstimatedCostTemplate for this mbTemplate
            const ecTemplate = await EstimatedCostTemplate.findOne({ moodboardTemplateId: mbTemplate._id });
            if (ecTemplate) {
                const ecData = {
                    projectId: newProject._id,
                    moodboardId: newMoodboard._id,
                    productIds: ecTemplate.productIds,
                    costing: ecTemplate.costing
                };
                const newEstimatedCost = await EstimatedCost.create(ecData);

                // Update moodboard with estimatedCostId
                newMoodboard.estimatedCostId = newEstimatedCost._id;
                await newMoodboard.save();
            }
        }

        return success(res, newProject, 201);
    } catch (err) {
        console.error("useTemplate error:", err);
        return fail(res, err, 500);
    }
};

export default useTemplate;
