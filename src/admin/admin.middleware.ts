import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { ErrorCodes, ErrorMessages } from '../lib/errors';

const ADMIN_ACCESS_SECRET = process.env.ADMIN_ACCESS_SECRET || 'admin_fallback_access_secret';

export const adminAuthenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'No admin token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, ADMIN_ACCESS_SECRET);
    req.admin = decoded as Express.Request['admin'];
    next();
  } catch (error) {
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'TOKEN_EXPIRED', message: 'Admin token has expired' });
    }
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid admin token' });
  }
};

export const requireRole = (allowedRoles: ('SUPER_ADMIN' | 'ADMIN')[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const admin = req.admin;
    if (admin && allowedRoles.includes(admin.role)) {
      next();
    } else {
      res.status(403).json({ error: 'FORBIDDEN', message: 'Insufficient administrative privileges' });
    }
  };
};

export const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: {
    success: false,
    errorCode: ErrorCodes.RATE_LIMIT_EXCEEDED,
    error: ErrorMessages[ErrorCodes.RATE_LIMIT_EXCEEDED]
  },
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
});
