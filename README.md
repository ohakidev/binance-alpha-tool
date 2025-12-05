# 🚀 Binance Alpha Tool

> Professional Binance Alpha tracking tool with airdrop management, stability analysis, BNB calculator, and income calendar

[English](#english) | [ภาษาไทย](#ภาษาไทย)

---

## English

### 📖 Overview

A comprehensive web application for tracking and analyzing Binance Alpha projects. Features include real-time stability monitoring, airdrop management with CRUD operations, BNB allocation calculator, income tracking calendar, and professional data visualization with premium gold & black UI design.

**Documentation**: [ARCHITECTURE.md](./ARCHITECTURE.md) | [SETUP.md](./SETUP.md) | [DEPLOYMENT.md](./DEPLOYMENT.md)

### ✨ Key Features

#### 🏠 Home Dashboard
- **Unified Airdrop Table** - View all airdrops with status, chain, multiplier
- **Premium Gold & Black Theme** - Professional UI design
- **Countdown Timers** - Track snapshot, claim, and listing dates
- **Loading Skeletons** - Smooth loading experience

#### 📈 Stability Dashboard (`/stability`)
- **Real-time monitoring** of Binance Alpha projects (10-second auto-refresh)
- **4x multiplier filtering** - Focus on BLUM, MAJOR, SEED, TOMARKET, PLUTO, CATS, DOGS
- **KOGE baseline reference** (1x multiplier) for comparison
- **Comprehensive stability criteria**:
  - Price range analysis
  - Volume swing detection
  - Abnormal spike monitoring
  - Short-term trend analysis
  - **Spread bps indicator** (🟢🟢 for optimal stability)
- Professional TanStack table with sorting, filtering, and search
- Color-coded risk levels (Safe/Moderate/High)

#### 🧮 BNB Calculator (`/calculator`)
- **Dual input system** - Slider OR direct text input with real-time sync
- **Daily Volume Tracker** - Track transaction history
- **Points calculation** - Points per day/week, max allocations
- **Profit Strategy** - Net profit calculations for 15/30 day periods
- Calculate allocation with oversubscription multiplier
- Estimate get amount, cost, and USD value

#### 📅 Income Calendar (`/calendar`)
- **Daily income tracking** - Add/edit/delete entries
- **Multi-user support** - Manage multiple accounts
- **Statistics dashboard** - Total income, monthly stats
- **Category support** - Airdrop, Trading, Staking, Other
- **Visual calendar** - See income by date with color coding

#### ⚙️ Settings (`/settings`)
- **Theme system**: Dark / Light / Auto (follows system preference)
- **Language support**: English / Thai (full i18n)
- **API Keys management**: Binance API configuration
- **Telegram integration**: Bot token and chat ID setup
- **Data management**: Export/Import/Reset functionality
- All settings persist to localStorage

#### 🎨 Professional UI/UX
- **Premium Gold & Black design** inspired by luxury aesthetics
- **Glassmorphism effects** with backdrop blur
- **Smooth animations** with Framer Motion
- **Responsive design** - Mobile-first approach
- **Animated backgrounds** with gradient mesh effects

### 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript (Strict Mode) |
| **Database** | Prisma 7 + SQLite (PostgreSQL ready) |
| **UI Components** | shadcn/ui + Radix UI |
| **Styling** | TailwindCSS 4 |
| **Animations** | Framer Motion |
| **Data Tables** | TanStack Table v8 |
| **State Management** | Zustand 5 (with persistence) |
| **Data Fetching** | TanStack Query (React Query) |
| **Validation** | Zod 4 |
| **Testing** | Vitest + Testing Library |
| **Charts** | Recharts |

### 🚀 Quick Start

#### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm

#### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/binance-alpha-tool.git
cd binance-alpha-tool

# Install dependencies
pnpm install
# or
npm install

# Setup database
pnpm db:generate
pnpm db:push

# Create environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run development server
pnpm dev
```

Visit **http://localhost:3000**

#### Environment Variables

Create `.env.local`:

```env
# Database
DATABASE_URL="file:./dev.db"

# Admin Key for API operations
ADMIN_KEY="your-secure-admin-key-here"

# App URL (for production)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Telegram (Optional)
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_CHAT_ID="your-chat-id"
TELEGRAM_LANGUAGE="th"
```

### 📚 API Documentation

#### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/airdrops` | List all airdrops |
| `GET` | `/api/airdrops/[id]` | Get single airdrop |
| `GET` | `/api/airdrops/export` | Export to JSON |
| `GET` | `/api/alpha/live` | Live airdrop data from API |
| `GET` | `/api/alpha/schedule` | Today & upcoming airdrops |
| `GET` | `/api/alpha/today` | Today's airdrops (alias) |
| `GET` | `/api/alpha/upcoming` | Upcoming airdrops (alias) |
| `POST` | `/api/alpha/sync` | Sync data from Binance Alpha |
| `GET` | `/api/binance/alpha/projects` | Binance Alpha projects |
| `GET` | `/api/binance/alpha/stability` | Stability data |

#### Admin Endpoints (require `x-admin-key` header)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/airdrops` | Create airdrop |
| `PUT` | `/api/airdrops/[id]` | Update airdrop |
| `DELETE` | `/api/airdrops/[id]` | Delete airdrop |
| `POST` | `/api/airdrops/import` | Import from JSON |

#### Example: Create Airdrop

```bash
curl -X POST http://localhost:3000/api/airdrops \
  -H "Content-Type: application/json" \
  -H "x-admin-key: your-admin-key" \
  -d '{
    "token": "BLUM",
    "name": "Blum",
    "chain": "BSC",
    "multiplier": 4,
    "status": "UPCOMING"
  }'
```

### 🔄 Data Management

#### Export Database to Backup

```bash
pnpm db:export
# Creates: data/backups/airdrop-backup-YYYY-MM-DD.json
```

#### Import Backup to Database

```bash
# Import latest backup
pnpm db:import

# Import specific backup
pnpm db:import airdrop-backup-2025-10-04.json
```

#### List All Backups

```bash
pnpm db:list-backups
```

**Features:**
- ✅ Smart duplicate check (by token)
- ✅ Version control with date-based filenames
- ✅ Detailed import summary
- ✅ Auto-select latest backup

### 🗂️ Project Structure

```
binance-alpha-tool/
├── app/                      # Next.js App Router
│   ├── api/                 # API routes
│   │   ├── airdrops/       # Airdrop CRUD
│   │   ├── binance/        # Binance Alpha API
│   │   │   ├── alpha/      # stability, projects, sync
│   │   │   └── market/     # Market data
│   │   ├── cron/           # Scheduled jobs
│   │   └── telegram/       # Telegram bot
│   ├── calculator/         # BNB Calculator page
│   ├── calendar/           # Income Calendar page
│   ├── settings/           # Settings page
│   └── stability/          # Stability Dashboard
├── components/
│   ├── features/           # Feature components
│   │   ├── airdrops/       # Airdrop table & timer
│   │   ├── calculator/     # Calculator components
│   │   ├── calendar/       # Calendar components
│   │   ├── stability/      # Stability table
│   │   └── data-table/     # Advanced data table
│   ├── layout/             # Navigation & layout
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── stores/             # Zustand stores (7 stores)
│   │   ├── calculator-store.ts
│   │   ├── filter-store.ts
│   │   ├── income-store.ts
│   │   ├── language-store.ts
│   │   ├── settings-store.ts
│   │   ├── ui-store.ts
│   │   └── user-store.ts
│   ├── i18n/               # Translations (TH/EN)
│   ├── hooks/              # Custom hooks
│   ├── services/           # Business logic
│   └── db/                 # Prisma client
├── prisma/
│   └── schema.prisma       # Database schema
├── scripts/
│   ├── db-export.ts        # Export script
│   ├── db-import.ts        # Import script
│   └── db-list-backups.ts  # List backups
└── data/backups/           # Backup files
```

### 📊 Database Schema

```prisma
model Airdrop {
  id              String    @id @default(uuid())
  token           String    @unique  // BLUM, MAJOR, etc.
  name            String
  chain           String              // BSC, ETH
  multiplier      Int       @default(1)  // 1x, 2x, 4x
  isBaseline      Boolean   @default(false)
  type            AirdropType @default(AIRDROP) // TGE, PRETGE, AIRDROP

  // Dates
  snapshotDate    DateTime?
  claimStartDate  DateTime?
  claimEndDate    DateTime?
  listingDate     DateTime?

  // Points
  requiredPoints  Int?
  pointsPerDay    Int?
  deductPoints    Int?      @default(0)

  // Status
  status          AirdropStatus  // UPCOMING, SNAPSHOT, CLAIMABLE, ENDED, CANCELLED
  verified        Boolean
  isActive        Boolean

  // Metadata
  createdAt       DateTime
  updatedAt       DateTime
}

// Additional models: User, UserAirdrop, Alert, StabilityScore, IncomeEntry
```

### 🎨 UI/UX Design System

**Theme Colors:**
- **Primary**: Gold gradient (#D4A948 → #B8860B)
- **Background**: Deep black (#030305 → #0A0A0C)
- **Status**: Green (safe) / Yellow (moderate) / Red (high risk)

**Glassmorphism:**
```tsx
className="glass-card" // Backdrop blur + transparency
className="gradient-text-gold" // Gradient text
```

**Animations:**
- Fast: 150ms
- Normal: 300ms (default)
- Slow: 500ms
- None: Accessibility mode

### 🧪 Testing

```bash
# Run tests
pnpm test

# Run tests with UI
pnpm test:ui

# Coverage report
pnpm test:coverage
```

### 🚀 Deployment

#### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Set environment variables:
   - `DATABASE_URL`
   - `ADMIN_KEY`
   - `NEXT_PUBLIC_APP_URL`

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### 📝 Available Scripts

```bash
pnpm dev              # Start development server
pnpm dev:turbo        # Start with Turbopack
pnpm build            # Build for production
pnpm build:analyze    # Build with bundle analyzer
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm test             # Run tests

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Prisma Studio
pnpm db:seed          # Seed database
pnpm db:migrate       # Run migrations

# Data Management
pnpm db:export        # Export to backup
pnpm db:import        # Import from backup
pnpm db:list-backups  # List all backups
```

### 🛡️ Security

- ✅ Admin authentication via `x-admin-key` header
- ✅ Input validation with Zod schemas
- ✅ SQL injection prevention (Prisma)
- ✅ XSS prevention (React auto-escaping)
- ✅ Secure environment variables

⚠️ **Never commit `.env.local` to git!**

### 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

### 📄 License

MIT License - See [LICENSE](./LICENSE) for details.

### 🙏 Acknowledgments

- Design inspiration: Premium luxury aesthetics
- Reference projects:
  - https://bn-alpha-tool.com
  - https://new.alphabot.cm/
  - https://www.bn-alpha.site

---

## ภาษาไทย

### 📖 ภาพรวมโปรเจกต์

เครื่องมือติดตามโปรเจกต์ Binance Alpha แบบมืออาชีพ พร้อมระบบจัดการ Airdrop, วิเคราะห์ความเสถียร, เครื่องคำนวณ BNB, ปฏิทินติดตามรายได้ และ UI ธีมทอง-ดำระดับพรีเมียม

### ✨ ฟีเจอร์หลัก

#### 🏠 หน้าแรก
- **ตาราง Airdrop รวม** - ดูทุก airdrop พร้อมสถานะ, chain, multiplier
- **ธีมทอง-ดำพรีเมียม** - UI ดีไซน์ระดับมืออาชีพ
- **นับถอยหลัง** - ติดตามวัน snapshot, claim และ listing

#### 📈 แดชบอร์ดความเสถียร (`/stability`)
- **ติดตามแบบเรียลไทม์** โปรเจกต์ Binance Alpha (รีเฟรชอัตโนมัติทุก 10 วินาที)
- **กรองแค่ตัวคูณ 4 เท่า** - มุ่งเน้น BLUM, MAJOR, SEED, TOMARKET, PLUTO, CATS, DOGS
- **KOGE เป็นฐานอ้างอิง** (ตัวคูณ 1 เท่า) สำหรับเปรียบเทียบ
- **เกณฑ์ความเสถียรครบถ้วน**:
  - วิเคราะห์ช่วงราคา
  - ตรวจจับความผันผวนของปริมาณ
  - ตรวจสอบพีคผิดปกติ
  - วิเคราะห์แนวโน้มระยะสั้น
  - **ตัวบ่งชี้ Spread bps** (🟢🟢 = เสถียรที่สุด)

#### 🧮 เครื่องคำนวณ BNB (`/calculator`)
- **ระบบ 2 อินพุต** - สไลด์เดอร์หรือพิมพ์โดยตรง ซิงค์แบบเรียลไทม์
- **Daily Volume Tracker** - ติดตามประวัติธุรกรรม
- **คำนวณคะแนน** - Points per day/week, max allocations
- **กลยุทธ์กำไร** - คำนวณกำไรสุทธิช่วง 15/30 วัน

#### 📅 ปฏิทินรายได้ (`/calendar`)
- **ติดตามรายได้รายวัน** - เพิ่ม/แก้ไข/ลบ entries
- **รองรับหลายผู้ใช้** - จัดการหลายบัญชี
- **สถิติแดชบอร์ด** - รายได้รวม, สถิติรายเดือน
- **รองรับหมวดหมู่** - Airdrop, Trading, Staking, Other

#### ⚙️ การตั้งค่า (`/settings`)
- **ระบบธีม**: มืด / สว่าง / อัตโนมัติ (ตามระบบ)
- **รองรับภาษา**: อังกฤษ / ไทย (i18n เต็มรูปแบบ)
- **จัดการ API Keys**: ตั้งค่า Binance API
- **Telegram**: ตั้งค่า Bot token และ Chat ID
- **จัดการข้อมูล**: Export/Import/Reset

### 🚀 เริ่มต้นใช้งาน

```bash
# ติดตั้ง dependencies
pnpm install

# ตั้งค่าฐานข้อมูล
pnpm db:generate
pnpm db:push

# สร้าง environment variables
# แก้ไข .env.local

# รันเซิร์ฟเวอร์สำหรับพัฒนา
pnpm dev
```

เข้าใช้งานที่ **http://localhost:3000**

### 🛠️ Tech Stack

| หมวด | เทคโนโลยี |
|------|----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Database** | Prisma 7 + SQLite |
| **UI** | shadcn/ui + Radix UI |
| **Styling** | TailwindCSS 4 |
| **Animation** | Framer Motion |
| **State** | Zustand 5 + TanStack Query |
| **Validation** | Zod 4 |

### 📚 เอกสาร API

#### Endpoint สาธารณะ

| Method | Endpoint | คำอธิบาย |
|--------|----------|----------|
| `GET` | `/api/airdrops` | แสดงรายการ Airdrop ทั้งหมด |
| `GET` | `/api/airdrops/[id]` | ดูข้อมูล Airdrop เดี่ยว |
| `GET` | `/api/airdrops/export` | ส่งออกเป็น JSON |
| `GET` | `/api/binance/alpha/stability` | ข้อมูลความเสถียร |

#### Endpoint แอดมิน (ต้องการ `x-admin-key` header)

| Method | Endpoint | คำอธิบาย |
|--------|----------|----------|
| `POST` | `/api/airdrops` | สร้าง Airdrop |
| `PUT` | `/api/airdrops/[id]` | อัปเดต Airdrop |
| `DELETE` | `/api/airdrops/[id]` | ลบ Airdrop |
| `POST` | `/api/airdrops/import` | นำเข้าจาก JSON |

### 🔄 การจัดการข้อมูล

```bash
# ส่งออกฐานข้อมูลไปยังไฟล์สำรอง
pnpm db:export

# นำเข้าจากไฟล์สำรอง
pnpm db:import

# แสดงไฟล์สำรองทั้งหมด
pnpm db:list-backups
```

### 🎨 ระบบดีไซน์

- **สีธีม**: ไล่เฉดสีทอง (#D4A948 → #B8860B)
- **พื้นหลัง**: สีดำเข้ม (#030305 → #0A0A0C)
- **เอฟเฟกต์กระจก**: เบลอพื้นหลัง + ความโปร่งใส
- **แอนิเมชันลื่นไหล**: Framer Motion
- **รองรับหลายหน้าจอ**: เน้นมือถือก่อน

### 📄 ลิขสิทธิ์

MIT License - ดูรายละเอียดที่ [LICENSE](./LICENSE)

---

**Made with ❤️ for the Binance Alpha community**

**⚠️ Disclaimer**: Markets are unpredictable. Always do your own research (DYOR). This tool is for informational purposes only. No liability for trading losses.