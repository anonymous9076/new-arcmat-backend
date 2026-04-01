import wishlist from "../../models/wishlist.js";
const removewishlist = async (req, res) => {
  try {
    const { item_id } = req.params;
    const user_id = req.user.id;
    const deleteItem = await wishlist.findOneAndDelete({ _id: item_id, user_id });
    if (!deleteItem) {
      return res.status(404).send({ message: 'item not found in wishlist' });
    }
    res.status(200).send({ status: 'successfully', message: 'item deleted successfully from wishlist' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Server error' });
  }


}

export default removewishlist;
