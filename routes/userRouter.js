import express from "express";
import multer from "multer";
import register from "../controllers/auth/register.js";
import verifyOtp from "../controllers/auth/verifyOtp.js";
import resendOtp from "../controllers/auth/resendOtp.js";
import changePassword from "../controllers/auth/changePassword.js";
import forgotPassword from "../controllers/auth/forgotPassword.js";
import resetPassword from "../controllers/auth/resetPassword.js";
import login from "../controllers/auth/login.js";
import verifyLoginOtp from "../controllers/auth/verifyLoginOtp.js";
import resendLoginOtp from "../controllers/auth/resendLoginOtp.js";
import userlist from "../controllers/auth/userList.js";
import usersingle from "../controllers/auth/getUserById.js";
import updateuser from "../controllers/auth/updateUser.js";
import deleteuser from "../controllers/auth/deleteUser.js";
import platformstats from "../controllers/auth/platformStats.js";
import authenticateToken from "../middlewares/verifyToken.js";
import { loginLimiter, loginOtpLimiter, accountOtpLimiter, registerLimiter, forgotPasswordLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();
const upload = multer();

// Public endpoints
router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, upload.none(), login);
router.post('/verify-login-otp', loginOtpLimiter, verifyLoginOtp);
router.post('/resend-login-otp', loginOtpLimiter, resendLoginOtp);
router.post('/resend-otp', accountOtpLimiter, resendOtp);
router.post('/verify-otp', accountOtpLimiter, verifyOtp);
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);

// Protected endpoints (require JWT)
router.patch('/change-password', authenticateToken, changePassword);
router.post('/reset-password', authenticateToken, resetPassword);
router.get('/platform-stats', authenticateToken(['admin']), platformstats);
router.get('/', authenticateToken(['admin']), userlist);
router.get('/userinfo', authenticateToken, usersingle);
router.get('/:id', authenticateToken, usersingle);
router.delete('/:id', authenticateToken, deleteuser);
router.patch('/', authenticateToken, updateuser);
router.patch('/:id', authenticateToken, updateuser);


export default router;
