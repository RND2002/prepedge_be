import mongoose, { Schema, Document } from 'mongoose';

// ─── RITUAL EMAIL LOG ─────────────────────────────
// Track every single email sent for debugging + analytics

export interface IRitualEmailLog extends Document {
  ritual: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  emailType: 
    | 'activation'
    | 'daily_morning'
    | 'daily_evening'
    | 'day_before'
    | 'game_day_morning'
    | 'post_interview'
    | 'missed_day'
    | 'replan_notice'
    | 'debrief_request';
  dayNumber?: number;
  subject: string;
  status: 'sent' | 'failed' | 'bounced' | 'opened' | 'clicked';
  sentAt: Date;
  openedAt?: Date;
  clickedAt?: Date;
  error?: string;
}

const RitualEmailLogSchema = new Schema({
  ritual: { 
    type: Schema.Types.ObjectId, 
    ref: 'Ritual', 
    required: true,
    index: true 
  },
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  emailType: {
    type: String,
    enum: [
      'activation',
      'daily_morning',
      'daily_evening',
      'day_before',
      'game_day_morning',
      'post_interview',
      'missed_day',
      'replan_notice',
      'debrief_request'
    ],
    required: true
  },
  dayNumber: { type: Number },
  subject: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['sent', 'failed', 'bounced', 'opened', 'clicked'],
    default: 'sent'
  },
  sentAt: { type: Date, default: Date.now },
  openedAt: { type: Date },
  clickedAt: { type: Date },
  error: { type: String }
}, { timestamps: false });

export const RitualEmailLog = mongoose.model<IRitualEmailLog>(
  'RitualEmailLog', 
  RitualEmailLogSchema
);
