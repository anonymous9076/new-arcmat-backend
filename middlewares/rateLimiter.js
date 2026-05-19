import rateLimit from 'express-rate-limit';
import { fail } from './responseHandler.js';

/**
 * Generates a rate limiter middleware for sensitive auth routes.
 * @param {number} minutes - window size in minutes.
 * @param {number} maxAttempts - max requests per window.
 * @param {string} message - custom error message.
 */
export const createRateLimiter = (minutes, maxAttempts, message) => {
    return rateLimit({
        windowMs: minutes * 60 * 1000,
        max: process.env.NODE_ENV === 'production' ? maxAttempts : 50,
        handler: (req, res) => {
            return fail(res, { message }, 429);
        },
        standardHeaders: true,
        legacyHeaders: false,
    });
};

// Common limiters
export const loginLimiter = createRateLimiter(5, 20, "Too many login attempts. Please try again after 15 minutes.");
export const loginOtpLimiter = createRateLimiter(15, 10, "Too many OTP requests. Please try again after 15 minutes.");
export const accountOtpLimiter = createRateLimiter(15, 10, "Too many OTP requests. Please try again after 15 minutes.");
export const forgotPasswordLimiter = createRateLimiter(15, 10, "Too many password reset requests. Please try again after 15 minutes.");
