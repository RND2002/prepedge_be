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
    track: { type: String }, // relaxed for BC
    primaryLanguage: [{ type: String }],
    otherLanguage: { type: String },
    frontendFramework: [{ type: String }],
    otherFrontendFramework: { type: String },
    backendFramework: [{ type: String }],
    otherBackendFramework: { type: String },
    database: [{ type: String }],
    otherDatabase: { type: String },
    experienceLevel: { type: String }, // relaxed
    experienceYears: { type: Number, min: 0, max: 20 },
    targetRole: { type: String }, // relaxed
    targetCompanies: [{ type: String }], // relaxed
    additionalSkills: [{ type: String }], // relaxed
    interviewTimeline: { type: String, default: 'just_exploring' },
    weeklyGoal: { type: String, default: '1-2' },
    currentStep: { type: Number, min: 1, max: 8, default: 1 },
    isComplete: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Onboarding = mongoose.model<IOnboarding>('Onboarding', OnboardingSchema);
