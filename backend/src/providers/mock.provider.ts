import { IMpesaProvider, StkPushParams, StkPushResult, StkQueryResult, NormalizedCallbackResult } from './mpesa.interface';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

interface MockTransactionState {
  checkoutRequestId: string;
  merchantRequestId: string;
  amount: number;
  phoneNumber: string;
  tillNumber: string;
  createdAt: number;
  outcome: 'SUCCESS' | 'FAILED' | 'CANCELLED';
  receiptNumber: string;
}

export class MockMpesaProvider implements IMpesaProvider {
  readonly mode = 'mock' as const;
  private transactions = new Map<string, MockTransactionState>();

  async initiateStkPush(params: StkPushParams): Promise<StkPushResult> {
    const checkoutRequestId = `ws_CO_MOCK_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    const merchantRequestId = `MR_MOCK_${uuidv4().replace(/-/g, '').slice(0, 8)}`;

    // Special test amount trigger: 999 -> Cancelled, 888 -> Failed
    let outcome: 'SUCCESS' | 'FAILED' | 'CANCELLED' = 'SUCCESS';
    if (params.amount === 999) outcome = 'CANCELLED';
    if (params.amount === 888) outcome = 'FAILED';

    const randomReceipt = 'MOCK' + Math.random().toString(36).substring(2, 10).toUpperCase();

    this.transactions.set(checkoutRequestId, {
      checkoutRequestId,
      merchantRequestId,
      amount: params.amount,
      phoneNumber: params.phoneNumber,
      tillNumber: params.tillNumber,
      createdAt: Date.now(),
      outcome,
      receiptNumber: randomReceipt,
    });

    logger.info(`[MOCK MODE: No real funds moved] STK Push simulated for Till ${params.tillNumber}, Amount KES ${params.amount}. Checkout ID: ${checkoutRequestId}`);

    return {
      checkoutRequestId,
      merchantRequestId,
      responseCode: '0',
      responseDescription: 'Success. Request accepted for processing [MOCK]',
      customerMessage: 'Success. Check your phone for the M-Pesa prompt [MOCK MODE]',
    };
  }

  async queryTransactionStatus(checkoutRequestId: string): Promise<StkQueryResult> {
    const tx = this.transactions.get(checkoutRequestId);
    if (!tx) {
      return {
        checkoutRequestId,
        resultCode: 1,
        resultDesc: 'The service was unable to process your request. [MOCK]',
        status: 'FAILED',
      };
    }

    const elapsedMs = Date.now() - tx.createdAt;

    // Simulate STK Push prompt delay: user takes ~3-4 seconds to "enter PIN"
    if (elapsedMs < 3500) {
      return {
        checkoutRequestId,
        resultCode: 0,
        resultDesc: 'Waiting for customer response [MOCK]',
        status: 'PROCESSING',
      };
    }

    if (tx.outcome === 'CANCELLED') {
      return {
        checkoutRequestId,
        resultCode: 1032,
        resultDesc: 'Request cancelled by user [MOCK]',
        status: 'CANCELLED',
      };
    }

    if (tx.outcome === 'FAILED') {
      return {
        checkoutRequestId,
        resultCode: 1001,
        resultDesc: 'Insufficient M-Pesa balance [MOCK]',
        status: 'FAILED',
      };
    }

    return {
      checkoutRequestId,
      resultCode: 0,
      resultDesc: 'The service request is processed successfully. [MOCK]',
      status: 'SUCCEEDED',
      receiptNumber: tx.receiptNumber,
    };
  }

  parseCallback(payload: unknown): NormalizedCallbackResult {
    logger.info('[MOCK MODE] Parsing callback payload');
    const raw = payload as any;
    const stk = raw?.Body?.stkCallback || raw;
    const checkoutRequestId = stk?.CheckoutRequestID || 'ws_CO_MOCK_UNKNOWN';
    const resultCode = Number(stk?.ResultCode ?? 0);
    const resultDesc = stk?.ResultDesc || (resultCode === 0 ? 'Success' : 'Failed');
    const isSuccessful = resultCode === 0;

    let receiptNumber: string | undefined;
    if (stk?.CallbackMetadata?.Item) {
      const receiptItem = stk.CallbackMetadata.Item.find((i: any) => i.Name === 'MpesaReceiptNumber');
      if (receiptItem) receiptNumber = String(receiptItem.Value);
    }

    return {
      checkoutRequestId,
      merchantRequestId: stk?.MerchantRequestID || 'MR_UNKNOWN',
      resultCode,
      resultDesc,
      receiptNumber: receiptNumber || (isSuccessful ? 'MOCK_RCPT_' + Math.random().toString(36).slice(2, 8).toUpperCase() : undefined),
      isSuccessful,
    };
  }
}
