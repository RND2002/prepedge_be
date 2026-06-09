import mongoose, { Schema, Document } from 'mongoose';

export interface IRitualWaitlist extends Document {
  userId: mongoose.Types.ObjectId;
  status: string;
  createdAt: Date;
}

const RitualWaitlistSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    status: { type: String, enum: ['interested', 'invited', 'joined'], default: 'interested' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const RitualWaitlist = mongoose.model<IRitualWaitlist>('RitualWaitlist', RitualWaitlistSchema);
