import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/payment.service';
import { InitiatePaymentRequestSchema } from '../shared';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedUser } from '../middleware/auth';

export class PaymentController {
  async initiatePayment(req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals.user as AuthenticatedUser;
      const validated = InitiatePaymentRequestSchema.parse(req.body);

      const payment = await paymentService.initiatePayment(user.id, validated);
      return sendSuccess(res, payment, 201);
    } catch (err: any) {
      if (err.statusCode) {
        return sendError(res, err.code, err.message, err.statusCode);
      }
      return next(err);
    }
  }

  async getPaymentStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals.user as AuthenticatedUser;
      const paymentId = req.params.paymentId;

      const payment = await paymentService.getPaymentStatus(paymentId, user.id);
      return sendSuccess(res, payment);
    } catch (err: any) {
      if (err.statusCode) {
        return sendError(res, err.code, err.message, err.statusCode);
      }
      return next(err);
    }
  }

  async handleMpesaCallback(req: Request, res: Response, next: NextFunction) {
    try {
      // Safaricom expects a standard JSON response with ResultCode 0
      const ack = await paymentService.handleCallback(req.body);
      return res.status(200).json(ack);
    } catch (err) {
      return next(err);
    }
  }

  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals.user as AuthenticatedUser;
      const history = await paymentService.getUserHistory(user.id);
      return sendSuccess(res, history);
    } catch (err) {
      return next(err);
    }
  }
}

export const paymentController = new PaymentController();
