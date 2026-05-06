import mongoose from 'mongoose';

const brandContractorRequestSchema = new mongoose.Schema(
  {
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
      index: true
    },
    contractorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contractor',
      required: true,
      index: true
    },
    contractorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usertable',
      required: true,
      index: true
    },
    message: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true
    },
    brandNote: {
      type: String,
      trim: true
    },
    decidedAt: Date
  },
  { timestamps: true }
);

brandContractorRequestSchema.index({ brandId: 1, contractorId: 1 }, { unique: true });

export default mongoose.model('BrandContractorRequest', brandContractorRequestSchema);
