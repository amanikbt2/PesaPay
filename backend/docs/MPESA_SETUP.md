# Safaricom Daraja M-Pesa Setup Guide

PesaPay integrates with Safaricom Daraja API for Lipa Na M-Pesa Online (STK Push).

---

## 1. Safaricom Developer Portal Setup

1. Register an account on [Safaricom Daraja Developer Portal](https://developer.safaricom.co.ke/).
2. Create an App under **My Apps**:
   - Give it a name (e.g. `PesaPay Development`).
   - Check **Lipa Na M-Pesa Sandbox**.
3. Note your generated **Consumer Key** and **Consumer Secret**.

---

## 2. Sandbox Configuration

In `.env`, set:
```env
PAYMENT_PROVIDER=daraja
MPESA_ENVIRONMENT=sandbox
MPESA_CONSUMER_KEY=your_sandbox_consumer_key
MPESA_CONSUMER_SECRET=your_sandbox_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
MPESA_CALLBACK_URL=https://your-domain.ngrok-free.app/api/v1/payments/mpesa/callback
```

> **Note on Callback URLs in Local Development:**
> Safaricom cannot reach `localhost`. You must expose your local server using a secure HTTPS tunnel such as `ngrok`:
> ```bash
> ngrok http 4000
> ```
> Then set `MPESA_CALLBACK_URL` to your ngrok URL with `/api/v1/payments/mpesa/callback`.

---

## 3. Production Readiness Requirements

To transition to production Safaricom Daraja:
1. Apply for a production Daraja app on the Safaricom portal.
2. Complete Go-Live requirements (Business Till or Paybill ownership verification, AML/KYC documentation).
3. Safaricom issues production **Shortcode** and production **Passkey**.
4. In `.env`:
   ```env
   PAYMENT_PROVIDER=daraja
   MPESA_ENVIRONMENT=production
   MPESA_CONSUMER_KEY=production_consumer_key
   MPESA_CONSUMER_SECRET=production_consumer_secret
   MPESA_SHORTCODE=your_production_till_or_shortcode
   MPESA_PASSKEY=your_production_passkey
   MPESA_CALLBACK_URL=https://api.yourdomain.com/api/v1/payments/mpesa/callback
   ```
5. Deploy API to a production server with TLS/SSL certificate.
