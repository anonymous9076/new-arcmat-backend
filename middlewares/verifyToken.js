import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import Usertable from '../models/user.js';

dotenv.config();

const authenticateToken = (rolesOrReq, res, next) => {
  if (rolesOrReq && rolesOrReq.headers) {
    const req = rolesOrReq;
    return validateToken(req, res, next, []);
  }

  const allowedRoles = Array.isArray(rolesOrReq) ? rolesOrReq : (rolesOrReq ? [rolesOrReq] : []);
  return (req, res, next) => validateToken(req, res, next, allowedRoles);
};

const validateToken = async (req, res, next, allowedRoles) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return res.status(401).json({ status: "failed", errors: "Unauthorized: Missing or invalid token" });
  }

  const token = authorizationHeader.slice(7).replace(/"/g, '');

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ status: "failed", errors: "Unauthorized: Invalid token", token });
    }
    req.user = decoded;

    // RBAC Check
    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ status: "failed", errors: "Access Denied: Insufficient permissions" });
      }
    }

    // Fetch full user for roles that need complex data (brand, retailer)
    if (req.user.role === "brand" || req.user.role === "retailer") {
      const user = await Usertable.findById(req.user.id).populate('selectedBrands');
      if (!user) {
        return res.status(401).json({ status: "failed", errors: "Unauthorized: User not found" });
      }
      req.user = user;
    }

    next();
  });
};

export default authenticateToken;
