import Usertable from "../../models/user.js";
import mongoose from "mongoose";

const deleteuser = async (req, res) => {
  try {
    // IDOR Check: Allow if admin or deleting self
    if (req.params.id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).send({ error: "Access denied" });
    }

    const user = await Usertable.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).send({ error: "User not found" });
    } else {
      res.status(200).send({ status: "successfully delete", data: user });
    }
  } catch (err) {
    res
      .status(500)
      .send({ error: "An error occurred while deleting User" });
  }
};
export default deleteuser;
