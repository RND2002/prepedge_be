import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentOrder extends Document {
  userId: mongoose.Types.ObjectId;
  packageId: string;
  razorpayOrderId: string;
  amountInPaise: number;
  status: 'created' | 'paid' | 'failed' | 'verification_failed';
  razorpayPaymentId: string | null;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentOrderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    packageId: { type: String, required: true },
    razorpayOrderId: { type: String, required: true, unique: true },
    amountInPaise: { type: Number, required: true },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'verification_failed'],
      default: 'created',
    },
    razorpayPaymentId: { type: String, default: null },
    verifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

PaymentOrderSchema.index({ userId: 1, createdAt: -1 });
PaymentOrderSchema.index({ razorpayOrderId: 1 }, { unique: true });

export const PaymentOrder = mongoose.model<IPaymentOrder>('PaymentOrder', PaymentOrderSchema);
