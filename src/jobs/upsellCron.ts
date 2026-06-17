import cron from 'node-cron';
import { User } from '../users/user.schema';
import { CreditTransaction } from '../payments/credit-transaction.schema';
import { InterviewSession } from '../interview/interview-session.schema';
import { sendUpsellEmail } from '../lib/email';

export const startUpsellCronJob = () => {
  // Run every day at 10:00 AM IST
  cron.schedule('0 10 * * *', async () => {
    console.log('[CRON] Starting daily upsell email job...');
    try {
      // Find users with 0 credits and haven't received the upsell email
      const eligibleUsers = await User.find({
        'wallet.credits': 0,
        upsellEmailSentAt: null
      });

      let sentCount = 0;

      for (const user of eligibleUsers) {
        // 1. Check if user has no billing records (no credit transactions)
        const transactionCount = await CreditTransaction.countDocuments({ userId: user._id });
        if (transactionCount > 0) {
          continue; // User has billing records, skip
        }

        // 2. Check latest completed interview
        const latestSession = await InterviewSession.findOne({
          userId: user._id,
          status: 'completed'
        }).sort({ 'timing.completedAt': -1, createdAt: -1 });

        if (!latestSession) {
          continue; // No completed interviews, skip
        }

        // Determine the completion date
        const completedDate = latestSession.timing?.completedAt || latestSession.createdAt;

        // 3. Check if completed at least 48 hours ago
        const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

        if (completedDate <= twoDaysAgo) {
          // Send the email
          const firstName = user.name ? user.name.split(' ')[0] : 'Developer';
          await sendUpsellEmail(user.email, firstName);

          // Update flag
          user.upsellEmailSentAt = new Date();
          await user.save();
          sentCount++;
        }
      }

      console.log(`[CRON] Upsell email job finished. Sent ${sentCount} emails.`);
    } catch (error) {
      console.error('[CRON] Error running upsell email job:', error);
    }
  }, { timezone: 'Asia/Kolkata' });

  console.log('[CRON] Upsell email job scheduled for 10:00 AM IST daily.');
};
