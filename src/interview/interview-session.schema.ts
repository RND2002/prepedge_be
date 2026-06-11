import mongoose, { Schema, Document } from 'mongoose';

export interface IInterviewSession extends Document {
  userId: mongoose.Types.ObjectId;
  sessionNumber: number;
  config: {
    stack: string;
    experienceLevel: string;
    targetRole: string;
    totalQuestions: number;
    answerMode: 'written' | 'spoken';
    timerEnabled: boolean;
    timerMode: 'per_question' | 'total_session' | null;
    focusTopics: string[];
    companyTarget?: string;
    userName?: string;
  };
  ritualRef?: mongoose.Types.ObjectId;
  ritualDayNumber?: number;
  status: 'questions_generated' | 'in_progress' | 'submitted' | 'evaluating' | 'completed' | 'abandoned' | 'expired';
  questions: Array<{
    questionId: mongoose.Types.ObjectId;
    questionText: string;
    topic: string;
    subTopic: string;
    difficulty: string;
    sequenceNumber: number;
    timerAllotted: number;
  }>;
  timing: {
    generatedAt?: Date;
    startedAt?: Date;
    submittedAt?: Date;
    evaluationStartedAt?: Date;
    completedAt?: Date;
    totalDurationSeconds?: number;
  };
  results?: {
    overallScore: number;
    percentile: number;
    verdict: string;
    readinessLevel: string;
    topicScores: Record<string, number>;
    weakAreas: string[];
    strongAreas: string[];
    aiCoachSummary: string;
    improvementFromLast: number;
    studyPlan: Array<{
      topic: string;
      currentScore: number;
      targetScore: number;
      weakness: string;
      resources: string[];
      dailyTask: string;
      retestInDays: number;
    }>;
    comparedToSimilarUsers: {
      averageScore: number;
      userRank: string;
      sampleSize: number;
    };
  };
  evaluationStatus: 'pending' | 'processing' | 'complete' | 'failed';
  evaluationAttempts: number;
  evaluationError?: string;
  abandonedAt?: Date | null;
  expiredAt?: Date | null;
  lastQuestionReached: number;
  abandonReason?: 'user_choice' | 'expired' | 'system' | null;
  estimatedMinutesLeft?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sessionNumber: { type: Number, required: true },
    config: {
      stack: { type: String, required: true },
      experienceLevel: { type: String, required: true },
      targetRole: { type: String, required: true },
      totalQuestions: { type: Number, required: true },
      answerMode: { type: String, enum: ['written', 'spoken'], required: true },
      timerEnabled: { type: Boolean, required: true },
      timerMode: { type: String, enum: ['per_question', 'total_session', null] },
      focusTopics: [{ type: String }],
      companyTarget: { type: String },
      userName: { type: String },
    },
    ritualRef: { type: Schema.Types.ObjectId, ref: 'Ritual' },
    ritualDayNumber: { type: Number },
    status: {
      type: String,
      enum: ['questions_generated', 'in_progress', 'submitted', 'evaluating', 'completed', 'abandoned', 'expired'],
      default: 'questions_generated'
    },
    questions: [{
      questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
      questionText: { type: String, required: true },
      topic: { type: String, required: true },
      subTopic: { type: String, required: true },
      difficulty: { type: String, required: true },
      sequenceNumber: { type: Number, required: true },
      timerAllotted: { type: Number, required: true },
    }],
    timing: {
      generatedAt: { type: Date, default: Date.now },
      startedAt: { type: Date },
      submittedAt: { type: Date },
      evaluationStartedAt: { type: Date },
      completedAt: { type: Date },
      totalDurationSeconds: { type: Number },
    },
    results: {
      overallScore: { type: Number },
      percentile: { type: Number },
      verdict: { type: String },
      readinessLevel: { type: String },
      topicScores: { type: Map, of: Number },
      weakAreas: [{ type: String }],
      strongAreas: [{ type: String }],
      aiCoachSummary: { type: String },
      improvementFromLast: { type: Number },
      studyPlan: [{
        topic: { type: String },
        currentScore: { type: Number },
        targetScore: { type: Number },
        weakness: { type: String },
        resources: [{ type: String }],
        dailyTask: { type: String },
        retestInDays: { type: Number },
      }],
      comparedToSimilarUsers: {
        averageScore: { type: Number },
        userRank: { type: String },
        sampleSize: { type: Number },
      }
    },
    evaluationStatus: {
      type: String,
      enum: ['pending', 'processing', 'complete', 'failed'],
      default: 'pending'
    },
    evaluationAttempts: { type: Number, default: 0 },
    evaluationError: { type: String },
    abandonedAt: { type: Date, default: null },
    expiredAt: { type: Date, default: null },
    lastQuestionReached: { type: Number, default: 1 },
    abandonReason: { 
      type: String,
      enum: ['user_choice', 'expired', 'system'],
      default: null
    },
    estimatedMinutesLeft: { type: Number, default: null },
  },
  { timestamps: true }
);

InterviewSessionSchema.index({ userId: 1, createdAt: -1 });
InterviewSessionSchema.index({ userId: 1, status: 1 });
InterviewSessionSchema.index({ 'config.stack': 1, 'results.overallScore': 1 });

export const InterviewSession = mongoose.model<IInterviewSession>('InterviewSession', InterviewSessionSchema);
