# Salnaj Backend — Setup Guide

## Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+

## Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your actual credentials
```

### 3. Generate Prisma Client
```bash
npm run db:generate
```

### 4. Run Migrations (creates all tables)
```bash
npm run db:migrate
```

### 5. Seed Database (data plans + config)
```bash
npx ts-node src/utils/seed.ts
```

### 6. Start Development Server
```bash
npm run dev
```

## API Base URL
```
http://localhost:5000/api
```

## Key Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Login |
| GET  | /api/auth/me | Current user |
| GET  | /api/wallet/balance | Wallet balance |
| POST | /api/wallet/fund/initiate | Start Paystack payment |
| GET  | /api/data/plans/:network | Get data plans |
| GET  | /api/data/smart-buy?budget=1000 | Smart Buy |
| POST | /api/data/purchase | Buy data |
| POST | /api/airtime/purchase | Buy airtime |
| POST | /api/electricity/verify | Verify meter |
| POST | /api/electricity/purchase | Pay electricity |
| POST | /api/cable/verify | Verify decoder |
| POST | /api/cable/purchase | Pay cable TV |
| POST | /api/education/purchase | Buy WAEC/NECO pins |
| POST | /api/betting/fund | Fund betting wallet |
| GET  | /api/transactions | Transaction history |
| POST | /api/webhooks/paystack | Paystack webhook |

## ⚠️ Important: VTPass Provider Codes
Update `src/utils/seed.ts` with your actual VTPass variation codes.
Get them from: https://vtpass.com/api/service-variations?serviceID=mtn-data

## Architecture Notes
- All wallet operations are atomic (PostgreSQL transactions)
- Failed transactions auto-reverse wallet balance
- Redis caches: balances (60s), data plans (6h), sessions
- Rate limits: 10 auth attempts/15min, 20 transactions/minute
- Paystack webhooks verified by signature before processing
