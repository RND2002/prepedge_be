import { Request, Response } from 'express';
import { RitualService } from './ritual.service';
import { Ritual } from './ritual-core.schema';
import { RitualWaitlist } from './ritual.schema'; // Note: keep ritual.schema.ts for waitlist as user requested

export const ritualController = {
  // Waitlist endpoint (retained)
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
  },

  createRitual: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

      const { interviewDate, company, role } = req.body;
      if (!interviewDate || !company || !role) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }

      const ritual = await RitualService.createRitual(userId, interviewDate, company, role);
      return res.status(201).json({ success: true, data: ritual });
    } catch (error: any) {
      console.error('Error creating ritual:', error);
      return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  },

  getActiveRitual: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

      const ritual = await Ritual.findOne({ user: userId, status: { $in: ['active', 'game_day'] } })
        .populate('companyProfile');


      if (!ritual) {
        return res.status(404).json({ success: false, message: 'No active ritual found' });
      }

      const currentDay = ritual.days.find((d: any) => d.dayNumber === ritual.currentDay);
      if (currentDay && currentDay.type === 'game_day' && !currentDay.gameDaySummary?.progressCard) {
        try {
          const { generateGameDaySummary } = require('../lib/ai/ritual-ai');
          const { InterviewSession } = require('../interview/interview-session.schema');
          const pastSessions = await InterviewSession.find({ ritualRef: ritual._id }).sort({ createdAt: 1 });
          
          const summary = await generateGameDaySummary(ritual.company, pastSessions);
          currentDay.gameDaySummary = summary;
          await ritual.save();
        } catch (genError) {
          console.error('Failed to dynamically generate game day summary:', genError);
          currentDay.gameDaySummary = {
            progressCard: `You have completed ${ritual.daysCompleted} days of hard work.`,
            standoutMoments: ['You showed up.', 'You pushed your limits.', 'You practiced consistently.'],
            sendOffMessage: 'Trust your preparation. Go show them what you are capable of.'
          };
          await ritual.save();
        }
      }

      return res.status(200).json({ success: true, data: ritual });
    } catch (error: any) {
      console.error('Error in getActiveRitual:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  completeDay: async (req: Request, res: Response) => {
    try {
      const { id, dayNumber } = req.params;
      const { mood } = req.body;

      const ritual = await RitualService.completeDay(id as string, Number(dayNumber), mood);
      return res.status(200).json({ success: true, data: ritual });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  submitDebrief: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const payload = req.body;

      const ritual = await RitualService.submitDebrief(id as string, payload);
      return res.status(200).json({ success: true, data: ritual });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
};
