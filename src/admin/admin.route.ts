import { Router } from 'express';
import { body } from 'express-validator';
import * as adminController from './admin.controller';
import { adminAuthenticate, requireRole, adminRateLimiter } from './admin.middleware';

const router = Router();

// Public Routes (Rate limited)
router.post(
  '/auth/login',
  adminRateLimiter,
  [
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  adminController.login
);

router.post('/auth/refresh', adminController.refresh);
router.post('/auth/logout', adminController.logout);

// Protected Routes (Require admin authentication)
router.use(adminAuthenticate);

router.get('/auth/me', adminController.getMe);

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Users Management
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.patch(
  '/users/:id/status',
  requireRole(['SUPER_ADMIN']),
  [
    body('isSuspended').isBoolean().withMessage('Suspension status must be a boolean'),
    body('reason').optional().isString().trim()
  ],
  adminController.toggleUserSuspension
);

// Interviews View
router.get('/interviews', adminController.getInterviews);
router.get('/interviews/:id', adminController.getInterviewById);

// Admins Management (SUPER_ADMIN only)
router.get('/admins', requireRole(['SUPER_ADMIN']), adminController.getAdmins);
router.post(
  '/admins',
  requireRole(['SUPER_ADMIN']),
  [
    body('name').notEmpty().trim().withMessage('Name is required'),
    body('email').isEmail().trim().withMessage('Please enter a valid email address'),
    body('password').isString().notEmpty().withMessage('Password is required'),
    body('role').isIn(['SUPER_ADMIN', 'ADMIN']).withMessage('Invalid admin role'),
    body('isActive').optional().isBoolean()
  ],
  adminController.createAdmin
);
router.patch(
  '/admins/:id',
  requireRole(['SUPER_ADMIN']),
  [
    body('name').optional().notEmpty().trim().withMessage('Name cannot be empty'),
    body('role').optional().isIn(['SUPER_ADMIN', 'ADMIN']).withMessage('Invalid admin role'),
    body('isActive').optional().isBoolean()
  ],
  adminController.updateAdmin
);
router.patch(
  '/admins/:id/status',
  requireRole(['SUPER_ADMIN']),
  [
    body('isActive').isBoolean().withMessage('Status must be a boolean')
  ],
  adminController.toggleAdminStatus
);
router.post(
  '/admins/:id/reset-password',
  requireRole(['SUPER_ADMIN']),
  [
    body('password').isString().notEmpty().withMessage('Password is required')
  ],
  adminController.resetAdminPassword
);

export default router;
