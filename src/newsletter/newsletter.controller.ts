import { Request, Response } from 'express';
import { NewsletterService } from './newsletter.service';
import { ErrorCodes, ErrorMessages } from '../lib/errors';

export class NewsletterController {
  static async signup(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';

      await NewsletterService.signup(email, ipAddress as string);

      res.status(201).json({ success: true, message: 'Successfully signed up for newsletter' });
    } catch (error: any) {
      if (error.message === ErrorCodes.DUPLICATE_EMAIL) {
        res.status(409).json({ 
          success: false, 
          errorCode: ErrorCodes.DUPLICATE_EMAIL, 
          error: ErrorMessages[ErrorCodes.DUPLICATE_EMAIL] 
        });
        return;
      }

      console.error('Newsletter signup error:', error);
      res.status(500).json({ 
        success: false, 
        errorCode: ErrorCodes.INTERNAL_ERROR, 
        error: ErrorMessages[ErrorCodes.INTERNAL_ERROR] 
      });
    }
  }
}
