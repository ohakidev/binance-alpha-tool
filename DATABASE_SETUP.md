# 🚀 Database & API Integration Setup

## ✅ เสร็จสิ้นแล้ว

### 1. Database Setup (Supabase + Prisma)

**Installed:**

- ✅ Prisma ORM
- ✅ Supabase Client
- ✅ PostgreSQL Database Schema

**Models Created:**

- `User` - ข้อมูลผู้ใช้และ wallet
- `Airdrop` - ข้อมูล airdrops
- `UserAirdrop` - ความสัมพันธ์ระหว่างผู้ใช้และ airdrops
- `Alert` - การแจ้งเตือน
- `StabilityScore` - คะแนนความมั่นคง
- `IncomeEntry` - บันทึกรายได้

### 2. Web3 API Integration (Moralis)

**Features:**

- ✅ Wallet token balance tracking
- ✅ NFT ownership verification
- ✅ Transaction history
- ✅ Airdrop eligibility checker

### 3. Telegram Notifications

**Alerts:**

- ✅ New airdrop announcements
- ✅ Snapshot reminders
- ✅ Claimable notifications
- ✅ Price alerts
- ✅ Stability warnings

### 4. Airdrop Calculator

**Capabilities:**

- ✅ คำนวณคะแนนความน่าสนใจ (0-100)
- ✅ ตรวจสอบ eligibility ผ่าน Moralis
- ✅ อัพเดทสถานะอัตโนมัติ
- ✅ ส่งการแจ้งเตือนผ่าน Telegram

---

## 📋 Setup Instructions

### 1. Environment Variables

สร้างไฟล์ `.env` และเพิ่มค่าต่อไปนี้:

```bash
# Database (Supabase)
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Moralis Web3 API
MORALIS_API_KEY="your-moralis-api-key"

# Telegram Bot
TELEGRAM_BOT_TOKEN="your-telegram-bot-token"
TELEGRAM_CHAT_ID="your-telegram-chat-id"

# Cron Job Security
CRON_SECRET="your-random-secret-key"

# Binance API (Optional)
BINANCE_API_KEY="your-binance-api-key"
BINANCE_API_SECRET="your-binance-api-secret"
```

### 2. Database Setup

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Seed sample data
npm run db:seed

# Open Prisma Studio (GUI)
npm run db:studio
```

### 3. Get API Keys

#### Supabase:

1. ไปที่ https://supabase.com
2. สร้าง project ใหม่
3. คัดลอก `Project URL` และ `anon key` จาก Settings > API

#### Moralis:

1. ไปที่ https://moralis.io
2. สร้าง account และ project
3. คัดลอก API key จาก Dashboard

#### Telegram Bot:

1. ค้นหา `@BotFather` ใน Telegram
2. ส่ง `/newbot` และตั้งชื่อ bot
3. คัดลอก `Token` ที่ได้รับ
4. เริ่มแชทกับ bot ของคุณ
5. ไปที่ `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
6. คัดลอก `chat.id` จาก response

---

## 🔄 API Endpoints

### Airdrops

**GET** `/api/binance/alpha/airdrops`

- Query params: `status`, `chain`, `limit`
- Returns: รายการ airdrops พร้อมคะแนน

**POST** `/api/binance/alpha/airdrops`

- Body: Airdrop data
- Creates: Airdrop ใหม่และส่งการแจ้งเตือน

### Cron Jobs

**GET** `/api/cron/update-airdrops?secret=YOUR_SECRET`

- Updates: สถานะ airdrops ทั้งหมด
- Sends: การแจ้งเตือนอัตโนมัติ

---

## 🤖 Automatic Updates

### Vercel Cron (Recommended)

เพิ่มใน `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/update-airdrops?secret=YOUR_SECRET",
      "schedule": "0 * * * *"
    }
  ]
}
```

### External Cron Service

ใช้ service เช่น:

- cron-job.org
- EasyCron
- GitHub Actions

Schedule: `0 * * * *` (ทุกชั่วโมง)
URL: `https://your-domain.com/api/cron/update-airdrops?secret=YOUR_SECRET`

---

## 📊 Database Schema

### Airdrop Statuses:

- `UPCOMING` - กำลังจะมาถึง
- `SNAPSHOT` - ระหว่าง snapshot
- `CLAIMABLE` - สามารถ claim ได้
- `ENDED` - สิ้นสุดแล้ว
- `CANCELLED` - ยกเลิก

### Alert Types:

- `AIRDROP_NEW` - Airdrop ใหม่
- `AIRDROP_SNAPSHOT` - Snapshot reminder
- `AIRDROP_CLAIMABLE` - พร้อม claim
- `AIRDROP_ENDING` - ใกล้สิ้นสุด
- `PRICE_ALERT` - ราคาผ่าน threshold
- `STABILITY_WARNING` - คำเตือนความมั่นคง

---

## 🎯 Usage Examples

### 1. สร้าง Airdrop ใหม่

```typescript
const response = await fetch("/api/binance/alpha/airdrops", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Example Airdrop",
    symbol: "EXP",
    chain: "Ethereum",
    description: "Example airdrop description",
    eligibility: ["NFT Holder", "Early User"],
    requirements: ["Hold NFT", "Make 5 transactions"],
    snapshotDate: "2025-02-01",
    claimStartDate: "2025-02-15",
    claimEndDate: "2025-05-15",
    estimatedValue: 500,
    websiteUrl: "https://example.com",
    twitterUrl: "https://twitter.com/example",
  }),
});
```

### 2. ตรวจสอบ Eligibility

```typescript
import { moralisClient } from "@/lib/api/moralis-client";

const eligibility = await moralisClient.checkAirdropEligibility(
  "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
);

console.log(eligibility);
// {
//   hasNFTs: true,
//   tokenCount: 5,
//   transactionCount: 150,
//   isActive: true
// }
```

### 3. ส่งการแจ้งเตือน Telegram

```typescript
import { telegramService } from "@/lib/services/telegram";

await telegramService.sendAirdropAlert({
  name: "Example Airdrop",
  symbol: "EXP",
  chain: "Ethereum",
  status: "CLAIMABLE",
  estimatedValue: 500,
});
```

---

## 🔍 Troubleshooting

### Prisma Client Not Generated

```bash
npm run db:generate
```

### Database Connection Error

- ตรวจสอบ `DATABASE_URL` ใน `.env`
- ตรวจสอบว่า Supabase project ทำงานอยู่

### Telegram Not Sending

- ตรวจสอบ `TELEGRAM_BOT_TOKEN` และ `TELEGRAM_CHAT_ID`
- แน่ใจว่าคุณได้เริ่มแชทกับ bot แล้ว

### Moralis API Error

- ตรวจสอบ `MORALIS_API_KEY`
- ตรวจสอบ rate limit (free tier: 40,000 requests/month)

---

## ✅ Next Steps

1. ✅ Setup database (Supabase)
2. ✅ Configure environment variables
3. ✅ Run migrations and seed data
4. ✅ Test API endpoints
5. ⏳ Setup Telegram bot
6. ⏳ Configure cron jobs
7. ⏳ Deploy to production

---

## 📚 Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Moralis Documentation](https://docs.moralis.io)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
