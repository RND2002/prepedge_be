import { Router } from 'express';
import * as ambassadorController from './ambassador.controller';
import { 
  validateAmbassadorApplication, 
  validateReferralCode, 
  validateRejectReason 
} from './ambassador.validator';
import { authenticate } from '../middleware/auth.middleware';
import { adminAuthenticate, requireRole } from '../admin/admin.middleware';

const router = Router();

// Public Routes
router.post('/apply', validateAmbassadorApplication, ambassadorController.apply);
router.post('/verify-referral', validateReferralCode, ambassadorController.verifyReferral);
router.post('/track-referral', ambassadorController.trackReferral);

// User Protected Routes
router.get('/stats/:referralCode', authenticate, ambassadorController.getStats);

// Admin Protected Routes
router.post('/approve/:id', adminAuthenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), ambassadorController.approve);
router.post('/reject/:id', adminAuthenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), validateRejectReason, ambassadorController.reject);
router.get('/admin/list', adminAuthenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), ambassadorController.list);

export default router;
