import contact from "../../models/contactus.js";
import { success, fail } from '../../middlewares/responseHandler.js';

const contactus = async (req, res) => {
  try {
    const { fname, lname, message, emailID, mobile_no } = req.body;
    const sanddata = new contact({
      firstname: fname,
      lastname: lname,
      mobile: mobile_no,
      email: emailID,
      Message: message
    });
    const rel = await sanddata.save();
    return success(res, rel, 201);
  } catch (err) {
    console.error('contactus error:', err);
    return fail(res, err, 500);
  }
};

export default contactus;
