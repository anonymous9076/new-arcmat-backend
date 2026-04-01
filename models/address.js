import mongoose from "mongoose";
import moment from "moment-timezone";

const addressSchema = mongoose.Schema(
  {
    first_name: {
      type: String,
      required: true,
    },
    last_name: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
    address1: {
      type: String,
      required: true,
    },
    address2: {
      type: String,
      required: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usertable",
      required: true,
    },
    email: {
      type: String,
      required: [true, "email is Required"],
    },
    mobile: {
      type: String,
      required: [true, "mobile is Required"],
    },
    status: {
      type: Number,
      default: 1,
    },
    defaultaddress: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Address = mongoose.model("address", addressSchema);
export default Address;
