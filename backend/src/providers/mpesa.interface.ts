import { PaymentStatus } from '../shared';

export interface StkPushParams {
  amount: number; // in major units (KES)
  phoneNumber: string; // Kenyan normalized format 254XXXXXXXXX
  tillNumber: string;
  accountReference: string; // e.g. CAMPUS_KIOSK
  transactionDesc: string;
}

export interface StkPushResult {
  merchantRequestId: string;
  checkoutRequestId: string;
  responseCode: string;
  responseDescription: string;
  customerMessage: string;
}

export interface StkQueryResult {
  checkoutRequestId: string;
  resultCode: number;
  resultDesc: string;
  status: PaymentStatus;
  receiptNumber?: string;
}

export interface NormalizedCallbackResult {
  checkoutRequestId: string;
  merchantRequestId: string;
  resultCode: number;
  resultDesc: string;
  receiptNumber?: string;
  amount?: number;
  phoneNumber?: string;
  transactionDate?: string;
  isSuccessful: boolean;
}

export interface IMpesaProvider {
  readonly mode: 'mock' | 'daraja';
  initiateStkPush(params: StkPushParams): Promise<StkPushResult>;
  queryTransactionStatus(checkoutRequestId: string): Promise<StkQueryResult>;
  parseCallback(payload: unknown): NormalizedCallbackResult;
}
