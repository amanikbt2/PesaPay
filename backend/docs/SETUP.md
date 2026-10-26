# PesaPay — Local Setup & Development Guide

## Prerequisites
- **Node.js**: `v20.x` or higher (verified with Node.js v24)
- **npm**: `v10.x` or higher
- **Android Device or Emulator**: For testing camera scanning and mobile UI
- **Expo Go App** (optional): Installed on physical phone from Google Play Store

---

## 1. Quick Start (Zero to Running in 3 Minutes)

### Step 1: Install Dependencies
From the repository root:
```bash
npm install
```

### Step 2: Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default configuration runs in **Mock Payment Mode** (`PAYMENT_PROVIDER=mock`) with an embedded SQLite database (`DATABASE_URL="file:./dev.db"`), requiring zero external database installations for instant development.

### Step 3: Initialize Database & Seed Merchants
```bash
npm run db:push
npm run db:seed
```
This generates the Prisma client, pushes schema tables, and populates verified test merchants:
- **Campus Kiosk** (Till: `123456`)
- **Science Cafeteria** (Till: `567890`)
- **Student Bookshop** (Till: `882211`)
- **Unverified Shop** (Till: `999000` — for rejection testing)
- **Suspended Canteen** (Till: `999111` — for suspension testing)

### Step 4: Run Automated Tests
```bash
npm test
```
Executes shared QR parser tests and full backend API integration tests (idempotency, callback deduplication, amount limits, merchant resolution).

### Step 5: Start the Backend Server
```bash
npm run dev:api
```
Server starts on `http://localhost:4000`. Test health endpoints:
- Health: `http://localhost:4000/api/v1/health`
- Connectivity: `http://localhost:4000/api/v1/connectivity`

### Step 6: Start the Mobile App
In a separate terminal:
```bash
npm run dev:mobile
```
Press `a` in the Expo terminal to open on an Android emulator, or scan the terminal QR code using **Expo Go** on a physical Android phone.

---

## 2. Testing on Physical Android Phones (LAN Configuration)

When running on a physical Android phone over local Wi-Fi, `localhost` points to the phone itself rather than your computer.

1. Find your computer's local Wi-Fi IP address:
   - **Windows**: Run `ipconfig` (e.g. `192.168.1.105`)
   - **macOS/Linux**: Run `ifconfig` or `ip a`
2. Update `.env`:
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.105:4000/api/v1
   ```
3. Restart Expo:
   ```bash
   npm run dev:mobile -c
   ```
4. Ensure your phone and development machine are connected to the same Wi-Fi network.

---

## 3. Switching to PostgreSQL for Production

To switch from SQLite to PostgreSQL:
1. In `apps/api/prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. In `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/pesapay?schema=public"
   ```
3. Run migrations:
   ```bash
   npx prisma migrate dev --name init
   ```
