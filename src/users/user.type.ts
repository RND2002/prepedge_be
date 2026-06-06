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
  track?: 'COLLEGE_FRESHER' | 'MERN_EXPERIENCED' | 'MERN_FRESHER' | 'MEAN_EXPERIENCED' | 'PYTHON' | 'GOLANG';
  experienceLevel?: 'fresher' | 'junior' | 'mid' | 'senior';
  experienceYears?: number;
  targetRole?: 'frontend' | 'backend' | 'fullstack' | 'sde1' | 'sde2';
  targetCompanies?: ('Razorpay' | 'Zepto' | 'Groww' | 'CRED' | 'PhonePe' | 'Swiggy' | 'Zomato' | 'Meesho' | 'TCS' | 'Infosys' | 'Wipro' | 'Accenture' | 'Startup' | 'Other')[];
  additionalSkills?: ('PostgreSQL' | 'MySQL' | 'AWS' | 'GCP' | 'Docker' | 'Kubernetes' | 'Redis' | 'GraphQL' | 'Kafka')[];
  weeklyGoal?: '1-2' | '3-4' | 'daily';
  currentStep: number;
  isComplete: boolean;
  completedAt?: Date | null;
}
