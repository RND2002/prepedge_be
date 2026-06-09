import { Router } from 'express';
import { ritualController } from './ritual.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/waitlist', authenticate, ritualController.joinWaitlist);

export default router;
