import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import * as adminService from './admin.service';

const setAdminRefreshCookie = (res: Response, refreshToken: string) => {
  res.cookie('adminRefreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/',
  });
};

const clearAdminRefreshCookie = (res: Response) => {
  res.clearCookie('adminRefreshToken', { path: '/' });
};

export const login = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    const { accessToken, refreshToken, admin } = await adminService.login(req.body, ipAddress, userAgent);

    setAdminRefreshCookie(res, refreshToken);
    res.json({ accessToken, admin });
  } catch (error: any) {
    if (error.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ message: 'Invalid administrative credentials' });
    }
    if (error.message === 'ADMIN_INACTIVE') {
      return res.status(403).json({ message: 'This administrative account is deactivated' });
    }
    console.error('Admin Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.adminRefreshToken || req.body?.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: 'No admin refresh token provided' });
  }

  try {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    const { accessToken } = await adminService.refresh(refreshToken, ipAddress, userAgent);

    res.json({ accessToken });
  } catch (error: any) {
    clearAdminRefreshCookie(res);
    if (['INVALID_TOKEN', 'TOKEN_EXPIRED', 'REUSE_DETECTED', 'ADMIN_NOT_FOUND'].includes(error.message)) {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    console.error('Admin Refresh error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const logout = async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.adminRefreshToken;
  try {
    await adminService.logout(refreshToken);
    clearAdminRefreshCookie(res);
    res.json({ message: 'Admin logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const adminId = req.admin?.sub;
    if (!adminId) return res.status(401).json({ message: 'Unauthorized' });

    // Fetch details
    const { Admin } = require('./admin.model');
    const admin = await Admin.findById(adminId, '-password_hash');
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.json({ admin });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getDashboard = async (req: Request, res: Response) => {
  try {
    const data = await adminService.getDashboardData();
    res.json(data);
  } catch (error) {
    console.error('Get Dashboard stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const data = await adminService.getUsersList(req.query);
    res.json(data);
  } catch (error) {
    console.error('Get Users list error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const data = await adminService.getUserDetails(req.params.id as string);
    res.json(data);
  } catch (error: any) {
    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ message: 'User not found' });
    }
    console.error('Get User details error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const toggleUserSuspension = async (req: Request, res: Response) => {
  const adminId = req.admin?.sub;
  if (!adminId) return res.status(401).json({ message: 'Unauthorized' });

  const { isSuspended, reason } = req.body;
  try {
    const data = await adminService.toggleUserSuspension(req.params.id as string, isSuspended, adminId, reason);
    res.json({ message: isSuspended ? 'User suspended successfully' : 'User activated successfully', moderation: data });
  } catch (error: any) {
    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ message: 'User not found' });
    }
    console.error('Toggle suspension error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getInterviews = async (req: Request, res: Response) => {
  try {
    const data = await adminService.getInterviewsList(req.query);
    res.json(data);
  } catch (error) {
    console.error('Get Interviews list error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getInterviewById = async (req: Request, res: Response) => {
  try {
    const data = await adminService.getInterviewDetails(req.params.id as string);
    res.json(data);
  } catch (error: any) {
    if (error.message === 'INTERVIEW_NOT_FOUND') {
      return res.status(404).json({ message: 'Interview session not found' });
    }
    console.error('Get Interview details error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAdmins = async (req: Request, res: Response) => {
  try {
    const adminId = req.admin?.sub;
    if (!adminId) return res.status(401).json({ message: 'Unauthorized' });

    const admins = await adminService.getAdminsList(adminId);
    res.json({ admins });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createAdmin = async (req: Request, res: Response) => {
  const adminId = req.admin?.sub;
  if (!adminId) return res.status(401).json({ message: 'Unauthorized' });

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const admin = await adminService.createAdmin(adminId, req.body);
    res.status(201).json({ admin });
  } catch (error: any) {
    if (error.message === 'EMAIL_EXISTS') {
      return res.status(409).json({ message: 'Email address is already in use' });
    }
    if (error.message === 'PASSWORD_POLICY_VIOLATED') {
      return res.status(400).json({ message: 'Password does not meet the complexity requirements' });
    }
    console.error('Create Admin error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateAdmin = async (req: Request, res: Response) => {
  const adminId = req.admin?.sub;
  if (!adminId) return res.status(401).json({ message: 'Unauthorized' });

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const admin = await adminService.updateAdmin(adminId, req.params.id as string, req.body);
    res.json({ admin });
  } catch (error: any) {
    if (error.message === 'ADMIN_NOT_FOUND') {
      return res.status(404).json({ message: 'Admin not found' });
    }
    console.error('Update Admin error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const toggleAdminStatus = async (req: Request, res: Response) => {
  const adminId = req.admin?.sub;
  if (!adminId) return res.status(401).json({ message: 'Unauthorized' });

  const { isActive } = req.body;
  try {
    const data = await adminService.toggleAdminStatus(adminId, req.params.id as string, isActive);
    res.json({ message: isActive ? 'Admin activated successfully' : 'Admin deactivated successfully', admin: data });
  } catch (error: any) {
    if (error.message === 'CANNOT_DEACTIVATE_SELF') {
      return res.status(400).json({ message: 'You cannot deactivate your own administrative account' });
    }
    if (error.message === 'ADMIN_NOT_FOUND') {
      return res.status(404).json({ message: 'Admin not found' });
    }
    console.error('Toggle admin status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const resetAdminPassword = async (req: Request, res: Response) => {
  const adminId = req.admin?.sub;
  if (!adminId) return res.status(401).json({ message: 'Unauthorized' });

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const result = await adminService.resetAdminPassword(adminId, req.params.id as string, req.body);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'ADMIN_NOT_FOUND') {
      return res.status(404).json({ message: 'Admin not found' });
    }
    if (error.message === 'PASSWORD_POLICY_VIOLATED') {
      return res.status(400).json({ message: 'Password does not meet the complexity requirements' });
    }
    console.error('Reset admin password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
