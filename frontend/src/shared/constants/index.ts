/**
 * Core PesaPay Constants & Configuration Defaults
 */

export const APP_CONFIG = {
  BRAND_NAME: 'PesaPay',
  ALT_BRAND_NAME: 'CampusPay',
  DEFAULT_CURRENCY: 'KES',
  MIN_AMOUNT_KES: 1,
  MAX_AMOUNT_KES: 150000, // Safaricom Lipa Na M-Pesa per-transaction limit
  DEFAULT_QUICK_AMOUNTS: [100, 200, 500, 1000],
  // Timeout for STK Push response confirmation polling in seconds
  PAYMENT_POLL_TIMEOUT_SEC: 90,
  PAYMENT_POLL_INTERVAL_MS: 3000,
  // Offline check timeout in milliseconds
  CONNECTIVITY_CHECK_TIMEOUT_MS: 4000,
  // Maximum length of QR code string to prevent memory denial-of-service
  MAX_QR_PAYLOAD_LENGTH: 512,
} as const;

export const THEME_COLORS = {
  emerald: {
    primary: '#10B981', // Main emerald green from screenshots
    primaryDark: '#059669',
    primaryLight: '#34D399',
    glow: 'rgba(16, 185, 129, 0.3)',
  },
  dark: {
    background: '#0B0F19', // Deep dark navy
    surface: '#151D2F',
    card: '#1E293B',
    border: '#334155',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
  },
  status: {
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
  },
} as const;

export const ERROR_CODES = {
  OFFLINE: 'OFFLINE_ERROR',
  UNSUPPORTED_QR: 'UNSUPPORTED_QR',
  INVALID_QR_PAYLOAD: 'INVALID_QR_PAYLOAD',
  MERCHANT_NOT_FOUND: 'MERCHANT_NOT_FOUND',
  MERCHANT_DISABLED: 'MERCHANT_DISABLED',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  AMOUNT_OUT_OF_BOUNDS: 'AMOUNT_OUT_OF_BOUNDS',
  IDEMPOTENCY_KEY_MISSING: 'IDEMPOTENCY_KEY_MISSING',
  IDEMPOTENCY_CONFLICT: 'IDEMPOTENCY_CONFLICT',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_TIMEOUT: 'PAYMENT_TIMEOUT',
  PROVIDER_UNAVAILABLE: 'PROVIDER_UNAVAILABLE',
  UNAUTHORIZED: 'UNAUTHORIZED',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;
