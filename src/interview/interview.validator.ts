import { body } from 'express-validator';

export const startInterviewValidator = [
  body('totalQuestions').isInt({ min: 1, max: 20 }).withMessage('Total questions must be between 1 and 20'),
  body('answerMode').optional().isIn(['written', 'spoken']).withMessage('Invalid answer mode'),
  body('timerEnabled').isBoolean().withMessage('Timer enabled must be boolean'),
  body('timerMode').optional({ nullable: true }).isIn(['per_question', 'total_session']),
  body('focusTopics').optional().isArray(),
];

export const saveAnswerValidator = [
  body('sessionId').isMongoId().withMessage('Invalid session ID'),
  body('questionId').isMongoId().withMessage('Invalid question ID'),
  body('answerText').optional().isString(),
  body('mode').isIn(['written', 'spoken', 'skipped']).withMessage('Invalid mode'),
  body('timeSpentSeconds').isInt({ min: 0 }).withMessage('Must provide time spent'),
  body('timerExpired').isBoolean().withMessage('Must indicate if timer expired'),
  body('timeRemainingSeconds').isInt({ min: 0 }).withMessage('Must provide time remaining'),
  body('editCount').isInt({ min: 0 }).withMessage('Must provide edit count'),
  body('wordCount').isInt({ min: 0 }).withMessage('Must provide word count'),
  body('flaggedForReview').isBoolean().withMessage('Must indicate if flagged'),
  body('skipped').isBoolean().withMessage('Must indicate if skipped'),
];

export const submitInterviewValidator = [
  body('sessionId').isMongoId().withMessage('Invalid session ID'),
];
