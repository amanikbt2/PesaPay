import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from backend directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  DATABASE_URL: z.string().default('file:./dev.db'),
  CORS_ORIGINS: z.string().default('*'),
  JWT_ACCESS_SECRET: z.string().min(16).default('pesapay_dev_access_secret_min_16_chars_default'),
  JWT_REFRESH_SECRET: z.string().min(16).default('pesapay_dev_refresh_secret_min_16_chars_default'),
  API_KEY_SECRET: z.string().default('pesapay_mobile_client_secret_token'),

  // Payment Provider Configuration
  PAYMENT_PROVIDER: z.enum(['mock', 'daraja']).default('mock'),

  // Daraja Safaricom Config (Required if PAYMENT_PROVIDER = 'daraja')
  MPESA_ENVIRONMENT: z.enum(['sandbox', 'production']).default('sandbox'),
  MPESA_CONSUMER_KEY: z.string().optional().default(''),
  MPESA_CONSUMER_SECRET: z.string().optional().default(''),
  MPESA_SHORTCODE: z.string().optional().default('174379'),
  MPESA_PASSKEY: z.string().optional().default(''),
  MPESA_CALLBACK_URL: z.string().optional().default('http://localhost:4000/api/v1/payments/mpesa/callback'),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;

// In production or when daraja is explicitly requested, verify credentials
if (env.PAYMENT_PROVIDER === 'daraja') {
  if (!env.MPESA_CONSUMER_KEY || !env.MPESA_CONSUMER_SECRET || !env.MPESA_PASSKEY) {
    if (env.NODE_ENV === 'production') {
      console.error('FATAL: PAYMENT_PROVIDER=daraja is configured, but required Daraja credentials are missing!');
      process.exit(1);
    } else {
      console.warn('WARNING: PAYMENT_PROVIDER=daraja is set, but credentials are incomplete. Mock fallback may be required.');
    }
  }
}
