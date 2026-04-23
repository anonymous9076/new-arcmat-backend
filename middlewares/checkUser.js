import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const checkuser = (req, res, next) => {
  const authorizationHeader = req.headers.authorization;
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    req.user = "not_login";
    next();
  } else {
    const token = authorizationHeader.slice(7).replace(/"/g, '');
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        req.user = "not_login";
      } else {
        req.user = decoded;
      }
      next();
    });
  }
};

export default checkuser;
