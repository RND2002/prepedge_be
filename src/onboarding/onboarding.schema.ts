import mongoose, { Schema, Document } from 'mongoose';
import { OnboardingData } from '../users/user.type';

export interface IOnboarding extends Document, OnboardingData {
  user: mongoose.Types.ObjectId;
}

const OnboardingSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    displayName: { type: String, trim: true },
    track: { type: String, enum: ['COLLEGE_FRESHER', 'MERN_EXPERIENCED', 'MERN_FRESHER', 'MEAN_EXPERIENCED', 'PYTHON', 'GOLANG', 'JAVA'] },
    experienceLevel: { type: String, enum: ['fresher', 'junior', 'mid', 'senior'] },
    experienceYears: { type: Number, min: 0, max: 20 },
    targetRole: { type: String, enum: ['frontend', 'backend', 'fullstack', 'sde1', 'sde2'] },
    targetCompanies: [{ type: String, enum: ['Razorpay', 'Zepto', 'Groww', 'CRED', 'PhonePe', 'Swiggy', 'Zomato', 'Meesho', 'TCS', 'Infosys', 'Wipro', 'Accenture', 'Startup', 'Other'] }],
    additionalSkills: [{ type: String, enum: ['PostgreSQL', 'MySQL', 'AWS', 'GCP', 'Docker', 'Kubernetes', 'Redis', 'GraphQL', 'Kafka'] }],
    weeklyGoal: { type: String, enum: ['1-2', '3-4', 'daily'], default: '1-2' },
    currentStep: { type: Number, min: 1, max: 7, default: 1 },
    isComplete: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Onboarding = mongoose.model<IOnboarding>('Onboarding', OnboardingSchema);
