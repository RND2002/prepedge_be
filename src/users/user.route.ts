import { Router } from 'express';
import * as userController from './user.controller';
import * as userValidator from './user.validator';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Current User Routes
router.get('/me', userController.getMe);
router.patch('/me', userValidator.updateUserValidator, userController.updateMe);
router.delete('/me', userController.deleteMe);

// Admin Routes
router.use(requireAdmin);
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.patch('/:id', userValidator.adminUpdateUserValidator, userController.updateUserAdmin);
router.delete('/:id', userController.deleteUserAdmin);

export default router;
