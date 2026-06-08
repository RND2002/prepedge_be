import mongoose, { Schema, Document } from 'mongoose';
import { OnboardingData } from '../users/user.type';

import { ONBOARDING_TRACKS, ONBOARDING_ROLES, ONBOARDING_COMPANIES, ONBOARDING_SKILLS, INTERVIEW_TIMELINES } from './onboarding.constants';

export interface IOnboarding extends Document, OnboardingData {
  user: mongoose.Types.ObjectId;
}

const OnboardingSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    displayName: { type: String, trim: true },
    track: { type: String, enum: ONBOARDING_TRACKS },
    experienceLevel: { type: String, enum: ['fresher', 'junior', 'mid', 'senior'] },
    experienceYears: { type: Number, min: 0, max: 20 },
    targetRole: { type: String, enum: ONBOARDING_ROLES },
    targetCompanies: [{ type: String, enum: ONBOARDING_COMPANIES }],
    additionalSkills: [{ type: String, enum: ONBOARDING_SKILLS }],
    interviewTimeline: { type: String, enum: INTERVIEW_TIMELINES, default: 'just_exploring' },
    weeklyGoal: { type: String, enum: ['1-2', '3-4', 'daily'], default: '1-2' },
    currentStep: { type: Number, min: 1, max: 8, default: 1 },
    isComplete: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Onboarding = mongoose.model<IOnboarding>('Onboarding', OnboardingSchema);
