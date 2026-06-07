import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import * as authService from './auth.service';
import { ErrorCodes, ErrorMessages } from '../lib/errors';

const setRefreshCookie = (res: Response, refreshToken: string) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/api/auth', //test
  });


};

const clearRefreshCookie = (res: Response) => {
  res.clearCookie('refreshToken', { path: '/api/auth' });
};

export const signup = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    const result = await authService.signup(req.body, ipAddress, userAgent);

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof Error && error.message === ErrorCodes.EMAIL_EXISTS) {
      return res.status(409).json({ message: ErrorMessages[ErrorCodes.EMAIL_EXISTS] });
    }
    res.status(500).json({ message: ErrorMessages[ErrorCodes.INTERNAL_ERROR] });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, otp } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const result = await authService.verifyOTP(email, otp, ipAddress, userAgent);

    setRefreshCookie(res, result.refreshToken);
    return res.status(200).json({ accessToken: result.accessToken, refreshToken: result.refreshToken, user: result.user });
  } catch (error: any) {
    if (error.message === 'USER_SUSPENDED') {
      return res.status(403).json({ message: 'Your account has been suspended by an administrator' });
    }
    if (error.message === ErrorCodes.USER_NOT_FOUND) {
      return res.status(404).json({ message: ErrorMessages[ErrorCodes.USER_NOT_FOUND] });
    }
    if (error.message === ErrorCodes.INVALID_OR_EXPIRED_TOKEN || error.message === ErrorCodes.TOKEN_EXPIRED) {
      return res.status(400).json({ message: 'OTP is invalid or has expired' });
    }
    if (error.message === ErrorCodes.INVALID_CREDENTIALS) {
      return res.status(400).json({ message: 'Incorrect OTP' });
    }
    console.error('Verify OTP error:', error);
    return res.status(500).json({ message: ErrorMessages[ErrorCodes.INTERNAL_ERROR] });
  }
};

export const login = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    const { accessToken, refreshToken, user } = await authService.login(req.body, ipAddress, userAgent);

    setRefreshCookie(res, refreshToken);
    res.json({ accessToken, refreshToken, user });
  } catch (error) {
    if (error instanceof Error && error.message === 'USER_SUSPENDED') {
      return res.status(403).json({ message: 'Your account has been suspended by an administrator' });
    }
    if (error instanceof Error && error.message === ErrorCodes.INVALID_CREDENTIALS) {
      return res.status(401).json({ message: ErrorMessages[ErrorCodes.INVALID_CREDENTIALS] });
    }
    res.status(500).json({ message: ErrorMessages[ErrorCodes.INTERNAL_ERROR] });
  }
};

export const googleAuth = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const { accessToken, refreshToken, user } = await authService.googleAuth(req.body.idToken, ipAddress, userAgent, req.body.referralCode);

    setRefreshCookie(res, refreshToken);
    res.json({ accessToken, refreshToken, user });
  } catch (error) {
    if (error instanceof Error && error.message === 'USER_SUSPENDED') {
      return res.status(403).json({ message: 'Your account has been suspended by an administrator' });
    }
    if (error instanceof Error && error.message === ErrorCodes.INVALID_TOKEN) {
      return res.status(401).json({ message: ErrorMessages[ErrorCodes.INVALID_TOKEN] });
    }
    res.status(500).json({ message: ErrorMessages[ErrorCodes.INTERNAL_ERROR] });
  }
};

export const refresh = async (req: Request, res: Response) => {
  // Allow refreshToken from either cookies or the JSON body
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: 'No refresh token provided' });
  }

  try {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    const { accessToken, newRefreshToken } = await authService.refresh(refreshToken, ipAddress, userAgent);

    setRefreshCookie(res, newRefreshToken);
    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    clearRefreshCookie(res);
    if (error instanceof Error) {
      if (error.message === 'USER_SUSPENDED') {
        return res.status(403).json({ message: 'Your account has been suspended by an administrator' });
      }
      if (error.message === ErrorCodes.INVALID_TOKEN || error.message === ErrorCodes.TOKEN_EXPIRED) {
        return res.status(401).json({ message: ErrorMessages[ErrorCodes.INVALID_TOKEN] });
      }
      if (error.message === ErrorCodes.REUSE_DETECTED) {
        return res.status(401).json({ message: ErrorMessages[ErrorCodes.REUSE_DETECTED] });
      }
    }
    res.status(500).json({ message: ErrorMessages[ErrorCodes.INTERNAL_ERROR] });
  }
};

export const logout = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  try {
    await authService.logout(refreshToken);
    clearRefreshCookie(res);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const logoutAll = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.sub;
    await authService.logoutAll(userId);
    clearRefreshCookie(res);
    res.json({ message: 'Logged out from all devices successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  console.log("Here")
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    console.log("Here")
    await authService.requestPasswordReset(req.body.email);
    // Always return 200 to prevent email enumeration
    res.json({ message: 'If that email exists, a password reset link has been sent.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const verifyResetOTP = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, otp } = req.body;
    const result = await authService.verifyResetOTP(email, otp);
    res.json({ resetToken: result.resetToken, message: 'OTP verified successfully' });
  } catch (error: any) {
    if (error.message === ErrorCodes.USER_NOT_FOUND) {
      return res.status(404).json({ message: ErrorMessages[ErrorCodes.USER_NOT_FOUND] });
    }
    if (error.message === ErrorCodes.INVALID_OR_EXPIRED_TOKEN || error.message === ErrorCodes.TOKEN_EXPIRED) {
      return res.status(400).json({ message: 'OTP is invalid or has expired' });
    }
    if (error.message === ErrorCodes.INVALID_CREDENTIALS) {
      return res.status(400).json({ message: 'Incorrect OTP' });
    }
    res.status(500).json({ message: ErrorMessages[ErrorCodes.INTERNAL_ERROR] });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    await authService.resetPassword(req.body.resetToken, req.body.newPassword);
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    if (error instanceof Error && error.message === ErrorCodes.INVALID_OR_EXPIRED_TOKEN) {
      return res.status(400).json({ message: ErrorMessages[ErrorCodes.INVALID_OR_EXPIRED_TOKEN] });
    }
    res.status(500).json({ message: ErrorMessages[ErrorCodes.INTERNAL_ERROR] });
  }
};
