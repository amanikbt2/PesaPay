import { prisma } from '../db';
import { getMpesaProvider } from '../providers';
import { logger } from '../utils/logger';
import {
  ERROR_CODES,
  PaymentDTO,
  InitiatePaymentRequest,
  PaymentStatus,
} from '../shared';

function toPaymentDTO(payment: any, merchantName: string, tillNumber: string): PaymentDTO {
  return {
    id: payment.id,
    merchantId: payment.merchantId,
    merchantName,
    tillNumber,
    amount: payment.amountMinor / 100,
    amountMinor: payment.amountMinor,
    currency: payment.currency,
    status: payment.status as PaymentStatus,
    idempotencyKey: payment.idempotencyKey,
    receiptNumber: payment.receiptNumber,
    checkoutRequestId: payment.checkoutRequestId,
    resultDescription: payment.resultDescription,
    initiatedAt: payment.initiatedAt.toISOString(),
    completedAt: payment.completedAt ? payment.completedAt.toISOString() : null,
    createdAt: payment.createdAt.toISOString(),
  };
}

export class PaymentService {
  async initiatePayment(
    userId: string,
    params: InitiatePaymentRequest
  ): Promise<PaymentDTO> {
    const provider = getMpesaProvider();
    const amountMinor = Math.round(params.amount * 100);

    // 1. Idempotency Check
    const existing = await prisma.payment.findUnique({
      where: { idempotencyKey: params.idempotencyKey },
      include: { merchant: true },
    });

    if (existing) {
      logger.info(`Idempotent replay detected for key: ${params.idempotencyKey}`);
      // Verify parameters match original request
      if (
        existing.amountMinor !== amountMinor ||
        existing.merchant.tillNumber !== params.tillNumber
      ) {
        throw {
          code: ERROR_CODES.IDEMPOTENCY_CONFLICT,
          message: 'An existing payment with this idempotency key has differing parameters.',
          statusCode: 409,
        };
      }
      return toPaymentDTO(existing, existing.merchant.displayName, existing.merchant.tillNumber);
    }

    // 2. Validate Merchant
    const merchant = await prisma.merchant.findFirst({
      where: { tillNumber: params.tillNumber, enabled: true, verificationStatus: 'VERIFIED' },
    });

    if (!merchant) {
      throw {
        code: ERROR_CODES.MERCHANT_NOT_FOUND,
        message: 'Verified merchant for this Till number was not found.',
        statusCode: 404,
      };
    }

    // 3. User verification / fallback phone
    let userPhone = params.phoneNumber;
    if (!userPhone) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      userPhone = user?.phoneNumber || '254712345678';
    }

    // 4. Create initial Payment record inside database
    const payment = await prisma.payment.create({
      data: {
        userId,
        merchantId: merchant.id,
        amountMinor,
        currency: 'KES',
        status: 'PENDING_PROVIDER',
        idempotencyKey: params.idempotencyKey,
        provider: provider.mode,
        events: {
          create: {
            eventType: 'PAYMENT_CREATED',
            data: JSON.stringify({ amount: params.amount, till: params.tillNumber }),
          },
        },
      },
    });

    // 5. Dispatch STK Push to payment provider
    try {
      const stkResult = await provider.initiateStkPush({
        amount: params.amount,
        phoneNumber: userPhone,
        tillNumber: merchant.tillNumber,
        accountReference: merchant.merchantReference,
        transactionDesc: `Pay ${merchant.displayName}`,
      });

      // Update record to STK_SENT
      const updated = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'STK_SENT',
          checkoutRequestId: stkResult.checkoutRequestId,
          merchantRequestId: stkResult.merchantRequestId,
          events: {
            create: {
              eventType: 'STK_SENT',
              data: JSON.stringify(stkResult),
            },
          },
        },
      });

      logger.info(`STK Push dispatched for payment ${payment.id}. Checkout ID: ${stkResult.checkoutRequestId}`);
      return toPaymentDTO(updated, merchant.displayName, merchant.tillNumber);
    } catch (err: any) {
      logger.error(`STK Push dispatch failed for payment ${payment.id}:`, err);

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          resultDescription: err.message || 'Provider rejected request',
          events: {
            create: {
              eventType: 'PROVIDER_ERROR',
              data: JSON.stringify({ error: err.message }),
            },
          },
        },
      });

      throw {
        code: ERROR_CODES.PROVIDER_UNAVAILABLE,
        message: err.message || 'Payment provider could not initiate STK Push.',
        statusCode: 502,
      };
    }
  }

  async getPaymentStatus(paymentId: string, userId: string): Promise<PaymentDTO> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { merchant: true },
    });

    if (!payment) {
      throw {
        code: ERROR_CODES.PAYMENT_FAILED,
        message: 'Payment record not found.',
        statusCode: 404,
      };
    }

    // Security check: Only allow access to the initiating user
    if (payment.userId !== userId && userId !== 'admin') {
      throw {
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'You are not authorized to view this payment.',
        statusCode: 403,
      };
    }

    // If still in pending state and checkoutRequestId exists, check provider query
    if (
      (payment.status === 'STK_SENT' || payment.status === 'PROCESSING') &&
      payment.checkoutRequestId
    ) {
      try {
        const provider = getMpesaProvider();
        const statusQuery = await provider.queryTransactionStatus(payment.checkoutRequestId);

        if (statusQuery.status !== payment.status && statusQuery.status !== 'PROCESSING') {
          logger.info(`Payment ${payment.id} status updated via query: ${statusQuery.status}`);

          const updated = await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: statusQuery.status,
              resultCode: statusQuery.resultCode,
              resultDescription: statusQuery.resultDesc,
              receiptNumber: statusQuery.receiptNumber || payment.receiptNumber,
              completedAt: ['SUCCEEDED', 'FAILED', 'CANCELLED'].includes(statusQuery.status)
                ? new Date()
                : null,
              events: {
                create: {
                  eventType: `STATUS_QUERY_${statusQuery.status}`,
                  data: JSON.stringify(statusQuery),
                },
              },
            },
            include: { merchant: true },
          });

          return toPaymentDTO(updated, updated.merchant.displayName, updated.merchant.tillNumber);
        }
      } catch (err) {
        logger.warn(`Could not query provider status for payment ${paymentId}:`, err);
      }
    }

    return toPaymentDTO(payment, payment.merchant.displayName, payment.merchant.tillNumber);
  }

  async handleCallback(rawPayload: unknown): Promise<{ ResultCode: number; ResultDesc: string }> {
    const provider = getMpesaProvider();
    const normalized = provider.parseCallback(rawPayload);

    logger.info(`Processing M-Pesa Callback for CheckoutRequestID: ${normalized.checkoutRequestId}`);

    // Idempotent callback deduplication
    const existingWebhook = await prisma.webhookEvent.findUnique({
      where: { providerEventId: normalized.checkoutRequestId },
    });

    if (existingWebhook && existingWebhook.processingStatus === 'PROCESSED') {
      logger.info(`Duplicate callback ignored for CheckoutRequestID: ${normalized.checkoutRequestId}`);
      return { ResultCode: 0, ResultDesc: 'Duplicate callback accepted' };
    }

    await prisma.webhookEvent.upsert({
      where: { providerEventId: normalized.checkoutRequestId },
      update: { rawPayload: JSON.stringify(rawPayload), processingStatus: 'PROCESSING' },
      create: {
        provider: provider.mode,
        providerEventId: normalized.checkoutRequestId,
        rawPayload: JSON.stringify(rawPayload),
        processingStatus: 'PROCESSING',
      },
    });

    // Locate the matching payment record
    const payment = await prisma.payment.findUnique({
      where: { checkoutRequestId: normalized.checkoutRequestId },
    });

    if (!payment) {
      logger.error(`No pending payment found for CheckoutRequestID: ${normalized.checkoutRequestId}`);
      await prisma.webhookEvent.update({
        where: { providerEventId: normalized.checkoutRequestId },
        data: { processingStatus: 'FAILED' },
      });
      return { ResultCode: 0, ResultDesc: 'Accepted but not matched' };
    }

    const newStatus: PaymentStatus = normalized.isSuccessful ? 'SUCCEEDED' : 'FAILED';

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: newStatus,
          resultCode: normalized.resultCode,
          resultDescription: normalized.resultDesc,
          receiptNumber: normalized.receiptNumber || payment.receiptNumber,
          completedAt: new Date(),
        },
      }),
      prisma.paymentEvent.create({
        data: {
          paymentId: payment.id,
          eventType: `CALLBACK_${newStatus}`,
          data: JSON.stringify(normalized),
        },
      }),
      prisma.webhookEvent.update({
        where: { providerEventId: normalized.checkoutRequestId },
        data: { processingStatus: 'PROCESSED', processedAt: new Date() },
      }),
    ]);

    logger.info(`Payment ${payment.id} finalized from callback: ${newStatus} (Receipt: ${normalized.receiptNumber || 'none'})`);

    return { ResultCode: 0, ResultDesc: 'Success' };
  }

  async getUserHistory(userId: string): Promise<PaymentDTO[]> {
    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { merchant: true },
    });

    return payments.map((p) => toPaymentDTO(p, p.merchant.displayName, p.merchant.tillNumber));
  }
}

export const paymentService = new PaymentService();
