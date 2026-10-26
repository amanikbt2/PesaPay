import { prisma } from '../db';
import { parseMerchantQr, ERROR_CODES, MerchantDTO } from '../shared';
import { logger } from '../utils/logger';

export class MerchantService {
  async resolveAndVerifyMerchant(rawPayload: string): Promise<MerchantDTO> {
    // 1. Strict parsing and format validation
    const qrResult = parseMerchantQr(rawPayload);
    if (!qrResult.isValid || !qrResult.data) {
      throw {
        code: qrResult.errorCode || ERROR_CODES.UNSUPPORTED_QR,
        message: qrResult.errorMessage || 'Invalid or unsupported QR code.',
        statusCode: 400,
      };
    }

    const { tillNumber, merchantReference } = qrResult.data;

    logger.info(`Resolving merchant from QR: Till ${tillNumber}, Reference ${merchantReference || 'none'}`);

    // 2. Query merchant from trusted database
    // Clients can never dictate merchant legitimacy solely from QR payload
    let merchant = await prisma.merchant.findFirst({
      where: {
        OR: [
          { tillNumber },
          ...(merchantReference ? [{ merchantReference }] : []),
        ],
      },
    });

    if (!merchant) {
      logger.warn(`Merchant verification failed: No merchant registered for Till ${tillNumber}`);
      throw {
        code: ERROR_CODES.MERCHANT_NOT_FOUND,
        message: 'This merchant is not registered on PesaPay. Please verify the Till number with the merchant.',
        statusCode: 404,
      };
    }

    // 3. Enforce active enabled status
    if (!merchant.enabled) {
      logger.warn(`Merchant ${merchant.displayName} (${merchant.tillNumber}) is disabled.`);
      throw {
        code: ERROR_CODES.MERCHANT_DISABLED,
        message: 'This merchant account is currently disabled or suspended.',
        statusCode: 403,
      };
    }

    // 4. Enforce verification status
    if (merchant.verificationStatus !== 'VERIFIED') {
      logger.warn(`Merchant ${merchant.displayName} (${merchant.tillNumber}) is not verified (${merchant.verificationStatus}).`);
      throw {
        code: ERROR_CODES.MERCHANT_NOT_FOUND,
        message: 'Merchant verification is pending or unverified. Payment cannot proceed.',
        statusCode: 403,
      };
    }

    return {
      id: merchant.id,
      displayName: merchant.displayName,
      merchantReference: merchant.merchantReference,
      tillNumber: merchant.tillNumber,
      verificationStatus: merchant.verificationStatus as any,
      enabled: merchant.enabled,
    };
  }

  async getMerchantById(id: string): Promise<MerchantDTO | null> {
    const merchant = await prisma.merchant.findUnique({ where: { id } });
    if (!merchant) return null;
    return {
      id: merchant.id,
      displayName: merchant.displayName,
      merchantReference: merchant.merchantReference,
      tillNumber: merchant.tillNumber,
      verificationStatus: merchant.verificationStatus as any,
      enabled: merchant.enabled,
    };
  }
}

export const merchantService = new MerchantService();
