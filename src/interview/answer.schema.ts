import mongoose, { Schema, Document } from 'mongoose';

export interface IAnswer extends Document {
  sessionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  questionId: mongoose.Types.ObjectId;
  snapshot: {
    questionText: string;
    topic: string;
    subTopic: string;
    difficulty: string;
    sequenceNumber: number;
    timerAllotted: number;
  };
  answer: {
    text: string;
    audioUrl?: string;
    transcription?: string;
    mode: 'written' | 'spoken' | 'skipped';
  };
  behavior: {
    timeSpentSeconds: number;
    timerExpired: boolean;
    timeRemainingSeconds: number;
    editCount: number;
    wordCount: number;
    flaggedForReview: boolean;
    skipped: boolean;
    answeredAt: Date;
  };
  evaluation?: {
    score: number;
    dimensions: {
      correctness: number;
      completeness: number;
      clarity: number;
      depth: number;
      practicality: number;
    };
    strengths: string[];
    gaps: string[];
    personalizedFeedback: string;
    idealAnswerSummary: string;
    idealAnswerFull: string;
    interviewerTakeaway: string;
    nextStepForThisQuestion: string;
    depthRating: 'surface' | 'adequate' | 'deep' | 'expert';
  };
  evaluationStatus: 'pending' | 'complete' | 'skipped';
  createdAt: Date;
  updatedAt: Date;
}

const AnswerSchema = new Schema(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'InterviewSession', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    snapshot: {
      questionText: { type: String, required: true },
      topic: { type: String, required: true },
      subTopic: { type: String, required: true },
      difficulty: { type: String, required: true },
      sequenceNumber: { type: Number, required: true },
      timerAllotted: { type: Number, required: true },
    },
    answer: {
      text: { type: String, default: '' },
      audioUrl: { type: String },
      transcription: { type: String },
      mode: { type: String, enum: ['written', 'spoken', 'skipped'], required: true },
    },
    behavior: {
      timeSpentSeconds: { type: Number, required: true },
      timerExpired: { type: Boolean, required: true },
      timeRemainingSeconds: { type: Number, required: true },
      editCount: { type: Number, default: 0 },
      wordCount: { type: Number, default: 0 },
      flaggedForReview: { type: Boolean, default: false },
      skipped: { type: Boolean, default: false },
      answeredAt: { type: Date, default: Date.now },
    },
    evaluation: {
      score: { type: Number },
      dimensions: {
        correctness: { type: Number },
        completeness: { type: Number },
        clarity: { type: Number },
        depth: { type: Number },
        practicality: { type: Number },
      },
      strengths: [{ type: String }],
      gaps: [{ type: String }],
      personalizedFeedback: { type: String },
      idealAnswerSummary: { type: String },
      idealAnswerFull: { type: String },
      interviewerTakeaway: { type: String },
      nextStepForThisQuestion: { type: String },
      depthRating: { type: String, enum: ['surface', 'adequate', 'deep', 'expert'] },
    },
    evaluationStatus: {
      type: String,
      enum: ['pending', 'complete', 'skipped'],
      default: 'pending'
    },
  },
  { timestamps: true }
);

AnswerSchema.index({ userId: 1, createdAt: -1 });
AnswerSchema.index({ questionId: 1 });

export const Answer = mongoose.model<IAnswer>('Answer', AnswerSchema);
