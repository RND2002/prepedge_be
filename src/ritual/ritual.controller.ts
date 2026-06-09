import { Request, Response } from 'express';
import { RitualWaitlist } from './ritual.schema';

export const ritualController = {
  joinWaitlist: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      // Check if already in waitlist
      const existingEntry = await RitualWaitlist.findOne({ userId });
      if (existingEntry) {
        return res.status(200).json({ success: true, message: 'Already on the waitlist' });
      }

      const entry = await RitualWaitlist.create({ userId });
      
      return res.status(201).json({ success: true, message: 'Added to waitlist successfully', data: entry });
    } catch (error) {
      console.error('Error joining ritual waitlist:', error);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
};
