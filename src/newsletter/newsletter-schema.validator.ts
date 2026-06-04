import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { ErrorCodes } from '../lib/errors';

export const validateNewsletterSignup = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address.')
    .normalizeEmail(),
  
  // Middleware to handle validation results
  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ 
        success: false, 
        errorCode: ErrorCodes.VALIDATION_ERROR, 
        error: errors.array()[0]?.msg || 'Invalid input'
      });
      return;
    }
    next();
  }
];
