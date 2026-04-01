import Bento from '../../models/bento.js';
import { success, fail } from "../../middlewares/responseHandler.js";

const getBentoItems = async (req, res) => {
    try {
        let items = await Bento.find().sort({ order: 1 });
        return success(res, items, 200);
    } catch (err) {
        return fail(res, err, 500);
    }
}

export default getBentoItems;
