import { User } from '../users/user.schema';
import { Onboarding } from './onboarding.schema';
import { OnboardingStepPayload } from './onboarding.types';
import { ErrorCodes } from '../lib/errors';
import mongoose from 'mongoose';
import { creditReferral } from '../ambassador/ambassador.service';

export class OnboardingService {
  async updateStep(userId: string, payload: OnboardingStepPayload) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error(ErrorCodes.USER_NOT_FOUND);
    }

    let onboarding = await Onboarding.findOne({ user: userId });

    if (!onboarding) {
      onboarding = new Onboarding({
        user: userId,
        currentStep: 1,
        isComplete: false,
        completedAt: null,
      });
      user.onboarding = onboarding._id as mongoose.Types.ObjectId;
      await user.save();
    }

    // Safely update onboarding object
    onboarding.set(payload);

    if (payload.currentStep === 8) {
      onboarding.isComplete = true;
      onboarding.completedAt = new Date();
      
      try {
        await creditReferral(userId);
      } catch (err) {
        console.error('Failed to credit referral:', err);
      }
      
      // TODO: send welcome email here
    }

    await onboarding.save();

    if (payload.currentStep === 8) {
      return { onboarding, nextStep: '/dashboard' };
    }

    return { onboarding };
  }

  async getStatus(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error(ErrorCodes.USER_NOT_FOUND);
    }

    const onboarding = await Onboarding.findOne({ user: userId }).lean();
    return {
      ...(onboarding || { currentStep: 1, isComplete: false }),
      name: user.name,
      email: user.email,
      avatar: user.avatar
    };
  }
}

export const onboardingService = new OnboardingService();
