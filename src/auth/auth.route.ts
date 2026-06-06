import { Router } from 'express';
import * as authController from './auth.controller';
import * as authValidator from './auth.validator';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public Routes
router.post('/signup', authValidator.signupValidator, authController.signup);
router.post('/verify-otp', authValidator.verifyOtpValidator, authController.verifyOTP);
router.post('/login', authValidator.loginValidator, authController.login);
router.post('/google/token', authValidator.googleTokenValidator, authController.googleAuth);
router.post('/refresh', authController.refresh);
router.post('/forgot-password', authValidator.forgotPasswordValidator, authController.forgotPassword);
router.post('/verify-reset-otp', authValidator.verifyResetOtpValidator, authController.verifyResetOTP);
router.post('/reset-password', authValidator.resetPasswordValidator, authController.resetPassword);
router.post('/logout', authController.logout); // Logout specific device (clears cookie)

// Protected Routes
router.use(authenticate);
router.post('/logout-all', authController.logoutAll); // Revoke all sessions

export default router;
