import { Request, Response } from 'express';
import { dashboardService } from './dashboard.service';

export const dashboardController = {
  getStats: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req.user as any)?.sub; // from auth middleware
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const stats = await dashboardService.getStats(userId);
      res.status(200).json(stats);
    } catch (error: any) {
      console.error('Dashboard Stats Error:', error);
      res.status(500).json({ message: error.message || 'Failed to fetch dashboard stats' });
    }
  }
};
