import { Request, Response } from 'express';
import { User } from '../users/user.schema';
import { CreditPackage } from './credit-package.schema';
import { CreditTransaction } from './credit-transaction.schema';

export const getWalletController = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.sub || req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      wallet: user.wallet || {
        credits: 0,
        freeCreditsRenewAt: null,
        lifetimeCreditsEarned: 0,
        lifetimeCreditsSpent: 0
      }
    });
  } catch (error: any) {
    console.error('Error fetching wallet:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const getPaywallContextController = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.sub || req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Since we don't know the exact InterviewSession model here, we will try to fetch it if it exists.
    // For now, we return null scores, and the frontend will handle it.
    let score = null;
    let previousScore = null;

    try {
      // Trying to require the InterviewSession dynamically to avoid import errors if it's named differently
      const mongoose = require('mongoose');
      const InterviewSession = mongoose.model('InterviewSession');
      const recentSessions = await InterviewSession.find({ userId, status: 'completed' })
        .sort({ createdAt: -1 })
        .limit(2)
        .lean();
        
      if (recentSessions.length > 0) {
        score = recentSessions[0].evaluation?.overallScore || null;
      }
      if (recentSessions.length > 1) {
        previousScore = recentSessions[1].evaluation?.overallScore || null;
      }
    } catch (e) {
      // Model might not be loaded yet or named differently
      console.warn('Could not fetch InterviewSession for paywall context:', e);
    }

    res.json({
      success: true,
      lastSession: {
        score,
        previousScore
      },
      freeCreditsRenewAt: user.wallet?.freeCreditsRenewAt || null,
      currentCredits: user.wallet?.credits || 0
    });
  } catch (error: any) {
    console.error('Error fetching paywall context:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const getCreditPackagesController = async (req: Request, res: Response) => {
  try {
    const packages = await CreditPackage.find({ isActive: true }).sort({ credits: 1 }).lean();
    res.json({ success: true, packages });
  } catch (error: any) {
    console.error('Error fetching credit packages:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const getTransactionsController = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.sub || req.user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const skip = (page - 1) * limit;

    const transactions = await CreditTransaction.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
      
    const total = await CreditTransaction.countDocuments({ userId });

    res.json({
      success: true,
      transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
