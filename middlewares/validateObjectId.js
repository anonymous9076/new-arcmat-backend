import mongoose from 'mongoose';
import { fail } from './responseHandler.js';

/**
 * Middleware to validate MongoDB ObjectId
 */
const validateObjectId = (req, res, next) => {
  const idKey = Object.keys(req.params).find(key => key.toLowerCase().includes('id'));
  const id = idKey ? req.params[idKey] : null;

  if (!id) {
    return fail(res, new Error('ID parameter is required'), 400);
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return fail(res, new Error('Invalid ID format'), 400);
  }

  next();
};

export default validateObjectId;
