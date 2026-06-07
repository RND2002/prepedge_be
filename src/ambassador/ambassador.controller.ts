import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import * as ambassadorService from './ambassador.service';

export const apply = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const ambassador = await ambassadorService.applyForAmbassador(req.body);
    
    return res.status(201).json({
      success: true,
      message: "Application received! We'll review and get back to you within 24 hours.",
      data: {
        applicationId: ambassador._id,
        appliedAt: ambassador.appliedAt
      }
    });
  } catch (error: any) {
    if (error.message.includes('Already applied') || error.message.includes('already an ambassador') || error.message.includes('previous application was not approved')) {
      return res.status(409).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const verifyReferral = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { referralCode } = req.body;
    const data = await ambassadorService.verifyReferralCode(referralCode);
    
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: "Invalid referral code" });
  }
};

export const trackReferral = async (req: Request, res: Response) => {
  try {
    const { referralCode, userId } = req.body;
    if (!referralCode || !userId) {
      return res.status(400).json({ success: false, error: "Missing referralCode or userId" });
    }
    
    await ambassadorService.trackReferral(referralCode, userId);
    
    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const approve = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { note } = req.body;
    
    const ambassador = await ambassadorService.approveAmbassador(id, note);
    
    return res.status(200).json({ success: true, data: ambassador });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

export const reject = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const id = req.params.id as string;
    const { reason } = req.body;
    
    const ambassador = await ambassadorService.rejectAmbassador(id, reason);
    
    return res.status(200).json({ success: true, data: ambassador });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const referralCode = req.params.referralCode as string;
    const userId = (req as any).user?.id || (req as any).user?.sub; // Handle different auth setups
    
    if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });

    const data = await ambassadorService.getAmbassadorStats(referralCode, userId);
    
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

export const list = async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string || 'all';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const data = await ambassadorService.listAmbassadors(status, page, limit);
    
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('List Ambassadors Error:', error);
    return res.status(500).json({ success: false, error: error.message || error.toString() });
  }
};
