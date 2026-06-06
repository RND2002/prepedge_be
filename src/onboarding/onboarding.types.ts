import { OnboardingData } from '../users/user.type';

export type OnboardingStepPayload = Partial<Omit<OnboardingData, 'isComplete' | 'completedAt'>>;
