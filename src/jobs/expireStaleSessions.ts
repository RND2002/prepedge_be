import cron from 'node-cron';
import { subDays } from 'date-fns';
import { InterviewSession } from '../interview/interview-session.schema';

export const startStaleSessionCronJob = () => {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    try {
      const sevenDaysAgo = subDays(new Date(), 7);
      
      const result = await InterviewSession.updateMany(
        {
          status: { $in: ['in_progress', 'questions_generated'] },
          'timing.startedAt': { $lt: sevenDaysAgo }
        },
        {
          $set: {
            status: 'expired',
            expiredAt: new Date(),
            abandonReason: 'expired'
          }
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`[CRON] Expired ${result.modifiedCount} stale interview sessions older than 7 days.`);
      }
    } catch (error) {
      console.error('[CRON] Error expiring stale sessions:', error);
    }
  });

  console.log('[CRON] Stale session expiry job scheduled.');
};
