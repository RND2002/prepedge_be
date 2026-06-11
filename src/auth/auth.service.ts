import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { User, RefreshToken, PasswordResetToken, OTPVerification, IUser } from '../users/user.schema';
import { UserModeration } from '../admin/admin.model';
import * as emailService from '../lib/email';
import { ErrorCodes } from '../lib/errors';
import { trackReferral } from '../ambassador/ambassador.service';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const ACCESS_SECRET = process.env.ACCESS_SECRET || 'fallback_secret';
const ACCESS_EXPIRES_IN = '15m'; // 2 seconds for testing
const REFRESH_EXPIRES_IN_DAYS = 30;

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

const generateTokens = async (user: any, ipAddress?: string, userAgent?: string) => {
  const payload = { sub: user._id, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });

  const rawRefreshToken = uuidv4();
  const hashedRefreshToken = hashToken(rawRefreshToken);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRES_IN_DAYS);

  await RefreshToken.create({
    userId: user._id,
    token: hashedRefreshToken,
    expiresAt,
    ipAddress,
    userAgent,
  });

  return { accessToken, refreshToken: rawRefreshToken };
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const signup = async (data: any, ipAddress?: string, userAgent?: string) => {
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) {
    if (existingUser.is_email_verified) {
      throw new Error(ErrorCodes.EMAIL_EXISTS);
    }
    // Delete unverified user to allow fresh signup
    await User.deleteOne({ _id: existingUser._id });
  }

  const password_hash = await bcrypt.hash(data.password, 12);

  const userPayload: any = {
    name: data.name,
    email: data.email,
    password_hash,
    is_email_verified: false,
  };



  const user = await User.create(userPayload);

  if (data.referralCode) {
    try {
      await trackReferral(data.referralCode, user._id.toString());
    } catch (err) {
      console.error('Failed to track referral:', err);
    }
  }

  const rawOTP = generateOTP();
  const hashedOTP = await bcrypt.hash(rawOTP, 12);
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15);

  await OTPVerification.create({
    userId: user._id,
    otp: hashedOTP,
    expiresAt,
  });

  await emailService.sendOTPVerificationEmail(user.email, rawOTP);

  return { message: "OTP sent to email", email: user.email };
};

export const verifyOTP = async (email: string, otp: string, ipAddress?: string, userAgent?: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error(ErrorCodes.USER_NOT_FOUND);
  }

  const moderation = await UserModeration.findOne({ userId: user._id, isSuspended: true });
  if (moderation) {
    throw new Error('USER_SUSPENDED');
  }

  const otpRecord = await OTPVerification.findOne({ userId: user._id }).sort({ createdAt: -1 });
  if (!otpRecord) {
    throw new Error(ErrorCodes.INVALID_OR_EXPIRED_TOKEN);
  }

  if (otpRecord.expiresAt < new Date()) {
    await OTPVerification.deleteOne({ _id: otpRecord._id });
    throw new Error(ErrorCodes.TOKEN_EXPIRED);
  }

  const isMatch = await bcrypt.compare(otp, otpRecord.otp);
  if (!isMatch) {
    throw new Error(ErrorCodes.INVALID_CREDENTIALS);
  }

  user.is_email_verified = true;
  await user.save();
  await OTPVerification.deleteMany({ userId: user._id });

  await user.populate('onboarding');
  const tokens = await generateTokens(user, ipAddress, userAgent);
  const { password_hash: _, ...userWithoutPassword } = user.toObject();

  return { ...tokens, user: userWithoutPassword };
};

export const login = async (data: any, ipAddress?: string, userAgent?: string) => {
  const user = await User.findOne({ email: data.email }).populate('onboarding');
  if (!user || !user.password_hash) {
    throw new Error(ErrorCodes.INVALID_CREDENTIALS);
  }

  const moderation = await UserModeration.findOne({ userId: user._id, isSuspended: true });
  if (moderation) {
    throw new Error('USER_SUSPENDED');
  }

  const isMatch = await bcrypt.compare(data.password, user.password_hash);
  if (!isMatch) {
    throw new Error(ErrorCodes.INVALID_CREDENTIALS);
  }

  const tokens = await generateTokens(user, ipAddress, userAgent);
  const { password_hash: _, ...userWithoutPassword } = user.toObject();

  return { ...tokens, user: userWithoutPassword };
};

export const googleAuth = async (idToken: string, ipAddress?: string, userAgent?: string, referralCode?: string) => {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new Error(ErrorCodes.INVALID_TOKEN);
  }

  let user = await User.findOne({ email: payload.email }).populate('onboarding');
  if (!user) {
    user = await User.create({
      name: payload.name,
      email: payload.email,
      google_id: payload.sub,
      avatar: payload.picture,
      is_email_verified: payload.email_verified,
    });

    if (referralCode) {
      try {
        await trackReferral(referralCode, user._id.toString());
      } catch (err) {
        console.error('Failed to track referral:', err);
      }
    }
  } else if (!user.google_id) {
    user.google_id = payload.sub;
    await user.save();
  }

  const moderation = await UserModeration.findOne({ userId: user._id, isSuspended: true });
  if (moderation) {
    throw new Error('USER_SUSPENDED');
  }

  await user.populate('onboarding');
  const tokens = await generateTokens(user, ipAddress, userAgent);
  const { password_hash: _, ...userWithoutPassword } = user.toObject();

  return { ...tokens, user: userWithoutPassword };
};

export const refresh = async (rawRefreshToken: string, ipAddress?: string, userAgent?: string) => {
  const hashedToken = hashToken(rawRefreshToken);
  const storedToken = await RefreshToken.findOne({ token: hashedToken });

  if (!storedToken) {
    throw new Error(ErrorCodes.INVALID_TOKEN);
  }

  if (storedToken.isRevoked) {
    // Reuse detected, revoke all tokens for this user
    await RefreshToken.updateMany({ userId: storedToken.userId }, { isRevoked: true });
    throw new Error(ErrorCodes.REUSE_DETECTED);
  }

  if (storedToken.expiresAt < new Date()) {
    throw new Error(ErrorCodes.TOKEN_EXPIRED);
  }

  const user = await User.findById(storedToken.userId);
  if (!user) {
    throw new Error(ErrorCodes.USER_NOT_FOUND);
  }

  const moderation = await UserModeration.findOne({ userId: user._id, isSuspended: true });
  if (moderation) {
    throw new Error('USER_SUSPENDED');
  }

  // Fix NextAuth App Router token rotation issue:
  // Next.js getServerSession cannot update cookies, so concurrent requests
  // will keep sending the same refresh token. If we rotate it here, the first
  // request revokes it and subsequent requests fail. 
  // Solution: Do not rotate refresh tokens. Just return a new access token.

  const payload = { sub: user._id, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });

  return { accessToken, newRefreshToken: rawRefreshToken };
};

export const logout = async (rawRefreshToken: string) => {
  if (!rawRefreshToken) return;
  const hashedToken = hashToken(rawRefreshToken);
  await RefreshToken.findOneAndUpdate({ token: hashedToken }, { isRevoked: true });
};

export const logoutAll = async (userId: string) => {
  await RefreshToken.updateMany({ userId, isRevoked: false }, { isRevoked: true });
};

export const requestPasswordReset = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    return; // Do not reveal if email exists or not
  }

  const rawOTP = generateOTP();
  const hashedOTP = await bcrypt.hash(rawOTP, 12);
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 min expiry for OTP

  await OTPVerification.create({
    userId: user._id,
    otp: hashedOTP,
    expiresAt,
  });

  await emailService.sendPasswordResetEmail(email, rawOTP);
};

export const verifyResetOTP = async (email: string, otp: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error(ErrorCodes.USER_NOT_FOUND);
  }

  const otpRecord = await OTPVerification.findOne({ userId: user._id }).sort({ createdAt: -1 });
  if (!otpRecord) {
    throw new Error(ErrorCodes.INVALID_OR_EXPIRED_TOKEN);
  }

  if (otpRecord.expiresAt < new Date()) {
    await OTPVerification.deleteOne({ _id: otpRecord._id });
    throw new Error(ErrorCodes.TOKEN_EXPIRED);
  }

  const isMatch = await bcrypt.compare(otp, otpRecord.otp);
  if (!isMatch) {
    throw new Error(ErrorCodes.INVALID_CREDENTIALS); // Incorrect OTP
  }

  // OTP is valid. Consume the OTP.
  await OTPVerification.deleteMany({ userId: user._id });

  // Generate a temporary reset token that the frontend can use to actually set the new password
  const rawToken = uuidv4();
  const hashedToken = hashToken(rawToken);
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes to set the new password

  await PasswordResetToken.create({
    userId: user._id,
    token: hashedToken,
    expiresAt,
  });

  return { resetToken: rawToken };
};

export const resetPassword = async (rawToken: string, newPassword: string) => {
  const hashedToken = hashToken(rawToken);
  const resetToken = await PasswordResetToken.findOne({ token: hashedToken });

  if (!resetToken || resetToken.isUsed || resetToken.expiresAt < new Date()) {
    throw new Error(ErrorCodes.INVALID_OR_EXPIRED_TOKEN);
  }

  const password_hash = await bcrypt.hash(newPassword, 12);
  await User.findByIdAndUpdate(resetToken.userId, { password_hash });

  resetToken.isUsed = true;
  await resetToken.save();

  // Revoke all sessions to force re-login
  await logoutAll(resetToken.userId.toString());
};
