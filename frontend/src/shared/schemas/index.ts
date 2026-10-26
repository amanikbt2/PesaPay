import { z } from 'zod';
import { APP_CONFIG } from '../constants';

/**
 * Validates Kenyan phone numbers (format: 2547XXXXXXXX or 2541XXXXXXXX or 07XXXXXXXX or 01XXXXXXXX)
 * Normalizes to 254XXXXXXXXX
 */
export const KenyaPhoneSchema = z
  .string()
  .trim()
  .transform((val) => {
    let clean = val.replace(/[\s+-]/g, '');
    if (clean.startsWith('0')) {
      clean = '254' + clean.slice(1);
    } else if (clean.startsWith('+254')) {
      clean = clean.slice(1);
    }
    return clean;
  })
  .refine(
    (val) => /^254[17][0-9]{8}$/.test(val),
    { message: 'Must be a valid Kenyan mobile number (e.g. 0712345678 or 254712345678)' }
  );

/**
 * Validates till numbers (standard Safaricom Till is 5 to 7 digits)
 */
export const TillNumberSchema = z
  .string()
  .trim()
  .min(3, 'Till number must be at least 3 digits')
  .max(10, 'Till number must not exceed 10 digits')
  .regex(/^[0-9]+$/, 'Till number must contain only numbers');

/**
 * Validates payment amounts
 */
export const PaymentAmountSchema = z
  .number({ invalid_type_error: 'Amount must be a number' })
  .int('Amount must be a whole Kenyan shilling')
  .min(APP_CONFIG.MIN_AMOUNT_KES, `Minimum amount is KES ${APP_CONFIG.MIN_AMOUNT_KES}`)
  .max(APP_CONFIG.MAX_AMOUNT_KES, `Maximum amount is KES ${APP_CONFIG.MAX_AMOUNT_KES}`);

/**
 * Schema for resolving a scanned QR payload
 */
export const ResolveQrRequestSchema = z.object({
  rawPayload: z
    .string()
    .min(1, 'QR payload cannot be empty')
    .max(APP_CONFIG.MAX_QR_PAYLOAD_LENGTH, 'QR payload exceeds maximum size limit'),
});

export type ResolveQrRequest = z.infer<typeof ResolveQrRequestSchema>;

/**
 * Schema for initiating STK Push
 */
export const InitiatePaymentRequestSchema = z.object({
  tillNumber: TillNumberSchema,
  merchantReference: z.string().trim().min(1).max(64),
  amount: PaymentAmountSchema,
  phoneNumber: KenyaPhoneSchema.optional(), // If omitted, defaults to authenticated user's phone or mock phone
  idempotencyKey: z
    .string()
    .uuid('Idempotency key must be a valid UUID v4')
    .or(z.string().min(16).max(64)),
});

export type InitiatePaymentRequest = z.infer<typeof InitiatePaymentRequestSchema>;

/**
 * Schema for Safaricom Daraja STK Push Callback Item
 */
export const CallbackItemSchema = z.object({
  Name: z.string(),
  Value: z.union([z.string(), z.number()]).optional(),
});

/**
 * Official Safaricom Daraja Lipa Na M-Pesa Online Callback Schema
 */
export const DarajaCallbackSchema = z.object({
  Body: z.object({
    stkCallback: z.object({
      MerchantRequestID: z.string(),
      CheckoutRequestID: z.string(),
      ResultCode: z.number(),
      ResultDesc: z.string(),
      CallbackMetadata: z
        .object({
          Item: z.array(CallbackItemSchema),
        })
        .optional(),
    }),
  }),
});

export type DarajaCallbackPayload = z.infer<typeof DarajaCallbackSchema>;
