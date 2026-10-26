# PesaPay — Security Specification

## 1. M-Pesa PIN Protection Guarantee
- **Absolute Rule:** PesaPay **never** stores, logs, intercepts, transmits, or asks the user for their Safaricom M-Pesa PIN.
- The user enters their PIN only within the official Safaricom SIM Toolkit / OS overlay dialog.
- The mobile UI displays clear indicators reassuring the user that PIN entry happens exclusively on the official prompt.

---

## 2. Critical Offline Enforcement
Mobile clients operate in an untrusted environment:
- If a phone loses internet or backend access, scanning is paused.
- Scanned QR payloads are immediately discarded from memory.
- No payments are ever queued for background execution while offline.
- When connectivity resumes, previously discarded payloads are never automatically executed.

---

## 3. Server-Side Merchant Authorization
- Mobile clients are untrusted. Scanned QR codes contain claims, not proofs.
- The backend verifies Till ownership and active merchant status against database records before accepting any payment requests.
- Even if a client claims a Till is valid, the server will reject unverified or suspended Till numbers.

---

## 4. Idempotency & Financial Safety
- Every payment request generates a unique client idempotency key (UUID).
- Re-submitting an identical payment returns the existing transaction without triggering a secondary STK Push.
- Submitting the same idempotency key with conflicting parameters (e.g. different amount) yields `409 Conflict`.
- Database uniqueness constraints on `idempotencyKey` and `checkoutRequestId` ensure zero duplicate records.

---

## 5. Secret Isolation & Zero Leakage
- Daraja Consumer Keys, Consumer Secrets, and Passkeys reside strictly on the server in `.env`.
- No secrets are embedded in Expo JavaScript bundles, app manifests, or client storage.
- Backend structured logger actively redacts `PIN`, `Password`, `Passkey`, `token`, `Authorization`, and masks phone numbers.
