# PesaPay — System Architecture

## 1. Overview
PesaPay is an Android-first financial application for university and campus merchants, streamlining the QR-to-M-Pesa payment experience. It replaces manual USSD dialing (`*334#`) and Till number memorization with instant QR scanning, strict offline verification, server-side merchant resolution, and official Safaricom Daraja STK Push prompts.

---

## 2. Monorepo Structure

```
PesaPay/
├── apps/
│   ├── api/                  # Express + TypeScript + Prisma Backend
│   │   ├── prisma/           # Database schema, migrations, seed
│   │   ├── src/
│   │   │   ├── config/       # Environment validation (Zod)
│   │   │   ├── controllers/  # Route handlers (Merchant, Payment, Auth, Health)
│   │   │   ├── middleware/   # Auth, RateLimiter, ErrorHandler, RequestID
│   │   │   ├── providers/    # MpesaProvider (Daraja live/sandbox + Mock provider)
│   │   │   ├── routes/       # API v1 routes
│   │   │   ├── services/     # Business logic & state management
│   │   │   ├── utils/        # Logger (with credential redaction), API envelope
│   │   │   ├── app.ts        # Express application configuration
│   │   │   └── server.ts     # Server startup and graceful shutdown
│   │   └── tests/            # Automated integration tests
│   └── mobile/               # React Native + Expo Android Mobile App
│       ├── App.tsx           # Root component with SafeAreaProvider
│       └── src/
│           ├── api/          # HTTP client with session bootstrap
│           ├── components/   # UI components (ScannerFrame, MerchantSheet, etc.)
│           ├── screens/      # MainScreen (direct-to-camera launch)
│           ├── services/     # Network reachability and SecureStore
│           └── theme/        # Emerald brand palette and styling
├── packages/
│   └── shared/               # Shared TypeScript library
│       ├── src/
│       │   ├── constants/    # Theme, limits, error codes
│       │   ├── qr/           # Strict QR parser and adapters
│       │   ├── schemas/      # Zod validation schemas
│       │   └── types/        # PaymentStatus, MerchantDTO, ApiResponse
├── docs/                     # Architectural and operational documentation
├── .env.example              # Environment variables template
├── .gitignore
├── package.json              # Monorepo npm workspaces definition
└── README.md
```

---

## 3. Critical Offline Flow

```
                      +-------------------+
                      |   Camera Scans    |
                      |   QR Code Frame   |
                      +---------+---------+
                                |
                                v
                      +-------------------+
                      |   Lock Scanner    |
                      | (Suppress dups)   |
                      +---------+---------+
                                |
                                v
                    /-----------------------\
                   /   Is Device Online &    \
                  <    Backend Reachable?     >
                   \                         /
                    \-----------------------/
                       /                 \
             NO (Offline)               YES (Online)
                     /                     \
                    v                       v
      +--------------------------+   +-------------------------------+
      |    Show Offline Overlay  |   | Validate QR Format & Adapters |
      |  "You're offline. Connect|   +---------------+---------------+
      |   to internet to pay."   |                   |
      +-------------+------------+                   v
                    |                +-------------------------------+
                    v                | Request Backend Verification  |
      +--------------------------+   | POST /merchants/resolve-qr    |
      |   DISCARD QR PAYLOAD     |   +---------------+---------------+
      | (Never queue offline)    |                   |
      +-------------+------------+                   v
                    |                +-------------------------------+
                    v                | Display Verified Merchant     |
      +--------------------------+   | Sheet & Amount Input          |
      | Unlock & Reset Scanner   |   +-------------------------------+
      +--------------------------+
```

---

## 4. Payment Lifecycle State Machine

```
      +-------------+
      |   CREATED   |
      +------+------+
             |
             v
      +-------------+
      | VALIDATING  |
      +------+------+
             |
             v
      +-------------------+
      | PENDING_PROVIDER  |  --> (Provider failure) --> [ FAILED ]
      +------+------------+
             |
             v
      +-------------+
      |  STK_SENT   |  --> Customer phone receives Safaricom prompt
      +------+------+
             |
             v
      +-------------+
      | PROCESSING  |  --> Bounded client polling / status check
      +------+------+
             |
    +--------+--------+----------------+
    |                 |                |
    v                 v                v
[ SUCCEEDED ]    [ CANCELLED ]    [ EXPIRED ]
 (PIN entered     (User pressed   (Timed out)
  & confirmed)      Cancel)
```

---

## 5. Security Principles
1. **Never Request M-Pesa PIN:** User enters PIN only in the official Safaricom SIM Toolkit / prompt.
2. **Untrusted Mobile Client:** The mobile app never determines merchant validity or payment success; all financial state transitions occur authoritatively on the server.
3. **Strict Idempotency:** Duplicate payment submissions reuse existing transaction records via unique client idempotency keys.
4. **Credential Isolation:** Daraja keys and passkeys exist solely in server environment variables.
