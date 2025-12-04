# 🗄️ Database & API Setup Guide

## 📋 Overview

This guide covers database setup, schema details, and API integration for the Binance Alpha Tool.

---

## 🚀 Quick Setup

### 1. Generate Prisma Client

```bash
pnpm db:generate
```

### 2. Push Schema to Database

```bash
pnpm db:push
```

### 3. (Optional) Seed Sample Data

```bash
pnpm db:seed
```

### 4. Open Prisma Studio (GUI)

```bash
pnpm db:studio
```

---

## 🗃️ Database Configuration

### SQLite (Default - Development)

The project uses SQLite by default for simplicity:

```env
DATABASE_URL="file:./dev.db"
```

### PostgreSQL (Production)

For production, migrate to PostgreSQL:

```env
DATABASE_URL="postgresql://username:password@host:5432/database"
```

Update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Change from "sqlite"
}
```

Then regenerate:

```bash
pnpm db:generate
pnpm db:push
```

---

## 📊 Database Schema

### Core Models

#### User

```prisma
model User {
  id            String    @id @default(uuid())
  name          String
  walletAddress String?   @unique
  telegramId    String?   @unique
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  airdrops      UserAirdrop[]
  alerts        Alert[]
}
```

#### Airdrop

```prisma
model Airdrop {
  id              String    @id @default(uuid())
  token           String    @unique  // Token symbol (unique identifier)
  name            String
  chain           String              // BSC, ETH, etc.
  logoUrl         String?

  // Binance Alpha specific
  multiplier      Int       @default(1)  // 1x, 2x, 4x
  isBaseline      Boolean   @default(false)
  alphaUrl        String?

  // Airdrop details
  description     String?
  totalSupply     String?
  airdropAmount   String?
  initialPrice    Float?
  currentPrice    Float?

  // Eligibility (stored as JSON string)
  eligibility     String    @default("[]")
  requirements    String    @default("[]")

  // Dates
  snapshotDate    DateTime?
  claimStartDate  DateTime?
  claimEndDate    DateTime?
  listingDate     DateTime?

  // Points system
  requiredPoints  Int?
  pointsPerDay    Int?
  deductPoints    Int?      @default(0)

  // Type classification
  type            AirdropType @default(AIRDROP)

  // Contract information
  contractAddress String?

  // Status
  status          AirdropStatus @default(UPCOMING)
  verified        Boolean       @default(false)
  isActive        Boolean       @default(true)

  // External links
  websiteUrl      String?
  twitterUrl      String?
  discordUrl      String?
  telegramUrl     String?

  // Metadata
  estimatedValue  Float?
  participantCount Int?
  addedBy         String?
  notes           String?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  users           UserAirdrop[]
  alerts          Alert[]
}
```

#### StabilityScore

```prisma
model StabilityScore {
  id              String    @id @default(uuid())
  symbol          String

  // Metrics
  stabilityScore  Float
  riskLevel       RiskLevel
  volatilityIndex Float
  volumeScore     Float

  // Price data
  currentPrice    Float
  priceChange     Float
  high24h         Float
  low24h          Float
  volume24h       Float

  timestamp       DateTime  @default(now())
}
```

#### IncomeEntry

```prisma
model IncomeEntry {
  id          String    @id @default(uuid())
  userId      String

  // Income details
  amount      Float
  currency    String    @default("USDT")
  source      String
  category    String    // airdrop, trading, staking, other
  description String?

  // Date
  date        DateTime

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

### Enums

```prisma
enum AirdropStatus {
  UPCOMING
  SNAPSHOT
  CLAIMABLE
  ENDED
  CANCELLED
}

enum AirdropType {
  TGE       // Token Generation Event
  PRETGE    // Pre-TGE
  AIRDROP   // Standard Airdrop
}

enum RiskLevel {
  SAFE
  MODERATE
  HIGH
}

enum AlertType {
  AIRDROP_NEW
  AIRDROP_SNAPSHOT
  AIRDROP_CLAIMABLE
  AIRDROP_ENDING
  PRICE_ALERT
  STABILITY_WARNING
}
```

---

## 🔌 API Endpoints

### Public Endpoints

#### List All Airdrops

```bash
GET /api/airdrops
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "token": "BLUM",
      "name": "Blum",
      "chain": "BSC",
      "multiplier": 4,
      "status": "UPCOMING",
      "isActive": true
    }
  ]
}
```

#### Get Single Airdrop

```bash
GET /api/airdrops/[id]
```

#### Export Airdrops to JSON

```bash
GET /api/airdrops/export
```

#### Get Stability Data

```bash
GET /api/binance/alpha/stability
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "token": "KOGE",
      "name": "KOGE",
      "multiplier": 1,
      "isBaseline": true,
      "price": 0.0012,
      "stabilityScore": 65,
      "riskLevel": "MODERATE",
      "spreadBps": 45,
      "trend": "STABLE"
    }
  ],
  "timestamp": "2025-01-15T12:00:00Z"
}
```

#### Get Binance Alpha Projects

```bash
GET /api/binance/alpha/projects
```

---

### Admin Endpoints

All admin endpoints require `x-admin-key` header.

#### Create Airdrop

```bash
POST /api/airdrops
```

Headers:

```
Content-Type: application/json
x-admin-key: your-admin-key
```

Body:

```json
{
  "token": "BLUM",
  "name": "Blum",
  "chain": "BSC",
  "multiplier": 4,
  "status": "UPCOMING",
  "description": "Blum airdrop project",
  "websiteUrl": "https://blum.io",
  "snapshotDate": "2025-02-01T00:00:00Z"
}
```

#### Update Airdrop

```bash
PUT /api/airdrops/[id]
```

Headers:

```
Content-Type: application/json
x-admin-key: your-admin-key
```

Body:

```json
{
  "status": "CLAIMABLE",
  "claimStartDate": "2025-02-15T00:00:00Z"
}
```

#### Delete Airdrop

```bash
DELETE /api/airdrops/[id]
```

Headers:

```
x-admin-key: your-admin-key
```

#### Import Airdrops from JSON

```bash
POST /api/airdrops/import
```

Headers:

```
Content-Type: application/json
x-admin-key: your-admin-key
```

Body:

```json
{
  "airdrops": [
    {
      "token": "BLUM",
      "name": "Blum",
      "chain": "BSC",
      "multiplier": 4
    },
    {
      "token": "MAJOR",
      "name": "Major",
      "chain": "TON",
      "multiplier": 4
    }
  ]
}
```

---

## 🔄 Data Management Scripts

### Export Database to Backup

```bash
pnpm db:export
```

Creates: `data/backups/airdrop-backup-YYYY-MM-DD.json`

### Import from Backup

```bash
# Import latest backup
pnpm db:import

# Import specific backup
pnpm db:import airdrop-backup-2025-01-15.json
```

### List All Backups

```bash
pnpm db:list-backups
```

### Features

- ✅ **Smart Duplicate Check**: Skips existing records (by token)
- ✅ **Version Control**: Date-based filenames
- ✅ **Detailed Summary**: Shows imported/skipped/errors
- ✅ **Auto-select Latest**: No filename needed

---

## 💻 Usage Examples

### Using cURL

```bash
# List all airdrops
curl http://localhost:3000/api/airdrops

# Get stability data
curl http://localhost:3000/api/binance/alpha/stability

# Create airdrop (admin)
curl -X POST http://localhost:3000/api/airdrops \
  -H "Content-Type: application/json" \
  -H "x-admin-key: your-admin-key" \
  -d '{
    "token": "NEWTOKEN",
    "name": "New Token",
    "chain": "ETH",
    "multiplier": 2,
    "status": "UPCOMING"
  }'

# Delete airdrop (admin)
curl -X DELETE http://localhost:3000/api/airdrops/uuid-here \
  -H "x-admin-key: your-admin-key"
```

### Using TypeScript/JavaScript

```typescript
// Fetch airdrops
const response = await fetch('/api/airdrops');
const { data } = await response.json();

// Fetch stability data
const stabilityResponse = await fetch('/api/binance/alpha/stability');
const { data: stabilityData } = await stabilityResponse.json();

// Create airdrop (admin)
const createResponse = await fetch('/api/airdrops', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-admin-key': process.env.ADMIN_KEY!,
  },
  body: JSON.stringify({
    token: 'NEWTOKEN',
    name: 'New Token',
    chain: 'ETH',
    multiplier: 2,
    status: 'UPCOMING',
  }),
});
```

### Using React Query

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

// Fetch airdrops
const { data, isLoading } = useQuery({
  queryKey: ['airdrops'],
  queryFn: async () => {
    const res = await fetch('/api/airdrops');
    return res.json();
  },
});

// Fetch stability with auto-refresh
const { data: stabilityData } = useQuery({
  queryKey: ['stability'],
  queryFn: async () => {
    const res = await fetch('/api/binance/alpha/stability');
    return res.json();
  },
  refetchInterval: 10000, // 10 seconds
});
```

---

## 🔧 Database Commands Reference

```bash
# Generate Prisma Client
pnpm db:generate

# Push schema to database (dev)
pnpm db:push

# Open Prisma Studio (GUI)
pnpm db:studio

# Seed sample data
pnpm db:seed

# Run migrations (production)
pnpm db:migrate

# Export to backup
pnpm db:export

# Import from backup
pnpm db:import

# List backups
pnpm db:list-backups
```

---

## 🆘 Troubleshooting

### Prisma Client Not Found

```bash
pnpm db:generate
```

### Database Connection Error

1. Check `DATABASE_URL` in `.env.local`
2. Ensure database file exists (SQLite)
3. For PostgreSQL: verify credentials and network access

### Schema Changes Not Reflected

```bash
pnpm db:push
pnpm db:generate
```

### Import Fails

1. Check JSON format is valid
2. Ensure `token` field is unique
3. Verify backup file path

### Reset Database

```bash
rm dev.db
pnpm db:push
pnpm db:seed
```

---

## 📚 Related Documentation

- [README.md](./README.md) - Project overview
- [SETUP.md](./SETUP.md) - Development setup
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture
- [TELEGRAM_SETUP.md](./TELEGRAM_SETUP.md) - Telegram bot setup

---

**Made with ❤️ for the Binance Alpha community**