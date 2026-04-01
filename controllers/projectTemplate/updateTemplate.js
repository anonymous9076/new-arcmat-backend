import ProjectTemplate from "../../models/projectTemplate.js";

const updateTemplate = async (req, res) => {
    try {
        const { templateId } = req.params;
        const userId = req.user.id || req.user._id;
        const updates = req.body;

        const template = await ProjectTemplate.findOneAndUpdate(
            { _id: templateId, creatorId: userId },
            updates,
            { new: true }
        );

        if (!template) {
            return res.status(404).json({ message: "Template not found or unauthorized" });
        }

        res.status(200).json({
            message: "Template updated successfully",
            data: template
        });
    } catch (error) {
        console.error("Error in updateTemplate:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export default updateTemplate;
