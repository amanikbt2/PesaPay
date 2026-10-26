# PesaPay — API Reference

Base URL: `/api/v1`

All responses follow a consistent envelope:
```json
{
  "success": true,
  "data": {},
  "error": null,
  "requestId": "req_84f93b1c90",
  "timestamp": "2026-10-25T08:30:00.000Z"
}
```

---

## 1. System & Reachability

### `GET /health`
Returns basic service health.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "service": "pesapay-api",
    "environment": "development"
  }
}
```

### `GET /connectivity`
Used by the mobile client at scan time to test bidirectional connectivity before processing QR codes.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "providerMode": "mock",
    "darajaConfigured": false,
    "serverTime": "2026-10-25T08:30:00.000Z"
  }
}
```

---

## 2. Authentication

### `POST /auth/session`
Bootstraps or resumes an anonymous/student session and issues a signed JWT access token.

**Request Body:**
```json
{
  "phoneNumber": "254712345678",
  "displayName": "Campus Student"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "usr_91b72a",
    "token": "eyJhbGciOi..."
  }
}
```

---

## 3. Merchant Resolution

### `POST /merchants/resolve-qr`
*Protected: requires `Authorization: Bearer <token>`*

Resolves and verifies merchant from raw QR string.

**Request Body:**
```json
{
  "rawPayload": "pesapay://pay?till=123456&ref=CAMPUS_KIOSK"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "merchant-campus-kiosk-001",
    "displayName": "Campus Kiosk",
    "merchantReference": "CAMPUS_KIOSK",
    "tillNumber": "123456",
    "verificationStatus": "VERIFIED",
    "enabled": true
  }
}
```

**Errors:**
- `400 Bad Request`: `UNSUPPORTED_QR`
- `403 Forbidden`: `MERCHANT_DISABLED` (Merchant suspended)
- `404 Not Found`: `MERCHANT_NOT_FOUND` (Till not in database)

---

## 4. Payment Processing

### `POST /payments/stk-push`
*Protected: requires `Authorization: Bearer <token>`*
*Rate limited: 10 requests / min / IP*

Initiates an M-Pesa STK Push. Enforces client-generated `idempotencyKey`.

**Request Body:**
```json
{
  "tillNumber": "123456",
  "merchantReference": "CAMPUS_KIOSK",
  "amount": 150,
  "phoneNumber": "254712345678",
  "idempotencyKey": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "pay_5f8a2b1c",
    "merchantId": "merchant-campus-kiosk-001",
    "merchantName": "Campus Kiosk",
    "tillNumber": "123456",
    "amount": 150,
    "amountMinor": 15000,
    "currency": "KES",
    "status": "STK_SENT",
    "idempotencyKey": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "checkoutRequestId": "ws_CO_MOCK_12345",
    "initiatedAt": "2026-10-25T08:30:00.000Z"
  }
}
```

### `GET /payments/:paymentId`
*Protected: requires `Authorization: Bearer <token>`*

Polls status of an existing transaction. Only accessible by the initiating user.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "pay_5f8a2b1c",
    "status": "SUCCEEDED",
    "receiptNumber": "NLJ7RT61SV",
    "amount": 150,
    "merchantName": "Campus Kiosk",
    "completedAt": "2026-10-25T08:30:15.000Z"
  }
}
```

---

## 5. Webhooks & Callbacks

### `POST /payments/mpesa/callback`
Public HTTPS endpoint called by Safaricom Daraja IPN upon customer PIN entry.

**Response (200 OK):**
```json
{
  "ResultCode": 0,
  "ResultDesc": "Success"
}
```
Duplicate callback deliveries are acknowledged idempotently without double-crediting.
