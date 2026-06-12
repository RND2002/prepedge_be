import mongoose from 'mongoose';

export interface AuthUserPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface OnboardingData {
  displayName?: string;
  track?: string; // relaxed for backward compatibility
  primaryLanguage?: string[];
  otherLanguage?: string;
  frontendFramework?: string[];
  otherFrontendFramework?: string;
  backendFramework?: string[];
  otherBackendFramework?: string;
  database?: string[];
  otherDatabase?: string;
  experienceLevel?: string;
  experienceYears?: number;
  targetRole?: string;
  targetCompanies?: string[];
  additionalSkills?: string[];
  interviewTimeline?: string;
  weeklyGoal?: string;
  currentStep: number;
  isComplete: boolean;
  completedAt?: Date | null;
}
