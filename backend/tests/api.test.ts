import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/db';
import { v4 as uuidv4 } from 'uuid';

describe('PesaPay Backend API Integration Tests', () => {
  const testUserId = 'dev-student-user-001';
  let testSessionToken: string;

  before(async () => {
    // Seed essential user and merchants in test database
    await prisma.user.upsert({
      where: { id: testUserId },
      update: {},
      create: {
        id: testUserId,
        displayName: 'Test Student',
        phoneNumber: '254712345678',
      },
    });

    await prisma.merchant.upsert({
      where: { merchantReference: 'CAMPUS_KIOSK' },
      update: {},
      create: {
        id: 'test-kiosk-001',
        displayName: 'Campus Kiosk',
        merchantReference: 'CAMPUS_KIOSK',
        tillNumber: '123456',
        verificationStatus: 'VERIFIED',
        enabled: true,
      },
    });

    await prisma.merchant.upsert({
      where: { merchantReference: 'SUSPENDED_CANTEEN' },
      update: {},
      create: {
        id: 'test-suspended-002',
        displayName: 'Suspended Canteen',
        merchantReference: 'SUSPENDED_CANTEEN',
        tillNumber: '999111',
        verificationStatus: 'SUSPENDED',
        enabled: false,
      },
    });

    // Obtain session token
    const res = await request(app)
      .post('/api/v1/auth/session')
      .send({ phoneNumber: '254712345678', displayName: 'Test Student' });
    testSessionToken = res.body.data.token;
  });

  after(async () => {
    await prisma.$disconnect();
  });

  test('GET /api/v1/health returns healthy status', async () => {
    const res = await request(app).get('/api/v1/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'healthy');
  });

  test('GET /api/v1/connectivity returns reachability info', async () => {
    const res = await request(app).get('/api/v1/connectivity');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'ok');
  });

  test('POST /api/v1/merchants/resolve-qr resolves verified merchant (Campus Kiosk)', async () => {
    const res = await request(app)
      .post('/api/v1/merchants/resolve-qr')
      .set('Authorization', `Bearer ${testSessionToken}`)
      .send({ rawPayload: 'pesapay://pay?till=123456&ref=CAMPUS_KIOSK' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.displayName, 'Campus Kiosk');
    assert.equal(res.body.data.tillNumber, '123456');
    assert.equal(res.body.data.verificationStatus, 'VERIFIED');
  });

  test('POST /api/v1/merchants/resolve-qr rejects unknown till', async () => {
    const res = await request(app)
      .post('/api/v1/merchants/resolve-qr')
      .set('Authorization', `Bearer ${testSessionToken}`)
      .send({ rawPayload: 'pesapay://pay?till=000000&ref=UNKNOWN' });

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'MERCHANT_NOT_FOUND');
  });

  test('POST /api/v1/merchants/resolve-qr rejects disabled or suspended merchant', async () => {
    const res = await request(app)
      .post('/api/v1/merchants/resolve-qr')
      .set('Authorization', `Bearer ${testSessionToken}`)
      .send({ rawPayload: '123456' }); // will resolve to 123456

    // Test suspended
    const resSuspended = await request(app)
      .post('/api/v1/merchants/resolve-qr')
      .set('Authorization', `Bearer ${testSessionToken}`)
      .send({ rawPayload: 'pesapay://pay?till=999111&ref=SUSPENDED_CANTEEN' });

    assert.equal(resSuspended.status, 403);
    assert.equal(resSuspended.body.success, false);
  });

  test('POST /api/v1/payments/stk-push validates amount bounds', async () => {
    const key = uuidv4();
    const res = await request(app)
      .post('/api/v1/payments/stk-push')
      .set('Authorization', `Bearer ${testSessionToken}`)
      .send({
        tillNumber: '123456',
        merchantReference: 'CAMPUS_KIOSK',
        amount: -10, // Invalid negative amount
        idempotencyKey: key,
      });

    assert.equal(res.status, 422);
    assert.equal(res.body.success, false);
  });

  test('POST /api/v1/payments/stk-push initiates payment and enforces idempotency', async () => {
    const key = uuidv4();

    // First payment initiation
    const res1 = await request(app)
      .post('/api/v1/payments/stk-push')
      .set('Authorization', `Bearer ${testSessionToken}`)
      .send({
        tillNumber: '123456',
        merchantReference: 'CAMPUS_KIOSK',
        amount: 150,
        idempotencyKey: key,
      });

    assert.equal(res1.status, 201);
    assert.equal(res1.body.success, true);
    assert.equal(res1.body.data.amount, 150);
    assert.equal(res1.body.data.merchantName, 'Campus Kiosk');
    assert.equal(res1.body.data.status, 'STK_SENT');
    const paymentId = res1.body.data.id;

    // Idempotent re-submission with same key
    const res2 = await request(app)
      .post('/api/v1/payments/stk-push')
      .set('Authorization', `Bearer ${testSessionToken}`)
      .send({
        tillNumber: '123456',
        merchantReference: 'CAMPUS_KIOSK',
        amount: 150,
        idempotencyKey: key,
      });

    assert.equal(res2.status, 201);
    assert.equal(res2.body.data.id, paymentId); // Returns same payment record!

    // Conflicting re-submission with same key but different amount
    const resConflict = await request(app)
      .post('/api/v1/payments/stk-push')
      .set('Authorization', `Bearer ${testSessionToken}`)
      .send({
        tillNumber: '123456',
        merchantReference: 'CAMPUS_KIOSK',
        amount: 250, // Different amount
        idempotencyKey: key,
      });

    assert.equal(resConflict.status, 409);
    assert.equal(resConflict.body.error.code, 'IDEMPOTENCY_CONFLICT');
  });

  test('GET /api/v1/payments/:paymentId checks status securely', async () => {
    const key = uuidv4();
    const initRes = await request(app)
      .post('/api/v1/payments/stk-push')
      .set('Authorization', `Bearer ${testSessionToken}`)
      .send({
        tillNumber: '123456',
        merchantReference: 'CAMPUS_KIOSK',
        amount: 200,
        idempotencyKey: key,
      });

    const paymentId = initRes.body.data.id;

    const statusRes = await request(app)
      .get(`/api/v1/payments/${paymentId}`)
      .set('Authorization', `Bearer ${testSessionToken}`);

    assert.equal(statusRes.status, 200);
    assert.equal(statusRes.body.data.id, paymentId);
    assert.equal(statusRes.body.data.amount, 200);
  });

  test('POST /api/v1/payments/mpesa/callback processes provider callback idempotently', async () => {
    const key = uuidv4();
    const initRes = await request(app)
      .post('/api/v1/payments/stk-push')
      .set('Authorization', `Bearer ${testSessionToken}`)
      .send({
        tillNumber: '123456',
        merchantReference: 'CAMPUS_KIOSK',
        amount: 500,
        idempotencyKey: key,
      });

    const checkoutRequestId = initRes.body.data.checkoutRequestId;

    // Simulate Safaricom Daraja STK Callback
    const callbackPayload = {
      Body: {
        stkCallback: {
          MerchantRequestID: 'MR_TEST_001',
          CheckoutRequestID: checkoutRequestId,
          ResultCode: 0,
          ResultDesc: 'The service request is processed successfully.',
          CallbackMetadata: {
            Item: [
              { Name: 'Amount', Value: 500 },
              { Name: 'MpesaReceiptNumber', Value: 'NLJ7RT61SV' },
              { Name: 'TransactionDate', Value: '20261025094100' },
              { Name: 'PhoneNumber', Value: 254712345678 },
            ],
          },
        },
      },
    };

    // First callback delivery
    const cbRes1 = await request(app)
      .post('/api/v1/payments/mpesa/callback')
      .send(callbackPayload);

    assert.equal(cbRes1.status, 200);
    assert.equal(cbRes1.body.ResultCode, 0);

    // Verify payment updated to SUCCEEDED with receipt number
    const paymentRecord = await prisma.payment.findUnique({
      where: { checkoutRequestId },
    });
    assert.equal(paymentRecord?.status, 'SUCCEEDED');
    assert.equal(paymentRecord?.receiptNumber, 'NLJ7RT61SV');

    // Duplicate callback delivery (must be handled idempotently)
    const cbRes2 = await request(app)
      .post('/api/v1/payments/mpesa/callback')
      .send(callbackPayload);

    assert.equal(cbRes2.status, 200);
    assert.equal(cbRes2.body.ResultCode, 0);
  });
});
