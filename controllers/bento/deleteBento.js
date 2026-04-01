import Bento from '../../models/bento.js';
import { success, fail } from "../../middlewares/responseHandler.js";

const deleteBentoItem = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedItem = await Bento.findByIdAndDelete(id);
        if (!deletedItem) {
            return fail(res, new Error("Bento item not found"), 404);
        }

        // Re-sort the remaining items' orders so no gaps exist
        await Bento.updateMany(
            { order: { $gt: deletedItem.order } },
            { $inc: { order: -1 } }
        );

        return success(res, { message: "Bento item deleted successfully" }, 200);
    } catch (err) {
        console.error("deleteBento error:", err);
        return fail(res, err, 500);
    }
}

export default deleteBentoItem;
