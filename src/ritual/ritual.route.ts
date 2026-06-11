import { Router } from 'express';
import { ritualController } from './ritual.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Waitlist Route
router.post('/waitlist', authenticate, ritualController.joinWaitlist);

// Prepedge Ritual Routes
router.post('/', authenticate, ritualController.createRitual);
router.get('/active', authenticate, ritualController.getActiveRitual);
router.post('/:id/day/:dayNumber/complete', authenticate, ritualController.completeDay);
router.post('/:id/debrief', authenticate, ritualController.submitDebrief);

export default router;
