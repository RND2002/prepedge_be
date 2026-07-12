import mongoose, { Schema, Document } from 'mongoose';

// ─── RITUAL PLAN DAY ──────────────────────────────
// Each day of the ritual is its own structured object

export interface IRitualDay {
  dayNumber: number;
  date: Date;
  type: 'full_mock' | 'mini_interview' | 'strength_confirmation' | 'light_warmup' | 'game_day';
  focusTopic: string;
  subTopics: string[];
  questionCount?: number;
  timeLimitMinutes?: number;
  interviewSessionId?: mongoose.Types.ObjectId;
  gameDaySummary?: {
    progressCard: string;
    standoutMoments: string[];
    sendOffMessage: string;
  };
  practiceQuestions: mongoose.Types.ObjectId[];
  estimatedMinutes: number;
  morningEmailSent: boolean;
  eveningEmailSent: boolean;
  notificationSent: boolean;
  isCompleted: boolean;
  isSkipped: boolean;
  completedAt?: Date;
  userMoodCheckIn?: 'confident' | 'nervous' | 'okay' | null;
  // Adaptive replanning
  wasRescheduled: boolean;
  originalDayNumber?: number;
}

// ─── MAIN RITUAL SCHEMA ───────────────────────────

export interface IRitual extends Document {
  user: mongoose.Types.ObjectId;
  // Core info
  ritualNumber: number; // which ritual this is for the user
  interviewDate: Date;
  company: string;
  companyProfile?: mongoose.Types.ObjectId;
  role: string;
  jobDescription?: string;
  track: string;
  experienceLevel: string;
  // Personalisation sources
  onboardingRef: mongoose.Types.ObjectId;
  weakAreasAtStart: string[];   // pulled from past sessions
  strongAreasAtStart: string[]; // pulled from past sessions
  baselineScore?: number;       // their score before ritual started
  // Plan
  totalDays: number;
  days: IRitualDay[];
  // Status
  status: 
    | 'scheduled'     // created, not started yet
    | 'active'        // currently running
    | 'game_day'      // interview is today
    | 'completed'     // interview passed, user debriefed
    | 'abandoned'     // user gave up
    | 'generating'    // AI generating
    | 'expired'       // interview date passed with no debrief
    | 'failed';       // generation failed
  // Progress
  currentDay: number;
  daysCompleted: number;
  daysSkipped: number;
  currentReadinessScore: number;  // updates daily
  readinessHistory: Array<{
    day: number;
    score: number;
    recordedAt: Date;
  }>;
  streak: number;
  longestStreak: number;
  // Email tracking
  emails: {
    activationSent: boolean;
    activationSentAt?: Date;
    dayBeforeSent: boolean;
    dayBeforeSentAt?: Date;
    gameDaySent: boolean;
    gameDaySentAt?: Date;
    postInterviewSent: boolean;
    postInterviewSentAt?: Date;
  };
  // Post interview
  debrief?: {
    outcome: 'cleared' | 'rejected' | 'waiting' | 'withdrew';
    userFeedback?: string;
    roundsCleared?: number;
    totalRounds?: number;
    submittedAt?: Date;
  };
  // Adaptive replanning
  replanCount: number;
  lastReplannedAt?: Date;
  // Timing
  activatedAt?: Date;
  completedAt?: Date;
  abandonedAt?: Date;
  expiredAt?: Date;
}

const RitualDaySchema = new Schema({
  dayNumber: { type: Number, required: true },
  date: { type: Date, required: true },
  type: { 
    type: String, 
    enum: ['full_mock', 'mini_interview', 'strength_confirmation', 'light_warmup', 'game_day'],
    required: true 
  },
  focusTopic: { type: String, required: true },
  subTopics: [{ type: String }],
  questionCount: { type: Number },
  timeLimitMinutes: { type: Number },
  interviewSessionId: { type: Schema.Types.ObjectId, ref: 'InterviewSession' },
  gameDaySummary: {
    progressCard: { type: String },
    standoutMoments: [{ type: String }],
    sendOffMessage: { type: String },
  },
  practiceQuestions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
  estimatedMinutes: { type: Number, default: 30 },
  morningEmailSent: { type: Boolean, default: false },
  eveningEmailSent: { type: Boolean, default: false },
  notificationSent: { type: Boolean, default: false },
  isCompleted: { type: Boolean, default: false },
  isSkipped: { type: Boolean, default: false },
  completedAt: { type: Date },
  userMoodCheckIn: { 
    type: String, 
    enum: ['confident', 'nervous', 'okay', null],
    default: null 
  },
  wasRescheduled: { type: Boolean, default: false },
  originalDayNumber: { type: Number }
});

const RitualSchema = new Schema(
  {
    user: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true 
    },
    ritualNumber: { type: Number, required: true, default: 1 },
    interviewDate: { type: Date, required: true },
    company: { type: String, required: true },
    companyProfile: { 
      type: Schema.Types.ObjectId, 
      ref: 'CompanyProfile' 
    },
    role: { type: String, required: true },
    jobDescription: { type: String },
    track: { type: String, required: true },
    experienceLevel: { type: String, required: true },
    onboardingRef: { 
      type: Schema.Types.ObjectId, 
      ref: 'Onboarding', 
      required: true 
    },
    weakAreasAtStart: [{ type: String }],
    strongAreasAtStart: [{ type: String }],
    baselineScore: { type: Number },
    totalDays: { type: Number, required: true },
    days: [RitualDaySchema],
    status: {
      type: String,
      enum: [
        'scheduled', 
        'active', 
        'game_day', 
        'completed', 
        'abandoned', 
        'generating',
        'expired',
        'failed'
      ],
      default: 'scheduled'
    },
    currentDay: { type: Number, default: 1 },
    daysCompleted: { type: Number, default: 0 },
    daysSkipped: { type: Number, default: 0 },
    currentReadinessScore: { type: Number, default: 0 },
    readinessHistory: [{
      day: { type: Number },
      score: { type: Number },
      recordedAt: { type: Date }
    }],
    streak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    emails: {
      activationSent: { type: Boolean, default: false },
      activationSentAt: { type: Date },
      dayBeforeSent: { type: Boolean, default: false },
      dayBeforeSentAt: { type: Date },
      gameDaySent: { type: Boolean, default: false },
      gameDaySentAt: { type: Date },
      postInterviewSent: { type: Boolean, default: false },
      postInterviewSentAt: { type: Date }
    },
    debrief: {
      outcome: { 
        type: String, 
        enum: ['cleared', 'rejected', 'waiting', 'withdrew'] 
      },
      userFeedback: { type: String },
      roundsCleared: { type: Number },
      totalRounds: { type: Number },
      submittedAt: { type: Date }
    },
    replanCount: { type: Number, default: 0 },
    lastReplannedAt: { type: Date },
    activatedAt: { type: Date },
    completedAt: { type: Date },
    abandonedAt: { type: Date },
    expiredAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes for performance
RitualSchema.index({ user: 1, status: 1 });
RitualSchema.index({ user: 1, interviewDate: 1 });
RitualSchema.index({ interviewDate: 1, status: 1 }); // for cron jobs
RitualSchema.index({ 
  'emails.dayBeforeSent': 1, 
  interviewDate: 1 
}); // email scheduler

export const Ritual = mongoose.model<IRitual>('Ritual', RitualSchema);
