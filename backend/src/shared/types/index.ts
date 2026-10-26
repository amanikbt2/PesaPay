/**
 * Shared Type Definitions for PesaPay Mobile and Backend
 */

export type PaymentStatus =
  | 'CREATED'
  | 'VALIDATING'
  | 'PENDING_PROVIDER'
  | 'STK_SENT'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'UNKNOWN';

export type MerchantVerificationStatus = 'UNVERIFIED' | 'VERIFIED' | 'SUSPENDED';

export type PaymentProviderMode = 'mock' | 'daraja';

export type QrFormat =
  | 'SAFARICOM_JSON'
  | 'SAFARICOM_TEXT_TILL'
  | 'PESAPAY_DEEP_LINK'
  | 'DEV_MOCK_TILL';

export interface ParsedMerchantQr {
  format: QrFormat;
  tillNumber: string;
  merchantReference?: string;
  merchantDisplayNameIfTrusted?: string;
  rawPayload: string;
}

export interface QrParseResult {
  isValid: boolean;
  data?: ParsedMerchantQr;
  errorCode?: string;
  errorMessage?: string;
}

export interface MerchantDTO {
  id: string;
  displayName: string;
  merchantReference: string;
  tillNumber: string;
  verificationStatus: MerchantVerificationStatus;
  enabled: boolean;
}

export interface PaymentDTO {
  id: string;
  merchantId: string;
  merchantName: string;
  tillNumber: string;
  amount: number; // In Major Units (KES, e.g. 150)
  amountMinor: number; // In Cents (e.g. 15000)
  currency: string;
  status: PaymentStatus;
  idempotencyKey: string;
  receiptNumber?: string | null;
  checkoutRequestId?: string | null;
  resultDescription?: string | null;
  initiatedAt: string;
  completedAt?: string | null;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId: string;
  timestamp: string;
}

export interface ConnectivityStatus {
  status: 'ok' | 'degraded';
  providerMode: PaymentProviderMode;
  darajaConfigured: boolean;
  serverTime: string;
}

export interface UserSessionDTO {
  userId: string;
  token: string;
}
