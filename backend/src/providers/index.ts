import { IMpesaProvider } from './mpesa.interface';
import { MockMpesaProvider } from './mock.provider';
import { DarajaMpesaProvider } from './daraja.provider';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let providerInstance: IMpesaProvider | null = null;

export function getMpesaProvider(): IMpesaProvider {
  if (providerInstance) return providerInstance;

  if (env.PAYMENT_PROVIDER === 'daraja') {
    logger.info('Initializing Safaricom Daraja M-Pesa Provider (REAL/SANDBOX DARAJA)');
    providerInstance = new DarajaMpesaProvider();
  } else {
    logger.info('Initializing PesaPay Mock M-Pesa Provider (MOCK MODE: No real funds moved)');
    providerInstance = new MockMpesaProvider();
  }

  return providerInstance;
}

export * from './mpesa.interface';
export * from './mock.provider';
export * from './daraja.provider';
