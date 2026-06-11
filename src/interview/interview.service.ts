import mongoose from 'mongoose';
import { InterviewSession } from './interview-session.schema';
import { Answer } from './answer.schema';
import { Question } from './question.schema';
import { UserPerformance } from './user-performance.schema';
import { Onboarding } from '../onboarding/onboarding.schema';
import { User } from '../users/user.schema';
import { evaluateSessionWithAI, generateQuestionsWithAI } from '../lib/ai/evaluator';
import { generateRitualInterviewQuestions } from '../lib/ai/ritual-ai';
import { buildHumanContext } from './interview.helpers';
import { subDays, isAfter, formatDistanceToNow } from 'date-fns';

export interface FrontendInterviewConfig {
  totalQuestions: number;
  answerMode?: 'written' | 'spoken';
  timerEnabled: boolean;
  timerMode?: 'per_question' | 'total_session' | null;
}

export const startInterview = async (userId: string, frontendConfig: FrontendInterviewConfig) => {
  // Check for active session
  const activeSession = await InterviewSession.findOne({
    userId,
    status: { $in: ['questions_generated', 'in_progress', 'submitted', 'evaluating'] }
  });

  if (activeSession) {
    const error: any = new Error('ACTIVE_SESSION_EXISTS');
    error.activeSessionId = activeSession._id;
    throw error;
  }

  // Enforce max 2 interviews per day limit
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todayInterviewsCount = await InterviewSession.countDocuments({
    userId,
    createdAt: { $gte: todayStart, $lte: todayEnd }
  });

  if (todayInterviewsCount >= 2) {
    throw new Error('DAILY_LIMIT_REACHED');
  }

  // Fetch user onboarding profile securely from DB
  const onboarding = await Onboarding.findOne({ user: userId });
  if (!onboarding || !onboarding.track || !onboarding.experienceLevel || !onboarding.targetRole) {
    throw new Error('Incomplete onboarding profile. Please complete onboarding first.');
  }

  const user = await User.findById(userId);
  const userName = onboarding.displayName || user?.name || undefined;

  // Fetch weak areas
  const performance = await UserPerformance.findOne({ userId });
  const weakAreas = performance ? performance.persistentWeakAreas.map((wa: any) => wa.topic) : [];

  // Check if user has an active ritual to pull company context
  const Ritual = mongoose.model('Ritual');
  const activeRitual = await Ritual.findOne({ user: userId, status: { $in: ['active', 'game_day'] } });

  // Merge AI Config
  const aiConfig = {
    totalQuestions: frontendConfig.totalQuestions,
    stack: onboarding.track,
    experienceLevel: onboarding.experienceLevel,
    targetRole: onboarding.targetRole,
    companyTarget: activeRitual ? activeRitual.company : (onboarding.targetCompanies?.join(', ') || 'Product companies'),
    additionalSkills: onboarding.additionalSkills || [],
    userName,
  };

  const session = await InterviewSession.create({
    userId,
    sessionNumber: performance ? performance.history.length + 1 : 1,
    config: {
      ...frontendConfig,
      stack: aiConfig.stack,
      experienceLevel: aiConfig.experienceLevel,
      targetRole: aiConfig.targetRole,
      companyTarget: aiConfig.companyTarget,
      additionalSkills: aiConfig.additionalSkills,
      userName: aiConfig.userName,
    },
    status: 'questions_generated', // Using this to mean "generating"
    questions: [],
    timing: {
      startedAt: new Date()
    }
  });

  // Run in background
  generateQuestionsBackground(session._id, aiConfig, weakAreas).catch(console.error);

  return session;
};

const generateQuestionsBackground = async (sessionId: mongoose.Types.ObjectId, aiConfig: any, weakAreas: any) => {
  try {
    const generatedQ = await generateQuestionsWithAI(aiConfig, weakAreas);

    const questionDocs = await Promise.all(generatedQ.map(q => {
      return Question.create({
        text: q.text,
        stack: aiConfig.stack,
        topic: q.topic,
        subTopic: q.subTopic,
        difficulty: q.difficulty,
        level: aiConfig.experienceLevel,
        timer: {
          writtenSeconds: q.timerAllotted,
          spokenSeconds: q.timerAllotted,
          minimumSeconds: Math.floor(q.timerAllotted * 0.3)
        },
        evaluationGuide: {
          mustCover: q.mustCover,
          shouldCover: [],
          bonusIfMentions: [],
          redFlags: [],
          idealAnswerFull: q.idealAnswerFull
        },
        interviewerPerspective: q.interviewerPerspective,
        createdBy: 'system'
      });
    }));

    const sessionQuestions = questionDocs.map((doc, idx) => ({
      questionId: doc._id,
      questionText: doc.text,
      topic: doc.topic,
      subTopic: doc.subTopic,
      difficulty: doc.difficulty,
      sequenceNumber: idx + 1,
      timerAllotted: doc.timer.writtenSeconds
    }));

    await InterviewSession.findByIdAndUpdate(sessionId, {
      status: 'in_progress',
      questions: sessionQuestions
    });
  } catch (error) {
    console.error('Failed to generate questions:', error);
    await InterviewSession.findByIdAndUpdate(sessionId, {
      status: 'abandoned',
      abandonReason: 'system'
    });
  }
};

export const startRitualInterview = async (userId: string, ritualId: string, dayNumber: number, frontendConfig: FrontendInterviewConfig) => {
  const activeSession = await InterviewSession.findOne({
    userId,
    status: { $in: ['questions_generated', 'in_progress', 'submitted', 'evaluating'] }
  });

  if (activeSession) {
    const error: any = new Error('ACTIVE_SESSION_EXISTS');
    error.activeSessionId = activeSession._id;
    throw error;
  }

  const Ritual = mongoose.model('Ritual');
  const ritual = await Ritual.findOne({ _id: ritualId, user: userId }).populate('companyProfile');
  if (!ritual) throw new Error('Ritual not found');

  const ritualDay = ritual.days.find((d: any) => d.dayNumber === dayNumber);
  if (!ritualDay) throw new Error('Ritual day not found');

  if (ritualDay.isCompleted) {
    throw new Error('This ritual day is already completed.');
  }

  const onboarding = await Onboarding.findOne({ user: userId });
  if (!onboarding) throw new Error('Incomplete onboarding profile.');

  const user = await User.findById(userId);
  const userName = onboarding.displayName || user?.name || undefined;

  const sessionConfig = {
    ...frontendConfig,
    totalQuestions: ritualDay.questionCount || 3,
    stack: onboarding.track,
    experienceLevel: onboarding.experienceLevel,
    targetRole: onboarding.targetRole,
    companyTarget: `${ritual.company} Day ${dayNumber}`,
    userName,
    timerEnabled: ritualDay.type === 'light_warmup' ? false : true,
    timerMode: 'per_question' as const,
    answerMode: frontendConfig.answerMode || 'written',
  };

  const performance = await UserPerformance.findOne({ userId });
  const weakAreas = performance ? performance.persistentWeakAreas.map((wa: any) => wa.topic) : [];
  const strongAreas = performance ? performance.history.slice(-2).flatMap((h: any) => h.results?.strongAreas || []) : [];

  const session = await InterviewSession.create({
    userId,
    sessionNumber: performance ? performance.history.length + 1 : 1,
    config: sessionConfig,
    ritualRef: ritual._id,
    ritualDayNumber: dayNumber,
    status: 'questions_generated',
    questions: [],
    timing: {
      startedAt: new Date()
    }
  });

  ritualDay.interviewSessionId = session._id as mongoose.Types.ObjectId;
  await ritual.save();

  generateRitualQuestionsBackground(
    session._id as mongoose.Types.ObjectId, 
    sessionConfig, 
    ritual, 
    ritualDay, 
    weakAreas, 
    strongAreas
  ).catch(console.error);

  return session;
};

const generateRitualQuestionsBackground = async (
  sessionId: mongoose.Types.ObjectId, 
  config: any, 
  ritual: any, 
  ritualDay: any, 
  weakAreas: string[], 
  strongAreas: string[]
) => {
  try {
    const generatedQ = await generateRitualInterviewQuestions(
      ritual.company,
      ritual.companyProfile,
      config.targetRole,
      config.stack,
      ritualDay.type,
      config.totalQuestions,
      weakAreas,
      strongAreas
    );

    const questionDocs = await Promise.all(generatedQ.map((q: any) => {
      const allottedSeconds = ritualDay.type === 'light_warmup' ? 0 : (q.timerAllotted || 180);
      
      return Question.create({
        text: q.text,
        stack: config.stack,
        topic: q.topic,
        subTopic: q.subTopic,
        difficulty: q.difficulty,
        level: config.experienceLevel,
        timer: {
          writtenSeconds: allottedSeconds,
          spokenSeconds: allottedSeconds,
          minimumSeconds: Math.floor(allottedSeconds * 0.3)
        },
        evaluationGuide: {
          mustCover: q.mustCover,
          shouldCover: [],
          bonusIfMentions: [],
          redFlags: [],
          idealAnswerFull: q.idealAnswerFull
        },
        interviewerPerspective: q.interviewerPerspective,
        createdBy: 'system'
      });
    }));

    const sessionQuestions = questionDocs.map((doc, idx) => ({
      questionId: doc._id,
      questionText: doc.text,
      topic: doc.topic,
      subTopic: doc.subTopic,
      difficulty: doc.difficulty,
      sequenceNumber: idx + 1,
      timerAllotted: doc.timer.writtenSeconds
    }));

    await InterviewSession.findByIdAndUpdate(sessionId, {
      status: 'in_progress',
      questions: sessionQuestions
    });
  } catch (error) {
    console.error('Failed to generate ritual questions:', error);
    await InterviewSession.findByIdAndUpdate(sessionId, {
      status: 'abandoned',
      abandonReason: 'system'
    });
  }
};


export interface SaveAnswerPayload {
  sessionId: string;
  questionId: string;
  answerText?: string;
  mode: 'written' | 'spoken' | 'skipped';
  timeSpentSeconds: number;
  timerExpired: boolean;
  timeRemainingSeconds: number;
  editCount: number;
  wordCount: number;
  flaggedForReview: boolean;
  skipped: boolean;
}

export const saveAnswer = async (userId: string, data: SaveAnswerPayload) => {
  const session = await InterviewSession.findById(data.sessionId);
  if (!session) throw new Error('Session not found');

  const questionSnapshot = session.questions.find((q: any) => q.questionId.toString() === data.questionId);
  if (!questionSnapshot) throw new Error('Question not found in this session');

  const answerData = {
    sessionId: data.sessionId,
    userId,
    questionId: data.questionId,
    snapshot: {
      questionText: questionSnapshot.questionText,
      topic: questionSnapshot.topic,
      subTopic: questionSnapshot.subTopic,
      difficulty: questionSnapshot.difficulty,
      sequenceNumber: questionSnapshot.sequenceNumber,
      timerAllotted: questionSnapshot.timerAllotted
    },
    answer: {
      text: data.answerText || '',
      mode: data.mode
    },
    behavior: {
      timeSpentSeconds: data.timeSpentSeconds,
      timerExpired: data.timerExpired,
      timeRemainingSeconds: data.timeRemainingSeconds,
      editCount: data.editCount,
      wordCount: data.wordCount,
      flaggedForReview: data.flaggedForReview,
      skipped: data.skipped
    }
  };

  const answer = await Answer.findOneAndUpdate(
    { sessionId: data.sessionId, questionId: data.questionId },
    { $set: answerData },
    { upsert: true, new: true }
  );

  return answer;
};

export const submitInterview = async (userId: string, sessionId: string) => {
  const session = await InterviewSession.findById(sessionId);
  if (!session) throw new Error('Session not found');

  session.status = 'evaluating';
  session.timing!.submittedAt = new Date();
  session.timing!.evaluationStartedAt = new Date();
  await session.save();

  // Run in background
  evaluateInterviewBackground(userId, sessionId).catch(console.error);

  return session;
};

const evaluateInterviewBackground = async (userId: string, sessionId: string) => {
  try {
    const session = await InterviewSession.findById(sessionId);
    if (!session) return;

    const answers = await Answer.find({ sessionId });
    
    // Aggregate behavior
    const behaviorSummary = {
    avgTimeSeconds: answers.reduce((acc, a) => acc + a.behavior.timeSpentSeconds, 0) / answers.length,
    flaggedQuestions: answers.filter(a => a.behavior.flaggedForReview).length,
    skippedQuestions: answers.filter(a => a.behavior.skipped).length,
    totalDuration: (new Date().getTime() - session.timing!.startedAt!.getTime()) / 1000
  };

  // Call Claude
  const evaluationResult = await evaluateSessionWithAI(answers, session.config, behaviorSummary);

  // Update answers with evaluation
  for (const evaluatedAnswer of evaluationResult.answers) {
    const answerDoc = answers.find(a => a.snapshot.sequenceNumber === evaluatedAnswer.sequenceNumber);
    if (answerDoc) {
      answerDoc.evaluation = evaluatedAnswer as any;
      answerDoc.evaluationStatus = 'complete';
      await answerDoc.save();
    }
  }

  // Update session
  session.results = evaluationResult.session as any;
  session.status = 'completed';
  session.timing!.completedAt = new Date();
  await session.save();

  // Update UserPerformance (Creating or Updating)
  await UserPerformance.findOneAndUpdate(
    { userId },
    {
      $set: { overallScore: evaluationResult.session.overallScore },
      $push: {
        history: {
          sessionId: session._id,
          date: new Date(),
          overallScore: evaluationResult.session.overallScore,
          topicScores: evaluationResult.session.topicScores
        }
      }
    },
    { upsert: true, new: true }
  );

  // Auto-complete active ritual day if applicable
  try {
    if (session.ritualRef && session.ritualDayNumber) {
      const Ritual = mongoose.model('Ritual');
      const activeRitual = await Ritual.findById(session.ritualRef);
      
      if (activeRitual) {
        const currentDay = activeRitual.days.find((d: any) => d.dayNumber === session.ritualDayNumber);
        
        if (currentDay && !currentDay.isCompleted) {
          const { RitualService } = require('../ritual/ritual.service');
          
          // Complete the day (triggers email, score update, etc)
          await RitualService.completeDay(activeRitual._id.toString(), session.ritualDayNumber, 'confident');
          
          // Sync new weak areas into Ritual state from this evaluation
          if (evaluationResult.session.weakAreas && evaluationResult.session.weakAreas.length > 0) {
            // Keep unique weak areas
            const updatedWeakAreas = new Set([...activeRitual.weakAreasAtStart, ...evaluationResult.session.weakAreas]);
            activeRitual.weakAreasAtStart = Array.from(updatedWeakAreas);
          }
          
          if (evaluationResult.session.strongAreas && evaluationResult.session.strongAreas.length > 0) {
            const updatedStrongAreas = new Set([...activeRitual.strongAreasAtStart, ...evaluationResult.session.strongAreas]);
            activeRitual.strongAreasAtStart = Array.from(updatedStrongAreas);
          }
          
          await activeRitual.save();
        }
      }
    }
  } catch (err) {
    console.error('Failed to auto-complete ritual day:', err);
  }
  } catch (error) {
    console.error('Failed to evaluate session:', error);
    await InterviewSession.findByIdAndUpdate(sessionId, {
      evaluationStatus: 'failed'
    });
  }
};

export const getSessionResults = async (userId: string, sessionId: string) => {
  const session = await InterviewSession.findOne({ _id: sessionId, userId });
  const answers = await Answer.find({ sessionId }).sort({ 'snapshot.sequenceNumber': 1 });
  return { session, answers };
};

export const getInterviewContext = async (userId: string) => {
  const activeSession = await InterviewSession.findOne({
    userId,
    status: { $in: ['questions_generated', 'in_progress', 'submitted', 'evaluating'] }
  });

  const lastCompletedSession = await InterviewSession.findOne({
    userId,
    status: 'completed'
  }).sort({ 'timing.completedAt': -1 });

  let resumeContext = null;
  let lastCompletedSessionData = null;

  if (activeSession) {
    const answers = await Answer.find({ sessionId: activeSession._id });
    resumeContext = {
      sessionId: activeSession._id,
      ...buildHumanContext(activeSession, answers)
    };
  }

  if (lastCompletedSession) {
    let improvement = "First interview!";
    if (lastCompletedSession.results?.improvementFromLast) {
      const imp = lastCompletedSession.results.improvementFromLast;
      improvement = imp > 0 ? `+${imp.toFixed(1)} from last time` : `${imp.toFixed(1)} from last time`;
    }

    lastCompletedSessionData = {
      sessionId: lastCompletedSession._id,
      score: lastCompletedSession.results?.overallScore || 0,
      improvement,
      completedTimeAgo: lastCompletedSession.timing?.completedAt ? formatDistanceToNow(new Date(lastCompletedSession.timing.completedAt), { addSuffix: true }) : 'recently'
    };
  }

  return {
    moment: activeSession ? 'resume' : 'start_fresh',
    resumeContext,
    lastCompletedSession: lastCompletedSessionData
  };
};

export const resumeInterview = async (userId: string, sessionId: string) => {
  const session = await InterviewSession.findById(sessionId);
  if (!session) throw new Error('SESSION_NOT_FOUND');
  if (session.userId.toString() !== userId) throw new Error('NOT_YOUR_SESSION');

  if (!['questions_generated', 'in_progress'].includes(session.status)) {
    const err: any = new Error('SESSION_NOT_RESUMABLE');
    err.status = session.status;
    err.hint = ['completed', 'abandoned', 'expired'].includes(session.status) ? session.status.toUpperCase() : 'UNKNOWN';
    throw err;
  }

  const savedAnswers = await Answer.find({ sessionId }).sort({ 'snapshot.sequenceNumber': 1 });
  
  const answeredSequences = new Set(savedAnswers.map(a => a.snapshot.sequenceNumber));
  let resumeFromQuestion = 1;
  const totalQuestions = session.config.totalQuestions || session.questions.length;
  for (let i = 1; i <= totalQuestions; i++) {
    if (!answeredSequences.has(i)) {
      resumeFromQuestion = i;
      break;
    }
  }

  session.status = 'in_progress';
  session.lastQuestionReached = resumeFromQuestion;
  if (!session.timing) session.timing = {} as any;
  if (!session.timing!.startedAt) {
    session.timing!.startedAt = new Date();
  }
  await session.save();

  return {
    session,
    savedAnswers,
    resumeFromQuestion,
    humanMessage: `Welcome back — Question ${resumeFromQuestion} is ready for you`
  };
};

export const abandonInterview = async (userId: string, sessionId: string, reason: string) => {
  const session = await InterviewSession.findById(sessionId);
  if (!session) throw new Error('SESSION_NOT_FOUND');
  if (session.userId.toString() !== userId) throw new Error('NOT_YOUR_SESSION');

  if (!['questions_generated', 'in_progress'].includes(session.status)) {
    throw new Error('SESSION_NOT_ABANDONABLE');
  }

  const savedAnswers = await Answer.find({ sessionId });
  
  session.status = 'abandoned';
  session.abandonedAt = new Date();
  session.abandonReason = (['user_choice', 'system', 'expired'].includes(reason) ? reason : 'user_choice') as any;
  session.lastQuestionReached = savedAnswers.length + 1;
  await session.save();

  return {
    message: "Interview saved to history",
    humanMessage: "Ready to start fresh",
    canStartNew: true,
    abandonedSessionId: session._id
  };
};

export const getHistory = async (userId: string, page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;
  const allSessions = await InterviewSession.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
  const totalSessions = await InterviewSession.countDocuments({ userId });

  let active = null;
  const groups: any[] = [
    { label: "This Week", sessions: [] as any[] },
    { label: "This Month", sessions: [] as any[] },
    { label: "Earlier", sessions: [] as any[] }
  ];

  for (const session of allSessions) {
    const isCompleted = session.status === 'completed';
    const isInProgress = ['in_progress', 'questions_generated'].includes(session.status);
    
    let symbol = 'abandoned';
    let displayStatus = 'Incomplete';
    if (isCompleted) { symbol = 'completed'; displayStatus = 'Completed'; }
    else if (isInProgress) { symbol = 'in_progress'; displayStatus = 'In Progress'; }

    let improvementStr = null;
    if (isCompleted && session.results?.improvementFromLast) {
      const imp = session.results.improvementFromLast;
      improvementStr = imp > 0 ? `+${imp.toFixed(1)} from last` : `${imp.toFixed(1)} from last`;
    }

    const item = {
      sessionId: session._id,
      sessionNumber: session.sessionNumber,
      status: session.status,
      symbol,
      displayStatus,
      score: session.results?.overallScore || null,
      improvement: improvementStr,
      stack: session.config.stack,
      questionsAnswered: Math.max((session.lastQuestionReached || 1) - 1, 0),
      totalQuestions: session.config.totalQuestions || session.questions.length,
      timeAgo: formatDistanceToNow(new Date(session.createdAt), { addSuffix: true }),
      aiSummaryOneLiner: session.results?.aiCoachSummary?.split('.')[0] || null,
      topicScores: session.results?.topicScores || null,
      topicWaitingFor: null,
      canResume: isInProgress
    };

    if (isInProgress && !active) {
      active = item; // only 1 active session allowed
    } else {
      const date = new Date(session.createdAt);
      if (isAfter(date, subDays(new Date(), 7))) {
        groups[0].sessions.push(item);
      } else if (isAfter(date, subDays(new Date(), 30))) {
        groups[1].sessions.push(item);
      } else {
        groups[2].sessions.push(item);
      }
    }
  }

  return {
    active,
    groups: groups.filter(g => g.sessions.length > 0),
    pagination: {
      page,
      totalPages: Math.ceil(totalSessions / limit),
      totalSessions
    }
  };
};
