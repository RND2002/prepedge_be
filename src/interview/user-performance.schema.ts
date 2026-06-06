import mongoose, { Schema, Document } from 'mongoose';

export interface IUserPerformance extends Document {
  userId: mongoose.Types.ObjectId;
  skillScores: Record<string, number>;
  overallScore: number;
  history: Array<{
    sessionId: mongoose.Types.ObjectId;
    date: Date;
    overallScore: number;
    topicScores: Record<string, number>;
    improvement: number;
  }>;
  streak: {
    current: number;
    longest: number;
    lastActivityDate?: Date;
    weeklyGoal: number;
    weeklyCompleted: number;
    weeklyResetDate?: Date;
  };
  persistentWeakAreas: Array<{
    topic: string;
    averageScore: number;
    appearedInSessions: number;
    lastImproved?: Date;
  }>;
  badges: Array<{
    type: string;
    earnedAt: Date;
  }>;
  readiness: {
    currentLevel: string;
    pointsToNextLevel: number;
    estimatedWeeksToReady: number;
    lastAssessed?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserPerformanceSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    skillScores: { type: Map, of: Number, default: {} },
    overallScore: { type: Number, default: 0 },
    history: [{
      sessionId: { type: Schema.Types.ObjectId, ref: 'InterviewSession' },
      date: { type: Date, default: Date.now },
      overallScore: { type: Number },
      topicScores: { type: Map, of: Number },
      improvement: { type: Number, default: 0 },
    }],
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastActivityDate: { type: Date },
      weeklyGoal: { type: Number, default: 3 },
      weeklyCompleted: { type: Number, default: 0 },
      weeklyResetDate: { type: Date },
    },
    persistentWeakAreas: [{
      topic: { type: String, required: true },
      averageScore: { type: Number, required: true },
      appearedInSessions: { type: Number, default: 1 },
      lastImproved: { type: Date },
    }],
    badges: [{
      type: { 
        type: String, 
        enum: [
          'first_interview', 'streak_7', 'streak_30', 
          'perfect_score', 'most_improved', 'consistent_performer', 
          'react_master', 'node_expert'
        ],
        required: true
      },
      earnedAt: { type: Date, default: Date.now },
    }],
    readiness: {
      currentLevel: { type: String, default: 'Not Assessed' },
      pointsToNextLevel: { type: Number, default: 0 },
      estimatedWeeksToReady: { type: Number, default: 0 },
      lastAssessed: { type: Date },
    },
  },
  { timestamps: true }
);

export const UserPerformance = mongoose.model<IUserPerformance>('UserPerformance', UserPerformanceSchema);
