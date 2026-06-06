import { body } from 'express-validator';

export const signupValidator = [
  body('email').isEmail().withMessage('Must be a valid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('name').notEmpty().withMessage('Name is required').trim(),
];

export const loginValidator = [
  body('email').isEmail().withMessage('Must be a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const forgotPasswordValidator = [
  body('email').isEmail().withMessage('Must be a valid email').normalizeEmail(),
];

export const verifyResetOtpValidator = [
  body('email').isEmail().withMessage('Must be a valid email').normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits'),
];

export const resetPasswordValidator = [
  body('resetToken').notEmpty().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

export const googleTokenValidator = [
  body('idToken').notEmpty().withMessage('Google ID Token is required'),
];

export const changePasswordValidator = [
  body('oldPassword').notEmpty().withMessage('Old password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
];

export const verifyOtpValidator = [
  body('email').isEmail().withMessage('Must be a valid email').normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits'),
];
