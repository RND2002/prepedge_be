import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { onboardingService } from './onboarding.service';
import { ErrorCodes, ErrorMessages } from '../lib/errors';
import mongoose from 'mongoose';
import { TRACK_CONFIG } from './onboarding.constants';

export class OnboardingController {
  async updateStep(req: Request, res: Response) {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: ErrorMessages[ErrorCodes.UNAUTHORIZED] });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: ErrorMessages[ErrorCodes.VALIDATION_ERROR], 
          errors: errors.array() 
        });
      }

      const result = await onboardingService.updateStep(userId, req.body);
      return res.status(200).json(result);

    } catch (error: any) {
      if (error.message === ErrorCodes.USER_NOT_FOUND) {
        return res.status(404).json({ message: ErrorMessages[ErrorCodes.USER_NOT_FOUND] });
      }
      if (error instanceof mongoose.Error.ValidationError) {
        return res.status(400).json({ message: ErrorMessages[ErrorCodes.VALIDATION_ERROR], details: error.message });
      }
      if (error.code === 11000) {
        return res.status(409).json({ message: 'Duplicate value error', details: error.keyValue });
      }
      
      console.error('Onboarding update error:', error);
      return res.status(500).json({ 
        message: ErrorMessages[ErrorCodes.INTERNAL_ERROR],
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack
      });
    }
  }

  async getStatus(req: Request, res: Response) {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: ErrorMessages[ErrorCodes.UNAUTHORIZED] });
      }

      const status = await onboardingService.getStatus(userId);
      return res.status(200).json(status);

    } catch (error: any) {
      if (error.message === ErrorCodes.USER_NOT_FOUND) {
        return res.status(404).json({ message: ErrorMessages[ErrorCodes.USER_NOT_FOUND] });
      }

      console.error('Onboarding status error:', error);
      return res.status(500).json({ message: ErrorMessages[ErrorCodes.INTERNAL_ERROR] });
    }
  }

  getConfig(req: Request, res: Response) {
    return res.status(200).json(TRACK_CONFIG);
  }
}

export const onboardingController = new OnboardingController();
