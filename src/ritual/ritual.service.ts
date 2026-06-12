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
    
    // Refresh if older than 30 days
    const thirtyDaysAgo = addDays(new Date(), -30);
    if (!companyProfile || companyProfile.updatedAt < thirtyDaysAgo) {
      try {
        const aiData = await generateCompanyIntelligence(company, role, track, experienceLevel);
        
        if (companyProfile) {
          Object.assign(companyProfile, aiData);
          await companyProfile.save();
        } else {
          companyProfile = await CompanyProfile.create({
            ...aiData,
            slug: companySlug,
          });
        }
      } catch (err) {
        console.error('Failed to generate company intel, proceeding with stub...', err);
        // Fallback stub if AI fails
        if (!companyProfile) {
          companyProfile = await CompanyProfile.create({
            name: company,
            slug: companySlug,
            tier: 'product',
            interviewRounds: [{ roundName: 'Technical', focus: ['DSA', 'System Design'], weight: 100, tips: [] }],
            knownTopics: ['DSA', 'System Design'],
            behavioralFocus: ['Problem Solving'],
            difficultyLevel: 'medium',
            whatTheyReallyWantToHear: ['Structured thinking'],
            commonMistakes: ['Jumping to coding too fast'],
            insiderTips: ['Communicate clearly'],
          });
        }
      }
    }

    // 4. Generate the day plan
    const days: any[] = [];
    
    // Generate AI specific plan for ALL days
    let aiPlan: any = null;
    try {
      aiPlan = await generateRitualPlan(company, companyProfile, role, track, experienceLevel, weakAreas, totalDays);
    } catch (err) {
      console.error('Failed to generate ritual plan via AI, falling back to static...', err);
    }

    if (aiPlan && aiPlan.days && aiPlan.days.length === totalDays) {
      for (let i = 0; i < totalDays; i++) {
        const aiDayInfo = aiPlan.days[i];
        days.push({
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
    } else {
      // Fallback Static Generation (Basic)
      for (let i = 1; i <= totalDays; i++) {
        let type = 'mini_interview';
        let qCount = 3;
        let tLimit = 15;
        let focus = 'Targeted Practice';
        
        if (i === 1) {
          type = 'full_mock';
          qCount = 5;
          tLimit = 30;
          focus = `Full Mock Interview on ${company}`;
        } else if (i === totalDays) {
          type = 'game_day';
          qCount = 0;
          tLimit = 0;
          focus = 'Game Day';
        } else if (i === totalDays - 1 && totalDays >= 4) {
          type = 'light_warmup';
          qCount = 2;
          tLimit = 10;
          focus = 'Light Warmup';
        }

        days.push({
          dayNumber: i,
          date: addDays(today, i),
          type: type,
          focusTopic: focus,
          subTopics: ['Prepare your mindset', 'Review core concepts'],
          questionCount: qCount,
          timeLimitMinutes: tLimit,
          estimatedMinutes: tLimit,
        });
      }
    }

    // 5. Save the Ritual
    const ritual = await Ritual.create({
      user: userId,
      ritualNumber: previousRitualCount + 1,
      interviewDate,
      company,
      companyProfile: companyProfile._id,
      role,
      jobDescription,
      track,
      experienceLevel,
      onboardingRef: onboarding?._id || new mongoose.Types.ObjectId(), // Provide a dummy if not exists just to avoid err
      weakAreasAtStart: weakAreas,
      strongAreasAtStart: strongAreas,
      baselineScore,
      totalDays,
      days,
      status: 'active', // Assuming it's active right away if registered, or 'scheduled'
      activatedAt: new Date(),
    });

    // 6. Send Activation Email
    const firstName = user.name ? user.name.split(' ')[0] : 'Engineer';
    
    // We trigger it asynchronously to not block the request
    sendActivationEmail(user.email, {
      firstName,
      totalDays,
      company,
      role,
      prepDays: days.filter((d: any) => ['mini_interview', 'strength_confirmation', 'light_warmup'].includes(d.type)).length,
      companyFocusDay: days.findIndex((d: any) => d.type === 'full_mock') + 1,
      warmupDay: days.findIndex((d: any) => d.type === 'light_warmup') + 1,
      interviewDate: interviewDate.toDateString(),
    }).catch(err => console.error('Failed to send activation email:', err));

    // Update email tracking
    ritual.emails.activationSent = true;
    ritual.emails.activationSentAt = new Date();
    await ritual.save();

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
