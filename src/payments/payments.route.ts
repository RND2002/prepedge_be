import express from 'express';
import { createOrderController, verifyPaymentController, webhookController } from './payments.controller';
import { getWalletController, getPaywallContextController, getCreditPackagesController, getTransactionsController } from './wallet.controller';

const router = express.Router();

import { authenticate } from '../middleware/auth.middleware';

// Payment routes
router.post('/create-order', authenticate, createOrderController);
router.post('/verify', authenticate, verifyPaymentController);
router.post('/webhook', webhookController); // Webhook does not use standard auth middleware

// Wallet routes
router.get('/wallet', authenticate, getWalletController);
router.get('/wallet/paywall-context', authenticate, getPaywallContextController);
router.get('/credits/packages', getCreditPackagesController); // Public
router.get('/wallet/transactions', authenticate, getTransactionsController);

export default router;
