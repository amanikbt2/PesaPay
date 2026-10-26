import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response';
import { ERROR_CODES } from '../shared';

export const paymentRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 10, // Max 10 payment initiation requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(
      res,
      ERROR_CODES.RATE_LIMITED,
      'Too many payment attempts. Please wait a moment before trying again.',
      429
    );
  },
});

export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120, // 120 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
});
