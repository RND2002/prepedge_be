import cron from 'node-cron';
import { Ritual } from '../ritual/ritual-core.schema';
import { sendDailyMorningEmail } from '../ritual/emails/daily-morning.email';
import { sendEveningNudgeEmail } from '../ritual/emails/evening-nudge.email';
import { sendDayBeforeEmail } from '../ritual/emails/day-before.email';
import { sendGameDayEmail } from '../ritual/emails/game-day.email';
import { sendDebriefRequestEmail } from '../ritual/emails/debrief-request.email';
import { generateDailyPersonalization } from '../lib/ai/ritual-ai';
import { startOfDay, addDays, differenceInDays } from 'date-fns';

const CRON_TIMEZONE = 'Asia/Kolkata';

export const startRitualCronJobs = () => {
  // 1. Activate scheduled rituals (Runs Every Hour)
  cron.schedule('0 * * * *', async () => {
    try {
      const today = startOfDay(new Date());
      const activatedCount = await Ritual.updateMany(
        { status: 'scheduled', activatedAt: { $lte: today } },
        { $set: { status: 'active' } }
      );
      if (activatedCount.modifiedCount > 0) {
        console.log(`[RITUAL CRON] Activated ${activatedCount.modifiedCount} scheduled rituals.`);
      }
    } catch (err) {
      console.error('[RITUAL CRON] Error activating rituals:', err);
    }
  }, { timezone: CRON_TIMEZONE });

  // 2. Morning Email (8:00 AM daily)
  cron.schedule('0 8 * * *', async () => {
    try {
      const activeRituals = await Ritual.find({ status: 'active' }).populate('user');
      const today = startOfDay(new Date());
      
      for (const ritual of activeRituals) {
        const todayPlan = ritual.days.find(d => startOfDay(new Date(d.date)).getTime() === today.getTime());
        if (todayPlan && !todayPlan.morningEmailSent && !todayPlan.isSkipped && !todayPlan.isCompleted) {
          const user: any = ritual.user;
          const firstName = user?.name ? user.name.split(' ')[0] : 'Engineer';
          
          const whyItMattersText = await generateDailyPersonalization(ritual.company, todayPlan.focusTopic, ritual.track);

          await sendDailyMorningEmail(user.email, {
            firstName,
            dayNumber: todayPlan.dayNumber,
            totalDays: ritual.totalDays,
            focusTopic: todayPlan.focusTopic,
            subTopics: todayPlan.subTopics,
            estimatedMinutes: todayPlan.estimatedMinutes,
            company: ritual.company,
            daysLeft: differenceInDays(ritual.interviewDate, today),
            whyItMattersText
          });

          todayPlan.morningEmailSent = true;
          await ritual.save();
        }
      }
    } catch (err) {
      console.error('[RITUAL CRON] Error sending morning emails:', err);
    }
  }, { timezone: CRON_TIMEZONE });

  // 3. Evening Nudge (8:00 PM daily)
  cron.schedule('0 20 * * *', async () => {
    try {
      const activeRituals = await Ritual.find({ status: 'active' }).populate('user');
      const today = startOfDay(new Date());
      
      for (const ritual of activeRituals) {
        const todayPlan = ritual.days.find(d => startOfDay(new Date(d.date)).getTime() === today.getTime());
        if (todayPlan && !todayPlan.isCompleted && !todayPlan.eveningEmailSent && !todayPlan.isSkipped) {
          const user: any = ritual.user;
          const firstName = user?.name ? user.name.split(' ')[0] : 'Engineer';
          
          await sendEveningNudgeEmail(user.email, {
            firstName,
            dayNumber: todayPlan.dayNumber
          });

          todayPlan.eveningEmailSent = true;
          await ritual.save();
        }
      }
    } catch (err) {
      console.error('[RITUAL CRON] Error sending evening nudges:', err);
    }
  }, { timezone: CRON_TIMEZONE });

  // 4. Midnight Replan (11:59 PM daily)
  cron.schedule('59 23 * * *', async () => {
    try {
      const activeRituals = await Ritual.find({ status: 'active' });
      const today = startOfDay(new Date());
      
      for (const ritual of activeRituals) {
        const todayPlan = ritual.days.find(d => startOfDay(new Date(d.date)).getTime() === today.getTime());
        if (todayPlan && !todayPlan.isCompleted && !todayPlan.isSkipped) {
          const daysLeft = differenceInDays(ritual.interviewDate, today);
          
          if (daysLeft > 2) {
            todayPlan.isSkipped = true;
            // Adaptive logic: push the missed topic to a future buffer day or adjust the plan
            // For simplicity in MVP, we just mark skipped and increment replan count
            ritual.replanCount += 1;
            ritual.lastReplannedAt = new Date();
            ritual.streak = 0; // reset streak
            await ritual.save();
          }
        }
      }
    } catch (err) {
      console.error('[RITUAL CRON] Error running midnight replan:', err);
    }
  }, { timezone: CRON_TIMEZONE });

  // 5. Day Before Email (7:00 PM daily)
  cron.schedule('0 19 * * *', async () => {
    try {
      const tomorrow = addDays(startOfDay(new Date()), 1);
      const dayBeforeRituals = await Ritual.find({ 
        status: 'active', 
        interviewDate: { $gte: tomorrow, $lt: addDays(tomorrow, 1) },
        'emails.dayBeforeSent': false 
      }).populate('user');
      
      for (const ritual of dayBeforeRituals) {
        const user: any = ritual.user;
        const firstName = user?.name ? user.name.split(' ')[0] : 'Engineer';
        
        await sendDayBeforeEmail(user.email, {
          firstName,
          company: ritual.company,
          daysCompleted: ritual.daysCompleted
        });

        ritual.emails.dayBeforeSent = true;
        ritual.emails.dayBeforeSentAt = new Date();
        await ritual.save();
      }
    } catch (err) {
      console.error('[RITUAL CRON] Error sending day before emails:', err);
    }
  }, { timezone: CRON_TIMEZONE });

  // 6. Game Day Email (6:30 AM daily)
  cron.schedule('30 6 * * *', async () => {
    try {
      const today = startOfDay(new Date());
      const gameDayRituals = await Ritual.find({ 
        status: { $in: ['active', 'game_day'] },
        interviewDate: { $gte: today, $lt: addDays(today, 1) },
        'emails.gameDaySent': false 
      }).populate('user');
      
      for (const ritual of gameDayRituals) {
        const user: any = ritual.user;
        const firstName = user?.name ? user.name.split(' ')[0] : 'Engineer';
        
        await sendGameDayEmail(user.email, {
          firstName,
          company: ritual.company
        });

        ritual.status = 'game_day';
        ritual.emails.gameDaySent = true;
        ritual.emails.gameDaySentAt = new Date();
        await ritual.save();
      }
    } catch (err) {
      console.error('[RITUAL CRON] Error sending game day emails:', err);
    }
  }, { timezone: CRON_TIMEZONE });

  // 7. Debrief Request Email (9:00 AM daily, 1 day after interview)
  cron.schedule('0 9 * * *', async () => {
    try {
      const yesterday = addDays(startOfDay(new Date()), -1);
      const postInterviewRituals = await Ritual.find({ 
        status: { $in: ['active', 'game_day'] }, // if not explicitly completed
        interviewDate: { $gte: yesterday, $lt: startOfDay(new Date()) },
        'emails.postInterviewSent': false 
      }).populate('user');
      
      for (const ritual of postInterviewRituals) {
        const user: any = ritual.user;
        const firstName = user?.name ? user.name.split(' ')[0] : 'Engineer';
        
        await sendDebriefRequestEmail(user.email, {
          firstName,
          company: ritual.company
        });

        ritual.emails.postInterviewSent = true;
        ritual.emails.postInterviewSentAt = new Date();
        await ritual.save();
      }
    } catch (err) {
      console.error('[RITUAL CRON] Error sending debrief requests:', err);
    }
  }, { timezone: CRON_TIMEZONE });

  console.log('[CRON] Prepedge Ritual cron jobs initialized.');
};
