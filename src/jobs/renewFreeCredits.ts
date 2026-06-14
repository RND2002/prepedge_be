import mongoose from 'mongoose';
import cron from 'node-cron';
import { User } from '../users/user.schema';
import { CreditTransaction } from '../payments/credit-transaction.schema';

export const renewFreeCredits = async () => {
  const now = new Date();

  try {
    // Find users whose renewal date has passed
    const usersToRenew = await User.find({
      'wallet.freeCreditsRenewAt': { $lte: now }
    });

    for (const user of usersToRenew) {
      if (!user.wallet) continue;

      // Only top up if they're below 2
      const topUp = Math.max(0, 2 - user.wallet.credits);
      
      if (topUp > 0) {
        user.wallet.credits += topUp;
        user.wallet.lifetimeCreditsEarned += topUp;

        await CreditTransaction.create({
          userId: user._id,
          type: 'free_renewal',
          amount: topUp,
          reason: 'free_renewal',
          balanceAfter: user.wallet.credits
        });
      }

      // Advance renewal date by 30 days
      const currentRenewal = user.wallet.freeCreditsRenewAt;
      if (currentRenewal) {
        user.wallet.freeCreditsRenewAt = new Date(currentRenewal.getTime() + 30 * 24 * 60 * 60 * 1000);
      } else {
        user.wallet.freeCreditsRenewAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      }

      await user.save();
    }

    if (usersToRenew.length > 0) {
      console.log(`[${now.toISOString()}] Renewed free credits for ${usersToRenew.length} users`);
    }
  } catch (error) {
    console.error('Error renewing free credits:', error);
  }
};

export const startFreeCreditsCronJob = () => {
  // Run daily at 1:00 AM IST
  cron.schedule('0 1 * * *', () => {
    console.log('Running daily free credit renewal job...');
    renewFreeCredits();
  }, {
    timezone: "Asia/Kolkata"
  });
};
