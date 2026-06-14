import { Request, Response } from 'express';
import { createOrder, processSuccessfulPayment, verifyPaymentSignature, verifyWebhookSignature } from './payments.service';
import { PaymentOrder } from './payment-order.schema';
import { User } from '../users/user.schema';

export const createOrderController = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.sub || req.user.id;
    const { packageId } = req.body;

    if (!packageId) {
      return res.status(400).json({ success: false, error: 'Package ID is required' });
    }

    const orderData = await createOrder(userId, packageId);
    res.json({ success: true, ...orderData });
  } catch (error: any) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
};

export const verifyPaymentController = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.sub || req.user.id;
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, packageId } = req.body;

    const paymentOrder = await PaymentOrder.findOne({ razorpayOrderId: razorpay_order_id });
    if (!paymentOrder) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (paymentOrder.userId.toString() !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    if (paymentOrder.status === 'paid') {
      const user = await User.findById(userId);
      return res.json({
        success: true,
        newBalance: user?.wallet?.credits || 0,
        alreadyProcessed: true,
      });
    }

    const isValidSignature = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValidSignature) {
      paymentOrder.status = 'verification_failed';
      await paymentOrder.save();
      return res.status(400).json({ success: false, error: 'Invalid signature' });
    }

    const result = await processSuccessfulPayment(paymentOrder, razorpay_payment_id);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
};

export const webhookController = async (req: Request, res: Response) => {
  console.log('----------------------------------------');
  console.log('🔔 Webhook received from Razorpay');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    console.log('x-razorpay-signature:', signature);

    // Express raw body is needed for accurate signature verification.
    // Captured via custom verify function in express.json setup.
    const payload = (req as any).rawBody ? (req as any).rawBody.toString() : JSON.stringify(req.body);
    console.log('Raw Payload (first 100 chars):', payload.substring(0, 100) + '...');

    const isValid = verifyWebhookSignature(payload, signature);
    console.log('Signature verification result:', isValid);
    
    if (!isValid) {
      console.warn('❌ Invalid Razorpay Webhook Signature');
      return res.status(400).send('Invalid signature');
    }

    const { event, payload: eventPayload } = req.body;
    console.log(`✅ Valid webhook event received: ${event}`);

    if (event === 'payment.captured') {
      const paymentEntity = eventPayload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;
      
      console.log(`💰 Payment Captured! Order ID: ${razorpayOrderId}, Payment ID: ${razorpayPaymentId}`);

      const paymentOrder = await PaymentOrder.findOne({ razorpayOrderId });
      if (paymentOrder) {
        console.log(`📄 Found existing PaymentOrder in DB: ${paymentOrder._id}. Current status: ${paymentOrder.status}`);
        const result = await processSuccessfulPayment(paymentOrder, razorpayPaymentId);
        console.log(`✨ Processed payment successfully. Result:`, result);
      } else {
        console.warn(`⚠️ Payment order not found in DB for razorpayOrderId: ${razorpayOrderId}`);
      }
    } else {
      console.log(`ℹ️ Unhandled webhook event type: ${event}`);
    }

    // Always return 200 to Razorpay
    console.log('✅ Webhook processed successfully, returning 200 OK');
    console.log('----------------------------------------');
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    // Still return 200 to prevent Razorpay from endlessly retrying on our internal errors
    res.status(200).send('Error');
  }
};
