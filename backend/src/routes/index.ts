import { Router } from 'express';
import { healthController } from '../controllers/health.controller';
import { merchantController } from '../controllers/merchant.controller';
import { paymentController } from '../controllers/payment.controller';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth';
import { paymentRateLimiter } from '../middleware/rateLimiter';

export const apiRouter = Router();

// Health & Reachability checks
apiRouter.get('/health', (req, res) => healthController.getHealth(req, res));
apiRouter.get('/health/ready', (req, res) => healthController.getReady(req, res));
apiRouter.get('/connectivity', (req, res) => healthController.getConnectivity(req, res));

// Authentication & Session
apiRouter.post('/auth/session', (req, res, next) => authController.getOrCreateSession(req, res, next));

// Merchant Resolution (Protected by session token)
apiRouter.post('/merchants/resolve-qr', authMiddleware, (req, res, next) =>
  merchantController.resolveQr(req, res, next)
);
apiRouter.get('/merchants/:id', authMiddleware, (req, res, next) =>
  merchantController.getMerchant(req, res, next)
);

// Payment Initiation & Status
apiRouter.post(
  '/payments/stk-push',
  authMiddleware,
  paymentRateLimiter,
  (req, res, next) => paymentController.initiatePayment(req, res, next)
);
apiRouter.get('/payments/:paymentId', authMiddleware, (req, res, next) =>
  paymentController.getPaymentStatus(req, res, next)
);

// Safaricom Daraja Callback Endpoint (Public HTTPS destination for Safaricom IPN)
apiRouter.post('/payments/mpesa/callback', (req, res, next) =>
  paymentController.handleMpesaCallback(req, res, next)
);

// Transaction History
apiRouter.get('/transactions', authMiddleware, (req, res, next) =>
  paymentController.getHistory(req, res, next)
);
