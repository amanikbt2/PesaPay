import { IMpesaProvider, StkPushParams, StkPushResult, StkQueryResult, NormalizedCallbackResult } from './mpesa.interface';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { DarajaCallbackSchema } from '../shared';

export class DarajaMpesaProvider implements IMpesaProvider {
  readonly mode = 'daraja' as const;
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;

  private get baseUrl(): string {
    return env.MPESA_ENVIRONMENT === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
  }

  /**
   * Generates formatted timestamp in YYYYMMDDHHmmss format (East Africa Time UTC+3)
   */
  private getTimestamp(): string {
    const now = new Date();
    // Offset for UTC+3
    const eatDate = new Date(now.getTime() + (3 * 60 - now.getTimezoneOffset()) * 60000);
    const year = eatDate.getFullYear();
    const month = String(eatDate.getMonth() + 1).padStart(2, '0');
    const day = String(eatDate.getDate()).padStart(2, '0');
    const hours = String(eatDate.getHours()).padStart(2, '0');
    const minutes = String(eatDate.getMinutes()).padStart(2, '0');
    const seconds = String(eatDate.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Generates base64 encoded Lipa Na M-Pesa password
   */
  private generatePassword(timestamp: string): string {
    const raw = `${env.MPESA_SHORTCODE}${env.MPESA_PASSKEY}${timestamp}`;
    return Buffer.from(raw).toString('base64');
  }

  /**
   * Fetches or reuses cached OAuth Access Token from Safaricom Daraja
   */
  async obtainAccessToken(): Promise<string> {
    const nowSeconds = Math.floor(Date.now() / 1000);
    // Reuse token if still valid for at least 60 seconds
    if (this.accessToken && this.tokenExpiresAt > nowSeconds + 60) {
      return this.accessToken;
    }

    if (!env.MPESA_CONSUMER_KEY || !env.MPESA_CONSUMER_SECRET) {
      throw new Error('Daraja consumer key or secret is missing. Check your .env configuration.');
    }

    const auth = Buffer.from(`${env.MPESA_CONSUMER_KEY}:${env.MPESA_CONSUMER_SECRET}`).toString('base64');
    const url = `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`;

    logger.info(`Requesting Daraja OAuth token from ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      logger.error(`Daraja OAuth token request failed (${response.status}):`, errText);
      throw new Error(`Daraja authentication failed: HTTP ${response.status}`);
    }

    const data = (await response.json()) as { access_token: string; expires_in: string };
    this.accessToken = data.access_token;
    this.tokenExpiresAt = nowSeconds + parseInt(data.expires_in, 10);

    logger.info('Daraja OAuth token obtained successfully.');
    return this.accessToken;
  }

  /**
   * Dispatches Lipa Na M-Pesa Online STK Push request to Safaricom Daraja
   */
  async initiateStkPush(params: StkPushParams): Promise<StkPushResult> {
    const token = await this.obtainAccessToken();
    const timestamp = this.getTimestamp();
    const password = this.generatePassword(timestamp);

    // If Till number is used directly in BuyGoods, TransactionType is CustomerBuyGoodsOnline
    // If standard Daraja sandbox shortcode (174379) or Paybill is used, CustomerPayBillOnline
    const isTill = params.tillNumber.length <= 7 && params.tillNumber !== '174379';
    const transactionType = isTill ? 'CustomerBuyGoodsOnline' : 'CustomerPayBillOnline';

    const payload = {
      BusinessShortCode: env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: transactionType,
      Amount: Math.round(params.amount),
      PartyA: params.phoneNumber,
      PartyB: isTill ? params.tillNumber : env.MPESA_SHORTCODE,
      PhoneNumber: params.phoneNumber,
      CallBackURL: env.MPESA_CALLBACK_URL,
      AccountReference: params.accountReference.slice(0, 12),
      TransactionDesc: params.transactionDesc.slice(0, 12),
    };

    const url = `${this.baseUrl}/mpesa/stkpush/v1/processrequest`;
    logger.info(`Sending STK Push to Daraja (${transactionType}) for phone ${params.phoneNumber.slice(0, 4)}****`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const body = (await response.json()) as {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResponseCode: string;
      ResponseDescription: string;
      CustomerMessage: string;
      errorMessage?: string;
    };

    if (!response.ok || body.ResponseCode !== '0') {
      logger.error('Daraja STK Push request rejected by provider:', body);
      throw new Error(body.errorMessage || body.ResponseDescription || 'STK Push rejected by provider.');
    }

    return {
      merchantRequestId: body.MerchantRequestID,
      checkoutRequestId: body.CheckoutRequestID,
      responseCode: body.ResponseCode,
      responseDescription: body.ResponseDescription,
      customerMessage: body.CustomerMessage,
    };
  }

  /**
   * Queries Daraja STK Push status directly from Safaricom
   */
  async queryTransactionStatus(checkoutRequestId: string): Promise<StkQueryResult> {
    const token = await this.obtainAccessToken();
    const timestamp = this.getTimestamp();
    const password = this.generatePassword(timestamp);

    const payload = {
      BusinessShortCode: env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    };

    const url = `${this.baseUrl}/mpesa/stkpushquery/v1/query`;
    logger.info(`Querying Daraja STK transaction status for CheckoutRequestID: ${checkoutRequestId}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const body = (await response.json()) as {
      ResponseCode: string;
      ResponseDescription: string;
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: string | number;
      ResultDesc: string;
      errorMessage?: string;
    };

    if (!response.ok) {
      logger.warn(`Daraja status query returned HTTP ${response.status}`, body);
      return {
        checkoutRequestId,
        resultCode: 999,
        resultDesc: body.errorMessage || 'Unable to confirm provider status at this moment.',
        status: 'PROCESSING',
      };
    }

    const resultCode = Number(body.ResultCode);
    if (resultCode === 0) {
      return {
        checkoutRequestId,
        resultCode,
        resultDesc: body.ResultDesc,
        status: 'SUCCEEDED',
      };
    } else if (resultCode === 1032) {
      return {
        checkoutRequestId,
        resultCode,
        resultDesc: 'Transaction cancelled by user.',
        status: 'CANCELLED',
      };
    } else {
      return {
        checkoutRequestId,
        resultCode,
        resultDesc: body.ResultDesc || 'Payment failed.',
        status: 'FAILED',
      };
    }
  }

  /**
   * Parses and validates official Safaricom Daraja STK Callback payload
   */
  parseCallback(payload: unknown): NormalizedCallbackResult {
    const parsed = DarajaCallbackSchema.parse(payload);
    const stk = parsed.Body.stkCallback;
    const resultCode = stk.ResultCode;
    const isSuccessful = resultCode === 0;

    let receiptNumber: string | undefined;
    let amount: number | undefined;
    let phoneNumber: string | undefined;
    let transactionDate: string | undefined;

    if (stk.CallbackMetadata?.Item) {
      for (const item of stk.CallbackMetadata.Item) {
        if (item.Name === 'MpesaReceiptNumber' && item.Value) {
          receiptNumber = String(item.Value);
        } else if (item.Name === 'Amount' && item.Value) {
          amount = Number(item.Value);
        } else if (item.Name === 'PhoneNumber' && item.Value) {
          phoneNumber = String(item.Value);
        } else if (item.Name === 'TransactionDate' && item.Value) {
          transactionDate = String(item.Value);
        }
      }
    }

    return {
      checkoutRequestId: stk.CheckoutRequestID,
      merchantRequestId: stk.MerchantRequestID,
      resultCode,
      resultDesc: stk.ResultDesc,
      receiptNumber,
      amount,
      phoneNumber,
      transactionDate,
      isSuccessful,
    };
  }
}
