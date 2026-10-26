import { APP_CONFIG, ERROR_CODES } from '../constants';
import { ParsedMerchantQr, QrParseResult } from '../types';

export interface QrFormatAdapter {
  name: string;
  canHandle(payload: string): boolean;
  parse(payload: string): ParsedMerchantQr | null;
}

/**
 * Adapter 1: PesaPay Deep Link / Standard Scheme
 * e.g. pesapay://pay?till=123456&ref=CAMPUS01&name=Campus+Kiosk
 */
export const PesaPaySchemeAdapter: QrFormatAdapter = {
  name: 'PESAPAY_DEEP_LINK',
  canHandle(payload: string) {
    return payload.startsWith('pesapay://pay?') || payload.startsWith('campuspay://pay?');
  },
  parse(payload: string): ParsedMerchantQr | null {
    try {
      const url = new URL(payload);
      const tillNumber = url.searchParams.get('till') || url.searchParams.get('tillNumber');
      if (!tillNumber || !/^[0-9]{3,10}$/.test(tillNumber)) {
        return null;
      }
      return {
        format: 'PESAPAY_DEEP_LINK',
        tillNumber,
        merchantReference: url.searchParams.get('ref') || `REF_${tillNumber}`,
        merchantDisplayNameIfTrusted: url.searchParams.get('name') || undefined,
        rawPayload: payload,
      };
    } catch {
      return null;
    }
  },
};

/**
 * Adapter 2: Safaricom JSON Format
 * e.g. {"type":"TILL","tillNumber":"123456","name":"Campus Kiosk"}
 * or {"service":"LIPA_NA_MPESA","till":"123456"}
 */
export const SafaricomJsonAdapter: QrFormatAdapter = {
  name: 'SAFARICOM_JSON',
  canHandle(payload: string) {
    const trimmed = payload.trim();
    return trimmed.startsWith('{') && trimmed.endsWith('}');
  },
  parse(payload: string): ParsedMerchantQr | null {
    try {
      const parsed = JSON.parse(payload);
      if (typeof parsed !== 'object' || parsed === null) return null;

      // Extract till number from common field conventions
      const tillNumber =
        parsed.tillNumber ||
        parsed.till ||
        parsed.TillNumber ||
        parsed.TillNo ||
        (parsed.type === 'TILL' ? parsed.number : null);

      if (!tillNumber || !/^[0-9]{3,10}$/.test(String(tillNumber))) {
        return null;
      }

      return {
        format: 'SAFARICOM_JSON',
        tillNumber: String(tillNumber),
        merchantReference: parsed.ref || parsed.reference || `TILL_${tillNumber}`,
        merchantDisplayNameIfTrusted: parsed.name || parsed.merchantName || undefined,
        rawPayload: payload,
      };
    } catch {
      return null;
    }
  },
};

/**
 * Adapter 3: Safaricom Text / POS Format
 * e.g. "MPESA:TILL:123456" or "TILL:123456" or "BG:123456"
 */
export const SafaricomTextAdapter: QrFormatAdapter = {
  name: 'SAFARICOM_TEXT_TILL',
  canHandle(payload: string) {
    const upper = payload.trim().toUpperCase();
    return (
      upper.startsWith('MPESA:TILL:') ||
      upper.startsWith('TILL:') ||
      upper.startsWith('BG:')
    );
  },
  parse(payload: string): ParsedMerchantQr | null {
    const trimmed = payload.trim();
    const parts = trimmed.split(':');
    const candidate = parts[parts.length - 1]?.trim();
    if (candidate && /^[0-9]{3,10}$/.test(candidate)) {
      return {
        format: 'SAFARICOM_TEXT_TILL',
        tillNumber: candidate,
        merchantReference: `TILL_${candidate}`,
        rawPayload: payload,
      };
    }
    return null;
  },
};

/**
 * Adapter 4: Development Raw Till Identifier
 * Allows entering/scanning pure Till numbers like "123456" during development & mock testing.
 */
export const DevMockTillAdapter: QrFormatAdapter = {
  name: 'DEV_MOCK_TILL',
  canHandle(payload: string) {
    const trimmed = payload.trim();
    return /^[0-9]{5,7}$/.test(trimmed);
  },
  parse(payload: string): ParsedMerchantQr | null {
    const tillNumber = payload.trim();
    return {
      format: 'DEV_MOCK_TILL',
      tillNumber,
      merchantReference: `TILL_${tillNumber}`,
      rawPayload: payload,
    };
  },
};

/**
 * Active Registered Adapters
 */
const REGISTERED_ADAPTERS: QrFormatAdapter[] = [
  PesaPaySchemeAdapter,
  SafaricomJsonAdapter,
  SafaricomTextAdapter,
  DevMockTillAdapter,
];

/**
 * Main QR parsing and validation function.
 * Strictly verifies structure, filters out arbitrary URLs and exploits,
 * and extracts standard merchant references for backend verification.
 */
export function parseMerchantQr(rawPayload: string): QrParseResult {
  if (!rawPayload || typeof rawPayload !== 'string') {
    return {
      isValid: false,
      errorCode: ERROR_CODES.INVALID_QR_PAYLOAD,
      errorMessage: 'QR payload is empty or invalid.',
    };
  }

  const payload = rawPayload.trim();

  // Enforce payload length limit
  if (payload.length > APP_CONFIG.MAX_QR_PAYLOAD_LENGTH) {
    return {
      isValid: false,
      errorCode: ERROR_CODES.INVALID_QR_PAYLOAD,
      errorMessage: 'QR code size exceeds maximum allowable limit.',
    };
  }

  // Security check: reject executable or script contents
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /data:text\/html/i,
    /vbscript:/i,
    /onload=/i,
  ];
  if (dangerousPatterns.some((pattern) => pattern.test(payload))) {
    return {
      isValid: false,
      errorCode: ERROR_CODES.UNSUPPORTED_QR,
      errorMessage: 'Suspicious or hazardous payload detected.',
    };
  }

  // Security check: Reject generic arbitrary web URLs that are not PesaPay schemes
  if (/^https?:\/\//i.test(payload)) {
    return {
      isValid: false,
      errorCode: ERROR_CODES.UNSUPPORTED_QR,
      errorMessage: 'Direct web URLs are not supported for merchant payments.',
    };
  }

  // Iterate over registered adapters
  for (const adapter of REGISTERED_ADAPTERS) {
    if (adapter.canHandle(payload)) {
      const result = adapter.parse(payload);
      if (result) {
        return {
          isValid: true,
          data: result,
        };
      }
    }
  }

  return {
    isValid: false,
    errorCode: ERROR_CODES.UNSUPPORTED_QR,
    errorMessage: 'This QR code is not recognized as a supported Safaricom Till or PesaPay merchant code.',
  };
}
