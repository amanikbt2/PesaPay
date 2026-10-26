import { env } from '../config/env';

const SENSITIVE_KEYS = [
  'password',
  'passkey',
  'secret',
  'consumer_secret',
  'pin',
  'authorization',
  'token',
  'jwt',
  'access_token',
];

function sanitize(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map(sanitize);
  }

  const copy: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some((sk) => lowerKey.includes(sk))) {
      copy[key] = '***REDACTED***';
    } else if (lowerKey.includes('phone') && typeof value === 'string' && value.length >= 8) {
      // Mask phone number e.g. 2547****5678
      copy[key] = value.slice(0, 4) + '****' + value.slice(-4);
    } else if (typeof value === 'object') {
      copy[key] = sanitize(value);
    } else {
      copy[key] = value;
    }
  }
  return copy;
}

export const logger = {
  debug(message: string, meta?: unknown) {
    if (env.LOG_LEVEL === 'debug') {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, meta ? sanitize(meta) : '');
    }
  },
  info(message: string, meta?: unknown) {
    console.log(`[INFO]  ${new Date().toISOString()} - ${message}`, meta ? sanitize(meta) : '');
  },
  warn(message: string, meta?: unknown) {
    console.warn(`[WARN]  ${new Date().toISOString()} - ${message}`, meta ? sanitize(meta) : '');
  },
  error(message: string, error?: unknown) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error ? sanitize(error) : '');
  },
};
