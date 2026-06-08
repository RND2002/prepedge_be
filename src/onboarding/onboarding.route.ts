import { Router } from 'express';
import { onboardingController } from './onboarding.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateOnboardingStep } from './onboarding.validator';

const router = Router();

router.get('/config', onboardingController.getConfig);

router.use(authenticate);

router.patch('/step', validateOnboardingStep, onboardingController.updateStep);
router.get('/status', onboardingController.getStatus);

export default router;
