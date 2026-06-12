import mongoose from 'mongoose';
import { differenceInDays, startOfDay, addDays } from 'date-fns';
import { Ritual, IRitual, IRitualDay } from './ritual-core.schema';
import { CompanyProfile, ICompanyProfile } from './company-profile.schema';
import { User } from '../users/user.schema';
import { InterviewSession } from '../interview/interview-session.schema';
import { generateCompanyIntelligence, generateRitualPlan } from '../lib/ai/ritual-ai';
import { sendActivationEmail } from './emails/activation.email';
import { sendDayCompletionEmail } from '../lib/email';

export const RitualService = {
  /**
   * Register and create a new ritual
   */
  async createRitual(userId: string, interviewDateStr: string, company: string, role: string, jobDescription?: string) {
    const user = await User.findById(userId).populate('onboarding');
    if (!user) throw new Error('User not found');

    const interviewDate = startOfDay(new Date(interviewDateStr));
    const today = startOfDay(new Date());
    const totalDays = differenceInDays(interviewDate, today);

    if (totalDays < 1) {
      throw new Error('Interview date must be in the future.');
    }

    // Check if there is already an active ritual
    const existingRitual = await Ritual.findOne({ user: userId, status: { $in: ['active', 'scheduled'] } });
    if (existingRitual) {
      existingRitual.status = 'abandoned';
      existingRitual.abandonedAt = new Date();
      await existingRitual.save();
    }

    const previousRitualCount = await Ritual.countDocuments({ user: userId });

    // 1. Get Onboarding data
    const Onboarding = mongoose.model('Onboarding');
    const onboarding = await Onboarding.findOne({ user: userId });
    
    let track = onboarding?.track || 'General SWE';

    const experienceLevel = onboarding?.experienceLevel || 'Entry Level';

    // 2. Fetch past sessions for weak areas (mocking extraction logic)
    const recentSessions = await InterviewSession.find({ user: userId, evaluationStatus: 'complete' })
      .sort({ createdAt: -1 })
      .limit(5);

    let weakAreas: string[] = [];
    let strongAreas: string[] = [];
    let baselineScore = 0;

    if (recentSessions.length > 0) {
      const allWeakAreas = recentSessions.flatMap(s => s.results?.weakAreas || []);
      const allStrongAreas = recentSessions.flatMap(s => s.results?.strongAreas || []);
      // Unique areas
      weakAreas = Array.from(new Set(allWeakAreas)).slice(0, 5);
      strongAreas = Array.from(new Set(allStrongAreas)).slice(0, 5);
      
      const last3 = recentSessions.slice(0, 3);
      const scoreSum = last3.reduce((acc, s) => acc + (s.results?.overallScore || 0), 0);
      baselineScore = Math.round(scoreSum / last3.length);
    } else {
      // Empty weak areas triggers the AI to schedule a mock interview
      weakAreas = [];
      strongAreas = [];
      baselineScore = 50; // Default baseline
    }

    // 3. Get or Generate Company Profile
    const companySlug = company.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    let companyProfile = await CompanyProfile.findOne({ slug: companySlug });
    
    // Check if it needs AI update
    const thirtyDaysAgo = addDays(new Date(), -30);
    const needsCompanyProfileUpdate = !companyProfile || companyProfile.updatedAt < thirtyDaysAgo;



    // 5. Save the Ritual
    const ritual = await Ritual.create({
      user: userId,
      ritualNumber: previousRitualCount + 1,
      interviewDate,
      company,
      companyProfile: companyProfile?._id,
      role,
      jobDescription,
      track,
      experienceLevel,
      onboardingRef: onboarding?._id || new mongoose.Types.ObjectId(), // Provide a dummy if not exists just to avoid err
      weakAreasAtStart: weakAreas,
      strongAreasAtStart: strongAreas,
      baselineScore,
      totalDays,
      days: [],
      status: 'generating', // Using generating status to allow frontend to poll
      activatedAt: new Date(),
    });

    const firstName = user.name ? user.name.split(' ')[0] : 'Engineer';

    // 7. Fire off AI Generation in the background
    (async () => {
      try {
        let updatedProfile = companyProfile;
        if (needsCompanyProfileUpdate) {
          const aiData = await generateCompanyIntelligence(company, role, track, experienceLevel);
          if (updatedProfile) {
            Object.assign(updatedProfile, aiData);
            await updatedProfile.save();
          } else {
            updatedProfile = await CompanyProfile.create({
              ...aiData,
              name: company,
              slug: companySlug,
              tier: 'product',
            });
            await Ritual.findByIdAndUpdate(ritual._id, { companyProfile: updatedProfile._id });
          }
        }

        const aiPlan = await generateRitualPlan(company, updatedProfile, role, track, experienceLevel, weakAreas, totalDays);
        if (aiPlan && aiPlan.days && aiPlan.days.length === totalDays) {
          const updatedDays = [];
          for (let i = 0; i < totalDays; i++) {
            const aiDayInfo = aiPlan.days[i];
            updatedDays.push({
              dayNumber: i + 1,
              date: addDays(today, i + 1),
              type: aiDayInfo.type,
              focusTopic: aiDayInfo.focusTopic,
              subTopics: aiDayInfo.subTopics,
              questionCount: aiDayInfo.questionCount,
              timeLimitMinutes: aiDayInfo.timeLimitMinutes,
              estimatedMinutes: aiDayInfo.timeLimitMinutes || 15,
            });
          }
          
          const latestRitual = await Ritual.findById(ritual._id);
          if (latestRitual && latestRitual.status === 'generating') {
             latestRitual.days = updatedDays as any;
             latestRitual.status = 'active'; // Mark as ready
             
             // Now that it's ready, send the email
             sendActivationEmail(user.email, {
                firstName,
                totalDays,
                company,
                role,
                prepDays: updatedDays.filter((d: any) => ['mini_interview', 'strength_confirmation', 'light_warmup'].includes(d.type)).length,
                companyFocusDay: updatedDays.findIndex((d: any) => d.type === 'full_mock') + 1,
                warmupDay: updatedDays.findIndex((d: any) => d.type === 'light_warmup') + 1,
                interviewDate: interviewDate.toDateString(),
              }).catch(err => console.error('Failed to send activation email:', err));

             latestRitual.emails.activationSent = true;
             latestRitual.emails.activationSentAt = new Date();
             await latestRitual.save();
          }
        } else {
          throw new Error('AI failed to generate a complete ritual plan');
        }
      } catch (err) {
        console.error('Background AI generation failed for ritual:', ritual._id, err);
        // Fallback if exception occurs
        const latestRitual = await Ritual.findById(ritual._id);
        if (latestRitual && latestRitual.status === 'generating') {
           latestRitual.status = 'failed' as any;
           await latestRitual.save();
        }
      }
    })();

    return ritual;
  },

  /**
   * Complete a ritual day
   */
  async completeDay(ritualId: string, dayNumber: number, mood: 'confident' | 'nervous' | 'okay') {
    const ritual = await Ritual.findById(ritualId);
    if (!ritual) throw new Error('Ritual not found');

    const dayIndex = ritual.days.findIndex(d => d.dayNumber === dayNumber);
    if (dayIndex === -1) throw new Error('Day not found in plan');

    const day = ritual.days[dayIndex];
    if (day.isCompleted) return ritual;

    // Verify interview if the day requires it
    if (day.focusTopic.toLowerCase().includes('mock interview')) {
      const latestInterview = await InterviewSession.findOne({
        userId: ritual.user,
        status: { $in: ['completed', 'evaluating', 'submitted'] },
        createdAt: { $gte: (ritual as any).createdAt }
      }).sort({ createdAt: -1 });

      if (!latestInterview) {
        throw new Error('Please complete your Mock Interview before marking this day as done.');
      }
    }

    day.isCompleted = true;
    day.completedAt = new Date();
    day.userMoodCheckIn = mood;
    
    ritual.daysCompleted += 1;
    ritual.streak += 1;
    if (ritual.streak > ritual.longestStreak) {
      ritual.longestStreak = ritual.streak;
    }

    if (ritual.currentDay === dayNumber && dayNumber < ritual.totalDays) {
      ritual.currentDay = dayNumber + 1;
    }

    // Recalculate Readiness Score based on actual performance and progress
    const daysCompletedRatio = (ritual.daysCompleted / ritual.totalDays) * 100;
    const streakBonus = Math.min(ritual.streak * 5, 10);
    
    // Fetch actual performance
    const { UserPerformance } = require('../interview/user-performance.schema') || {};
    let sessionScoreImprovement = 0;
    if (UserPerformance) {
      const performance = await UserPerformance.findOne({ userId: ritual.user });
      if (performance) {
        sessionScoreImprovement = performance.overallScore || 0;
      }
    }

    // Weighting: 
    // 70% based on their actual mock interview/practice scores
    // 20% based on their progress through the 7-day plan
    // 10% based on their streak
    const newScore = Math.round(
      (sessionScoreImprovement * 0.70) +
      (daysCompletedRatio * 0.20) +
      (streakBonus * 1.0)
    );

    ritual.currentReadinessScore = Math.max(ritual.currentReadinessScore, Math.min(newScore, 100));
    ritual.readinessHistory.push({
      day: dayNumber,
      score: ritual.currentReadinessScore,
      recordedAt: new Date(),
    });

    await ritual.save();

    // Send Completion Email asynchronously
    try {
      const User = mongoose.model('User');
      const user = await User.findById(ritual.user);
      if (user && user.email) {
        sendDayCompletionEmail(user.email, dayNumber, day.focusTopic, ritual.streak).catch(e => console.error('Email error:', e));
      }
    } catch (err) {
      console.error('Error fetching user for completion email:', err);
    }

    return ritual;
  },

  /**
   * Submit interview debrief
   */
  async submitDebrief(ritualId: string, payload: { outcome: 'cleared' | 'rejected' | 'waiting' | 'withdrew', userFeedback?: string, roundsCleared?: number, totalRounds?: number }) {
    const ritual = await Ritual.findById(ritualId).populate('user');
    if (!ritual) throw new Error('Ritual not found');

    ritual.debrief = {
      outcome: payload.outcome,
      userFeedback: payload.userFeedback,
      roundsCleared: payload.roundsCleared,
      totalRounds: payload.totalRounds,
      submittedAt: new Date()
    };
    ritual.status = 'completed';
    ritual.completedAt = new Date();

    await ritual.save();

    // Optionally: Trigger post-debrief recovery / congrats logic here via AI, but for now we just record it.

    return ritual;
  }
};
