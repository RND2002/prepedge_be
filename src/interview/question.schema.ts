import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion extends Document {
  text: string;
  followUpText?: string;
  stack: string;
  topic: string;
  subTopic: string;
  difficulty: 'conceptual' | 'practical' | 'scenario' | 'debug' | 'tradeoff';
  level: string;
  timer: {
    writtenSeconds: number;
    spokenSeconds: number;
    minimumSeconds: number;
  };
  evaluationGuide: {
    mustCover: string[];
    shouldCover: string[];
    bonusIfMentions: string[];
    redFlags: string[];
    idealAnswerFull: string;
  };
  interviewerPerspective: string;
  companyTags: string[];
  stats: {
    timesAsked: number;
    averageScore: number;
    averageTimeSeconds: number;
    skipRate: number;
    flagRate: number;
  };
  isActive: boolean;
  createdBy: 'system' | 'manual';
  reviewedByHuman: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema(
  {
    text: { type: String, required: true },
    followUpText: { type: String },
    stack: { 
      type: String, 
      required: true,
    },
    topic: { type: String, required: true },
    subTopic: { type: String, required: true },
    difficulty: {
      type: String,
      required: true,
      enum: ['conceptual', 'practical', 'scenario', 'debug', 'tradeoff']
    },
    level: {
      type: String,
      required: true,
    },
    timer: {
      writtenSeconds: { type: Number, required: true },
      spokenSeconds: { type: Number, required: true },
      minimumSeconds: { type: Number, required: true },
    },
    evaluationGuide: {
      mustCover: [{ type: String }],
      shouldCover: [{ type: String }],
      bonusIfMentions: [{ type: String }],
      redFlags: [{ type: String }],
      idealAnswerFull: { type: String, required: true },
    },
    interviewerPerspective: { type: String, required: true },
    companyTags: [{ type: String }],
    stats: {
      timesAsked: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      averageTimeSeconds: { type: Number, default: 0 },
      skipRate: { type: Number, default: 0 },
      flagRate: { type: Number, default: 0 },
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String, enum: ['system', 'manual'], default: 'system' },
    reviewedByHuman: { type: Boolean, default: false },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

QuestionSchema.index({ stack: 1, level: 1, topic: 1 });
QuestionSchema.index({ isActive: 1 });
QuestionSchema.index({ companyTags: 1 });

export const Question = mongoose.model<IQuestion>('Question', QuestionSchema);
