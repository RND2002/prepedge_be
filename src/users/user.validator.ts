import { body } from 'express-validator';

export const updateUserValidator = [
  body('name').optional().isString().withMessage('Name must be a string').trim().notEmpty(),
  body('avatar').optional().isURL().withMessage('Avatar must be a valid URL'),
];

export const adminUpdateUserValidator = [
  body('name').optional().isString().trim().notEmpty(),
  body('role').optional().isIn(['user', 'admin']).withMessage('Role must be user or admin'),
  body('is_email_verified').optional().isBoolean(),
];
