# PesaPay

Modern, offline-resilient Campus QR Payment Application built with React Native (Expo) and Node.js/TypeScript backend.

## Features

- **Instant QR Scanning & Resolution:** Scan campus merchant till QR codes with camera or test via manual input.
- **Offline Security & Resiliency:** Discards unverified scans during network loss, with clear connectivity diagnostics.
- **M-Pesa STK Push Integration:** Secure simulation with idempotency tracking and polling status.
- **Fluid & Fully Responsive:** Dynamically adapts across mobile phones, tablets, desktop browsers, and ultra-wide displays without letterboxing.
- **Clean Aesthetic:** Frameless inputs, glowing status indicators, and modern dark-mode fintech interface.

## Tech Stack

- **Frontend:** React Native (Expo SDK 51), TypeScript, React Native Web
- **Backend:** Node.js, Express, TypeScript, tsx
- **Architecture:** Monorepo (`frontend/`, `backend/`)

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Backend API
```bash
npm run backend
```
Backend runs on `http://localhost:4000`.

### 3. Start Frontend Web
```bash
npm run web
```
Web app runs on `http://localhost:8083`.
