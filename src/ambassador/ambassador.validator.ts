import { body } from 'express-validator';

export const validateAmbassadorApplication = [
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Full name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('phone')
    .trim()
    .matches(/^[0-9]{10}$/).withMessage('Phone must be a valid 10-digit number'),
  body('collegeName')
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage('College name must be between 3 and 100 characters'),
  body('city')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('City must be between 2 and 50 characters'),
  body('state')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('State must be between 2 and 50 characters'),
  body('branch')
    .isIn(['CSE', 'IT', 'ECE', 'EEE', 'Mechanical', 'Other']).withMessage('Invalid branch selected'),
  body('graduationYear')
    .isInt().custom(value => [2025, 2026, 2027].includes(value)).withMessage('Graduation year must be 2025, 2026, or 2027'),
  body('currentYear')
    .isIn(['3rd Year', '4th Year']).withMessage('Current year must be 3rd or 4th Year'),
  body('whyAmbassador')
    .trim()
    .isLength({ min: 50, max: 500 }).withMessage('This field must be between 50 and 500 characters'),
  body('communitiesCanReach')
    .trim()
    .isLength({ min: 30, max: 300 }).withMessage('This field must be between 30 and 300 characters'),
  body('linkedinUrl')
    .optional({ checkFalsy: true })
    .isURL().withMessage('Must be a valid URL')
];

export const validateReferralCode = [
  body('referralCode')
    .trim()
    .isString()
    .isLength({ min: 3, max: 20 }).withMessage('Referral code must be between 3 and 20 characters')
    .toUpperCase()
];

export const validateRejectReason = [
  body('reason')
    .trim()
    .isString()
    .isLength({ min: 10, max: 500 }).withMessage('Please provide a reason between 10 and 500 characters')
];
