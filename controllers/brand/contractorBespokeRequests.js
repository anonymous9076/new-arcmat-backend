import Brand from "../../models/brand.js";
import Contractor from "../../models/contractor.js";
import BrandContractorRequest from "../../models/brandContractorRequest.js";
import { success, fail } from "../../middlewares/responseHandler.js";
import { sendContractorRequestEmail, sendContractorDecisionEmail } from "../../utils/emailutils.js";

const isBrandOwner = (brand, user) => {
  const userId = user?.id || user?._id;
  return user?.role === 'admin' || String(brand?.userId?._id || brand?.userId) === String(userId);
};

export const createContractorBespokeRequest = async (req, res) => {
  try {
    const contractor = await Contractor.findOne({ userId: req.user.id || req.user._id }).lean();
    if (!contractor) return fail(res, new Error('Create your contractor profile before requesting brand placement'), 404);

    const brand = await Brand.findById(req.params.id).populate('userId', 'name email').lean();
    if (!brand) return fail(res, new Error('brand not found'), 404);

    const request = await BrandContractorRequest.findOneAndUpdate(
      { brandId: brand._id, contractorId: contractor._id },
      {
        brandId: brand._id,
        contractorId: contractor._id,
        contractorUserId: req.user.id || req.user._id,
        message: req.body.message || '',
        status: 'pending',
        brandNote: '',
        decidedAt: null
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
      .populate('brandId', 'name logo')
      .populate('contractorId', 'businessName slug tagline profileImage location experienceYears isVerified status');

    // Send Email to Brand Owner
    const brandEmail = brand.bespokePage?.contact?.email || brand.userId?.email;
    const brandName = brand.name;
    if (brandEmail) {
        sendContractorRequestEmail({ email: brandEmail, name: brandName }, contractor, req.body.message);
    }

    return success(res, request, 200);
  } catch (err) {
    console.error('createContractorBespokeRequest error details:', err.message, err.stack);
    return fail(res, err, 422);
  }
};

export const listContractorBespokeRequests = async (req, res) => {
  try {
    const { mine } = req.query;
    const query = {};

    if (mine === 'contractor') {
      if (req.user.role !== 'contractor') return fail(res, new Error('Only contractors can view their sent requests'), 403);
      query.contractorUserId = req.user.id || req.user._id;
    } else {
      const brand = await Brand.findById(req.params.id).lean();
      if (!brand) return fail(res, new Error('brand not found'), 404);
      if (!isBrandOwner(brand, req.user)) return fail(res, new Error('You can only view requests for your own brand'), 403);
      query.brandId = brand._id;
    }

    const requests = await BrandContractorRequest.find(query)
      .populate('brandId', 'name logo')
      .populate('contractorId', 'businessName slug tagline profileImage location experienceYears isVerified status')
      .sort({ status: 1, createdAt: -1 })
      .lean();

    return success(res, requests, 200);
  } catch (err) {
    console.error('listContractorBespokeRequests error:', err);
    return fail(res, err, 500);
  }
};

export const decideContractorBespokeRequest = async (req, res) => {
  try {
    const { status, brandNote } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return fail(res, new Error('status must be approved or rejected'), 422);
    }

    const brand = await Brand.findById(req.params.id).populate('userId', 'email name');
    if (!brand) return fail(res, new Error('brand not found'), 404);
    if (!isBrandOwner(brand, req.user)) return fail(res, new Error('You can only manage requests for your own brand'), 403);

    const request = await BrandContractorRequest.findOne({
      _id: req.params.requestId,
      brandId: brand._id
    });

    if (!request) return fail(res, new Error('request not found'), 404);

    request.status = status;
    request.brandNote = brandNote || '';
    request.decidedAt = new Date();
    await request.save();

    if (status === 'approved') {
      const currentIds = (brand.bespokePage?.selectedContractorIds || []).map(String);
      if (!currentIds.includes(String(request.contractorId))) {
        brand.bespokePage = {
          ...(brand.bespokePage?.toObject ? brand.bespokePage.toObject() : brand.bespokePage || {}),
          selectedContractorIds: [...currentIds, request.contractorId]
        };
        await brand.save();
      }
    } else if (status === 'rejected') {
      const currentBespoke = brand.bespokePage?.toObject ? brand.bespokePage.toObject() : brand.bespokePage || {};
      brand.bespokePage = {
        ...currentBespoke,
        selectedContractorIds: (currentBespoke.selectedContractorIds || [])
          .filter((contractorId) => String(contractorId) !== String(request.contractorId))
      };
      await brand.save();
    }

    const populatedRequest = await BrandContractorRequest.findById(request._id)
      .populate('brandId', 'name logo')
      .populate({
        path: 'contractorId',
        select: 'businessName slug tagline profileImage location experienceYears isVerified status userId',
        populate: { path: 'userId', select: 'email name' }
      })
      .lean();

    // Send Email to Contractor
    const contractorEmail = populatedRequest.contractorId?.userId?.email;
    const contractorName = populatedRequest.contractorId?.businessName;
    if (contractorEmail) {
        sendContractorDecisionEmail(contractorEmail, contractorName, brand.name, status, brandNote);
    }

    return success(res, populatedRequest, 200);
  } catch (err) {
    console.error('decideContractorBespokeRequest error:', err);
    return fail(res, err, 422);
  }
};
