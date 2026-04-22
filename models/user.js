import mongoose from "mongoose";
import moment from "moment-timezone";
// const indianTimestampPlugin = require("../middlewares/indiantimestampplugin");
const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: [true, "Already registered"],
      lowercase: true,
      trim: true
    },
    mobile: {
      type: String,
      required: [true, "Mobile is required"],
      unique: [true, "Already registered"],
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["customer", "architect", "retailer", "admin", "brand"],
      default: "customer"
    },
    professionalType: {
      type: String,
      enum: ["Architect", "Interior Designer", "Landscape Designer", "Contractor / Builder", null],
      trim: true
    },
    selectedBrands: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand'
    }],
    retailerProfile: {
      companyName: { type: String, trim: true },
      contactPerson: { type: String, trim: true },
      businessAddress: { type: String, trim: true },
      cityRegion: { type: String, trim: true },
      email: { type: String, trim: true },
    },
    profile: {
      type: String,
      trim: true
    },
    isActive: {
      type: Number,
      default: 1
    },
    isEmailVerified: {
      type: Number,
      default: 0
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    otp_hash: {
      type: String
    },
    otp_attempts: {
      type: Number,
      default: 0
    },
    otp_blocked_until: {
      type: Date
    },
    verificationExpires: {
      type: Date,
      index: { expires: '24h' } // Automatically delete unverified users after 24 hours
    },
    lastLoginAt: {
      type: Date
    },
    invitedProjects: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project'
    }]
  },
  {
    timestamps: true
  }
);

userSchema.pre('save', function (next) {
  this.createdAt = moment().format('YYYY-MM-DD');
  this.updatedAt = moment().format('YYYY-MM-DD');
  next();
});

const Usertable = mongoose.model("Usertable", userSchema);
export default Usertable;
