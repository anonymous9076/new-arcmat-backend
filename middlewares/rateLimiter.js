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
        max: maxAttempts,
        handler: (req, res) => {
            return fail(res, { message }, 429);
        },
        standardHeaders: true,
        legacyHeaders: false,
    });
};

// Common limiters
export const authLimiter = createRateLimiter(15, 5, "Too many login attempts. Please try again after 15 minutes.");
export const registerLimiter = createRateLimiter(60, 3, "Too many accounts created from this IP. Please try again after an hour.");
export const forgotPasswordLimiter = createRateLimiter(30, 3, "Too many password reset requests. Please try again after 30 minutes.");
