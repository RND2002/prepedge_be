import { body } from 'express-validator';

export const validateOnboardingStep = [
  body('displayName').optional().trim().isString(),
  body('track').optional().isIn(['COLLEGE_FRESHER', 'MERN_EXPERIENCED', 'MERN_FRESHER', 'MEAN_EXPERIENCED', 'PYTHON', 'GOLANG', 'JAVA']),
  body('experienceLevel').optional().isIn(['fresher', 'junior', 'mid', 'senior']),
  body('experienceYears').optional().isInt({ min: 0, max: 20 }),
  body('targetRole').optional().isIn(['frontend', 'backend', 'fullstack', 'sde1', 'sde2']),
  // body('targetCompanies').optional().isArray(),
  // body('targetCompanies.*').optional().isIn(['Razorpay', 'Zepto', 'Groww', 'CRED', 'PhonePe', 'Swiggy', 'Zomato', 'Meesho', 'TCS', 'Infosys', 'Wipro', 'Accenture', 'Startup', 'Other']),
  body('additionalSkills').optional().isArray(),
  body('additionalSkills.*').optional().isIn(['PostgreSQL', 'MySQL', 'AWS', 'GCP', 'Docker', 'Kubernetes', 'Redis', 'GraphQL', 'Kafka']),
  // body('weeklyGoal').optional().isIn(['1-2', '3-4', 'daily']),
  body('currentStep').optional().isInt({ min: 1, max: 7 }),
];
