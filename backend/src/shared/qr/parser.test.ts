import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseMerchantQr } from './parser';
import { ERROR_CODES } from '../constants';

describe('QR Parser Security and Adapters', () => {
  test('parses PesaPay deep link correctly', () => {
    const payload = 'pesapay://pay?till=123456&ref=CAMPUS_KIOSK&name=Campus+Kiosk';
    const result = parseMerchantQr(payload);

    assert.equal(result.isValid, true);
    assert.equal(result.data?.tillNumber, '123456');
    assert.equal(result.data?.format, 'PESAPAY_DEEP_LINK');
    assert.equal(result.data?.merchantReference, 'CAMPUS_KIOSK');
  });

  test('parses Safaricom JSON payload format', () => {
    const payload = JSON.stringify({
      type: 'TILL',
      tillNumber: '567890',
      name: 'Science Cafeteria',
    });
    const result = parseMerchantQr(payload);

    assert.equal(result.isValid, true);
    assert.equal(result.data?.tillNumber, '567890');
    assert.equal(result.data?.format, 'SAFARICOM_JSON');
    assert.equal(result.data?.merchantDisplayNameIfTrusted, 'Science Cafeteria');
  });

  test('parses Safaricom text till formats (MPESA:TILL:123456)', () => {
    const payload = 'MPESA:TILL:882211';
    const result = parseMerchantQr(payload);

    assert.equal(result.isValid, true);
    assert.equal(result.data?.tillNumber, '882211');
    assert.equal(result.data?.format, 'SAFARICOM_TEXT_TILL');
  });

  test('parses raw till number in dev/mock adapter', () => {
    const payload = '123456';
    const result = parseMerchantQr(payload);

    assert.equal(result.isValid, true);
    assert.equal(result.data?.tillNumber, '123456');
    assert.equal(result.data?.format, 'DEV_MOCK_TILL');
  });

  test('rejects arbitrary external HTTP/HTTPS URLs', () => {
    const payload = 'https://malicious-phishing-site.com/pay?till=123456';
    const result = parseMerchantQr(payload);

    assert.equal(result.isValid, false);
    assert.equal(result.errorCode, ERROR_CODES.UNSUPPORTED_QR);
  });

  test('rejects malicious script payloads', () => {
    const payload = '<script>alert("pwned")</script>';
    const result = parseMerchantQr(payload);

    assert.equal(result.isValid, false);
    assert.equal(result.errorCode, ERROR_CODES.UNSUPPORTED_QR);
  });

  test('rejects payloads that exceed maximum size', () => {
    const payload = 'A'.repeat(600);
    const result = parseMerchantQr(payload);

    assert.equal(result.isValid, false);
    assert.equal(result.errorCode, ERROR_CODES.INVALID_QR_PAYLOAD);
  });

  test('rejects invalid or empty payloads', () => {
    assert.equal(parseMerchantQr('').isValid, false);
    assert.equal(parseMerchantQr('   ').isValid, false);
  });
});
