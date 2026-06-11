import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/stats', authenticate, dashboardController.getStats);
router.get('/top-performer', authenticate, dashboardController.getTopPerformer);

export default router;
