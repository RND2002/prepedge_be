import mongoose, { Schema, Document } from 'mongoose';

export interface ICreditTransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'purchase' | 'free_renewal' | 'spend' | 'refund';
  amount: number;
  reason: string;
  relatedSessionId: mongoose.Types.ObjectId | null;
  relatedPaymentOrderId: mongoose.Types.ObjectId | null;
  balanceAfter: number;
  createdAt: Date;
}

const CreditTransactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['purchase', 'free_renewal', 'spend', 'refund'],
      required: true,
    },
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
    relatedSessionId: { type: Schema.Types.ObjectId, default: null },
    relatedPaymentOrderId: { type: Schema.Types.ObjectId, default: null },
    balanceAfter: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

CreditTransactionSchema.index({ userId: 1, createdAt: -1 });

export const CreditTransaction = mongoose.model<ICreditTransaction>('CreditTransaction', CreditTransactionSchema);
