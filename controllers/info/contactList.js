import contact from "../../models/contactus.js";
import { success, fail } from '../../middlewares/responseHandler.js';

const contactlist = async (req, res) => {
  try {
    const contactlisting = await contact.find();
    return success(res, contactlisting, 200);
  } catch (err) {
    console.error('contactlist error:', err);
    return fail(res, err, 500);
  }
};

export default contactlist;
