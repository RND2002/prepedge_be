import rateLimit from 'express-rate-limit';
import { ErrorCodes, ErrorMessages } from './errors';

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 5 requests per `window` (here, per 15 minutes)
  message: {
    success: false,
    errorCode: ErrorCodes.RATE_LIMIT_EXCEEDED,
    error: ErrorMessages[ErrorCodes.RATE_LIMIT_EXCEEDED]
  },
  statusCode: 429,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
