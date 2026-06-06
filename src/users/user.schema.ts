import mongoose, { Schema, Document } from 'mongoose';

import { OnboardingData } from './user.type';

export interface IUser extends Document {
  name?: string;
  email: string;
  password_hash?: string;
  avatar?: string;
  google_id?: string;
  is_email_verified: boolean;
  role: string;
  onboarding?: mongoose.Types.ObjectId | OnboardingData;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password_hash: { type: String }, // Optional for SSO users
    avatar: { type: String },
    google_id: { type: String, unique: true, sparse: true },
    is_email_verified: { type: Boolean, default: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    onboarding: { type: Schema.Types.ObjectId, ref: 'Onboarding' }
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);

export interface IRefreshToken extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  isRevoked: boolean;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const RefreshTokenSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    token: { type: String, required: true, unique: true }, // Hashed
    expiresAt: { type: Date, required: true },
    isRevoked: { type: Boolean, default: false },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);

export interface IPasswordResetToken extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
}

const PasswordResetTokenSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    token: { type: String, required: true, unique: true }, // Hashed
    expiresAt: { type: Date, required: true },
    isUsed: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const PasswordResetToken = mongoose.model<IPasswordResetToken>('PasswordResetToken', PasswordResetTokenSchema);

export interface IOTPVerification extends Document {
  userId: mongoose.Types.ObjectId;
  otp: string;
  expiresAt: Date;
  createdAt: Date;
}

const OTPVerificationSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    otp: { type: String, required: true }, // Hashed
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const OTPVerification = mongoose.model<IOTPVerification>('OTPVerification', OTPVerificationSchema);
