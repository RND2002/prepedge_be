import { body } from 'express-validator';
import { ONBOARDING_TRACKS, ONBOARDING_ROLES, ONBOARDING_COMPANIES, ONBOARDING_SKILLS, INTERVIEW_TIMELINES } from './onboarding.constants';

export const validateOnboardingStep = [
  body('displayName').optional().trim().isString(),
  body('track').optional({ checkFalsy: true }).isIn(ONBOARDING_TRACKS),
  body('experienceLevel').optional({ checkFalsy: true }).isIn(['fresher', 'junior', 'mid', 'senior']),
  body('experienceYears').optional({ checkFalsy: true }).isInt({ min: 0, max: 20 }),
  body('targetRole').optional({ checkFalsy: true }).isIn(ONBOARDING_ROLES),
  body('targetCompanies').optional({ checkFalsy: true }).isArray(),
  body('targetCompanies.*').optional({ checkFalsy: true }).isIn(ONBOARDING_COMPANIES),
  body('additionalSkills').optional({ checkFalsy: true }).isArray(),
  body('additionalSkills.*').optional({ checkFalsy: true }).isIn(ONBOARDING_SKILLS),
  body('interviewTimeline').optional({ checkFalsy: true }).isIn(INTERVIEW_TIMELINES),
  body('weeklyGoal').optional({ checkFalsy: true }).isIn(['1-2', '3-4', 'daily']),
  body('currentStep').optional({ checkFalsy: true }).isInt({ min: 1, max: 8 }),
];
