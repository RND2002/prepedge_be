import Razorpay from 'razorpay';
import crypto from 'crypto';
import { PaymentOrder, IPaymentOrder } from './payment-order.schema';
import { CreditPackage } from './credit-package.schema';
import { User } from '../users/user.schema';
import { CreditTransaction } from './credit-transaction.schema';

const getKeyId = () => {
  const key = process.env.TEST_API_KEY || process.env.RAZORPAY_KEY_ID;
  return (key && key.trim().length > 0) ? key.trim() : 'dummy_key_id';
};

const getKeySecret = () => {
  const secret = process.env.TEST_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;
  return (secret && secret.trim().length > 0) ? secret.trim() : 'dummy_key_secret';
};

const razorpay = new Razorpay({
  key_id: getKeyId(),
  key_secret: getKeySecret(),
});

export const createOrder = async (userId: string, packageId: string) => {
  const pkg = await CreditPackage.findOne({ packageId, isActive: true });
  if (!pkg) {
    throw new Error('Invalid or inactive package');
  }

  const finalAmountInPaise = pkg.priceInPaise;

  const orderOptions = {
    amount: finalAmountInPaise,
    currency: 'INR',
    receipt: `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    notes: { userId, packageId },
  };

  const razorpayOrder = await razorpay.orders.create(orderOptions);

  const paymentOrder = await PaymentOrder.create({
    userId,
    packageId,
    razorpayOrderId: razorpayOrder.id,
    amountInPaise: finalAmountInPaise,
    status: 'created',
  });

  return {
    orderId: razorpayOrder.id,
    amount: pkg.priceInPaise,
    currency: 'INR',
    keyId: process.env.TEST_API_KEY || process.env.RAZORPAY_KEY_ID,
    packageName: pkg.name,
    credits: pkg.credits,
  };
};

import { sendPaymentSuccessEmail } from '../lib/email';

export const processSuccessfulPayment = async (
  paymentOrder: IPaymentOrder,
  razorpayPaymentId: string
) => {
  if (paymentOrder.status === 'paid') {
    return { alreadyProcessed: true };
  }

  paymentOrder.status = 'paid';
  paymentOrder.razorpayPaymentId = razorpayPaymentId;
  paymentOrder.verifiedAt = new Date();
  await paymentOrder.save();

  const pkg = await CreditPackage.findOne({ packageId: paymentOrder.packageId });
  if (!pkg) throw new Error('Package not found during verification');

  const user = await User.findById(paymentOrder.userId);
  if (!user) throw new Error('User not found during verification');

  if (!user.wallet) {
    user.wallet = {
      credits: 0,
      freeCreditsRenewAt: new Date(),
      lifetimeCreditsEarned: 0,
      lifetimeCreditsSpent: 0,
    };
  }

  user.wallet.credits += pkg.credits;
  user.wallet.lifetimeCreditsEarned += pkg.credits;
  await user.save();

  await CreditTransaction.create({
    userId: user._id,
    type: 'purchase',
    amount: pkg.credits,
    reason: `package_${pkg.packageId}`,
    relatedPaymentOrderId: paymentOrder._id,
    balanceAfter: user.wallet.credits,
  });

  // Trigger the success email asynchronously
  const amountPaidInRupees = paymentOrder.amountInPaise / 100;
  sendPaymentSuccessEmail(user.email, pkg.displayName || pkg.name, amountPaidInRupees, paymentOrder.razorpayOrderId).catch(err => {
    console.error('Failed to trigger payment success email:', err);
  });

  return {
    alreadyProcessed: false,
    newBalance: user.wallet.credits,
    creditsAdded: pkg.credits,
  };
};

export const verifyPaymentSignature = (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string
) => {
  const secret = (process.env.TEST_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET) as string;
  const generated = crypto
    .createHmac('sha256', secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  return generated === signature;
};

export const verifyWebhookSignature = (payload: string, signature: string) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('❌ CRITICAL: RAZORPAY_WEBHOOK_SECRET is missing from environment variables!');
    return false;
  }
  
  const generated = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return generated === signature;
};
