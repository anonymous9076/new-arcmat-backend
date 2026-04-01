import order from "../../models/order.js";
import cart from "../../models/cart.js";
import { success, fail } from '../../middlewares/responseHandler.js';


const singleorder = async (req, res) => {
  try {
    const data = await order.findById(req.params.id);

    if (!data) {
      return res.status(404).send({ error: "product not found" });
    }
    const existingCartItem = await cart.find({ orderid: data.orderid }).populate('product_variant_id', 'product_name product_image1 description selling_price mrp_price weight weighttype').populate('product_id', 'product_name product_image1 description selling_price mrp_price weight weighttype');
    return success(res, { status: "successfully", data, existingCartItem });;
  } catch (err) {
    res.status(500).send({ error: "An error occurred while fetching data" });
  }
};

export default singleorder;
