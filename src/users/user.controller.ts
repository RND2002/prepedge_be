import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import * as userService from './user.service';
import { ErrorCodes, ErrorMessages } from '../lib/errors';

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ message: ErrorMessages[ErrorCodes.UNAUTHORIZED] });
    
    const user = await userService.findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: ErrorMessages[ErrorCodes.USER_NOT_FOUND] });
    }
    const { password_hash, ...userWithoutPassword } = user.toObject();
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ message: ErrorMessages[ErrorCodes.INTERNAL_ERROR] });
  }
};

export const updateMe = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ message: ErrorMessages[ErrorCodes.UNAUTHORIZED] });
    
    const updatedUser = await userService.updateUser(userId, req.body);
    if (!updatedUser) {
      return res.status(404).json({ message: ErrorMessages[ErrorCodes.USER_NOT_FOUND] });
    }
    const { password_hash, ...userWithoutPassword } = updatedUser.toObject();
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ message: ErrorMessages[ErrorCodes.INTERNAL_ERROR] });
  }
};

export const deleteMe = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ message: ErrorMessages[ErrorCodes.UNAUTHORIZED] });
    
    await userService.deleteUser(userId);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: ErrorMessages[ErrorCodes.INTERNAL_ERROR] });
  }
};

// Admin Controllers
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await userService.getAllUsers();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: ErrorMessages[ErrorCodes.INTERNAL_ERROR] });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await userService.findUserById(req.params.id as string);
    if (!user) {
      return res.status(404).json({ message: ErrorMessages[ErrorCodes.USER_NOT_FOUND] });
    }
    const { password_hash, ...userWithoutPassword } = user.toObject();
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ message: ErrorMessages[ErrorCodes.INTERNAL_ERROR] });
  }
};

export const updateUserAdmin = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const updatedUser = await userService.updateUser(req.params.id as string, req.body);
    if (!updatedUser) {
      return res.status(404).json({ message: ErrorMessages[ErrorCodes.USER_NOT_FOUND] });
    }
    const { password_hash, ...userWithoutPassword } = updatedUser.toObject();
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ message: ErrorMessages[ErrorCodes.INTERNAL_ERROR] });
  }
};

export const deleteUserAdmin = async (req: Request, res: Response) => {
  try {
    await userService.deleteUser(req.params.id as string);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: ErrorMessages[ErrorCodes.INTERNAL_ERROR] });
  }
};
