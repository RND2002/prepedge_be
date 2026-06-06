import { Router } from 'express';
import * as interviewController from './interview.controller';
import * as interviewValidator from './interview.validator';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Protect all interview routes
router.use(authenticate);

router.post('/start', interviewValidator.startInterviewValidator, interviewController.startInterview);
router.post('/answer', interviewValidator.saveAnswerValidator, interviewController.saveAnswer);
router.post('/submit', interviewValidator.submitInterviewValidator, interviewController.submitInterview);
router.get('/status/:sessionId', interviewController.getStatus);
router.get('/results/:sessionId', interviewController.getResults);

router.get('/context', interviewController.getInterviewContext);
router.get('/session/:sessionId/resume', interviewController.resumeInterview);
router.post('/session/:sessionId/abandon', interviewController.abandonInterview);
router.get('/history', interviewController.getHistory);

export default router;
