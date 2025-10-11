# 🚀 Binance Alpha Tool

> Professional Binance Alpha tracking tool with airdrop management, stability analysis, and BNB calculator

[English](#english) | [ภาษาไทย](#ภาษาไทย)

---

## English

### 📖 Overview

A comprehensive web application for tracking and analyzing Binance Alpha projects. Features include real-time stability monitoring, airdrop management with CRUD operations, BNB allocation calculator, and professional data visualization with game-inspired UI design.

**Live Demo**: [Coming Soon]
**Documentation**: [ARCHITECTURE.md](./ARCHITECTURE.md) | [SETUP.md](./SETUP.md)

### ✨ Key Features

#### 🎯 Stability Dashboard
- **Real-time monitoring** of Binance Alpha projects (15-second auto-refresh)
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

#### 💰 BNB Calculator
- **Dual input system** - Slider OR direct text input with real-time sync
- Calculate allocation with oversubscription multiplier
- Estimate get amount, cost, and USD value
- Locked daily transaction summary display

#### 📊 Airdrop Management System
- **Full CRUD operations** with admin authentication
- **Batch import/export** with JSON backup system
- **Smart duplicate detection** (by token)
- **Date-based versioning** for backups
- Professional data tables with advanced features:
  - Global search
  - Column sorting & visibility
  - Pagination
  - Row selection
  - CSV/JSON export

#### ⚙️ Settings & Customization
- **Theme system**: Dark / Light / Auto (follows system preference)
- **Language support**: English / Thai
- **Animation speed control**: Fast / Normal / Slow / None
- **Notification preferences**: Sound, volume, alerts
- All settings persist to localStorage

#### 🎨 Professional UI/UX
- **Game-inspired design** (Genshin Impact aesthetics)
- **Glassmorphism effects** with backdrop blur
- **Smooth animations** with Framer Motion
- **Responsive design** - Mobile-first approach
- **Gold/Cyan accents** with gradient effects

### 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript (Strict Mode) |
| **Database** | Prisma + SQLite (migration to PostgreSQL ready) |
| **UI Components** | shadcn/ui + Radix UI |
| **Styling** | TailwindCSS 4 |
| **Animations** | Framer Motion |
| **Data Tables** | TanStack Table v8 |
| **State Management** | Zustand (with persistence) |
| **Data Fetching** | TanStack Query (React Query) |
| **Validation** | Zod |
| **Testing** | Vitest + Testing Library |

### 🚀 Quick Start

#### Prerequisites
- Node.js 18+ or pnpm/npm

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
```

#### Environment Variables

Create `.env.local`:

```env
# Database
DATABASE_URL="file:./dev.db"

# Admin Key for API operations
ADMIN_KEY="your-secure-admin-key-here"

# App URL (for production)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

#### Run Development Server

```bash
pnpm dev
# or
npm run dev
```

Visit **http://localhost:3000**

### 📚 API Documentation

#### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/airdrops` | List all airdrops |
| `GET` | `/api/airdrops/[id]` | Get single airdrop |
| `GET` | `/api/airdrops/export` | Export to JSON |
| `GET` | `/api/binance/alpha/projects` | Binance Alpha projects |
| `GET` | `/api/binance/alpha/stability` | Stability data (redirects to projects) |

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
│   │   └── binance/alpha/  # Binance Alpha API
│   ├── calculator/         # BNB Calculator page
│   ├── stability/          # Stability Dashboard
│   └── settings/           # Settings page
├── components/
│   ├── features/           # Feature components
│   │   ├── calculator/     # Calculator components
│   │   ├── stability/      # Stability table
│   │   └── data-table/     # Advanced data table
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── db/                 # Prisma client
│   ├── stores/             # Zustand stores
│   └── providers/          # React providers
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

  // Dates
  snapshotDate    DateTime?
  claimStartDate  DateTime?
  claimEndDate    DateTime?
  listingDate     DateTime?

  // Points
  requiredPoints  Int?
  pointsPerDay    Int?

  // Status
  status          AirdropStatus
  verified        Boolean
  isActive        Boolean

  // Metadata
  createdAt       DateTime
  updatedAt       DateTime
}
```

### 🎨 UI/UX Design System

**Theme Colors:**
- **Primary**: Gold gradient (#FFD700 → #FFA500)
- **Secondary**: Cyan (#00CED1)
- **Background**: Deep navy (#0A0E27)
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

#### Database Migration

```bash
pnpm db:migrate
```

See [SETUP.md](./SETUP.md) for detailed deployment instructions.

### 📝 Available Scripts

```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm test             # Run tests

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Prisma Studio
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

- Design inspiration: Genshin Impact
- Reference projects:
  - https://bn-alpha-tool.com
  - https://new.alphabot.cm/
  - https://www.bn-alpha.site
  - https://github.com/gaohongxiang/bn-alpha-tool

### 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/binance-alpha-tool/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/binance-alpha-tool/discussions)

---

## ภาษาไทย

### 📖 ภาพรวมโปรเจกต์

เครื่องมือติดตามโปรเจกต์ Binance Alpha แบบมืออาชีพ พร้อมระบบจัดการ Airdrop, วิเคราะห์ความเสถียร, เครื่องคำนวณ BNB และ UI ดีไซน์แบบเกม

### ✨ ฟีเจอร์หลัก

#### 🎯 แดชบอร์ดความเสถียร
- **ติดตามแบบเรียลไทม์** โปรเจกต์ Binance Alpha (รีเฟรชอัตโนมัติทุก 15 วินาที)
- **กรองแค่ตัวคูณ 4 เท่า** - มุ่งเน้น BLUM, MAJOR, SEED, TOMARKET, PLUTO, CATS, DOGS
- **KOGE เป็นฐานอ้างอิง** (ตัวคูณ 1 เท่า) สำหรับเปรียบเทียบ
- **เกณฑ์ความเสถียรครบถ้วน**:
  - วิเคราะห์ช่วงราคา
  - ตรวจจับความผันผวนของปริมาณ
  - ตรวจสอบพีคผิดปกติ
  - วิเคราะห์แนวโน้มระยะสั้น
  - **ตัวบ่งชี้ Spread bps** (🟢🟢 = เสถียรที่สุด)

#### 💰 เครื่องคำนวณ BNB
- **ระบบ 2 อินพุต** - สไลด์เดอร์หรือพิมพ์โดยตรง ซิงค์แบบเรียลไทม์
- คำนวณการจัดสรรด้วยตัวคูณโอเวอร์ซับสคริปชัน
- ประมาณการจำนวนที่ได้รับ, ต้นทุน และมูลค่า USD

#### 📊 ระบบจัดการ Airdrop
- **CRUD ครบครัน** พร้อมการยืนยันตัวตนแอดมิน
- **นำเข้า/ส่งออกเป็นชุด** พร้อมระบบสำรองข้อมูล JSON
- **ตรวจจับข้อมูลซ้ำอัจฉริยะ** (ตามโทเคน)
- **ควบคุมเวอร์ชันตามวันที่**

#### ⚙️ การตั้งค่าและปรับแต่ง
- **ระบบธีม**: มืด / สว่าง / อัตโนมัติ (ตามระบบ)
- **รองรับภาษา**: อังกฤษ / ไทย / จีน
- **ควบคุมความเร็วแอนิเมชัน**: เร็ว / ปกติ / ช้า / ไม่มี
- **การแจ้งเตือน**: เสียง, ระดับเสียง, การแจ้งเตือน

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

### 📚 เอกสาร API

#### Endpoint สาธารณะ

| Method | Endpoint | คำอธิบาย |
|--------|----------|----------|
| `GET` | `/api/airdrops` | แสดงรายการ Airdrop ทั้งหมด |
| `GET` | `/api/airdrops/[id]` | ดูข้อมูล Airdrop เดี่ยว |
| `GET` | `/api/airdrops/export` | ส่งออกเป็น JSON |

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

- **สีธีม**: ไล่เฉดสีทอง, สีฟ้าเขียว
- **เอฟเฟกต์กระจก**: เบลอพื้นหลัง + ความโปร่งใส
- **แอนิเมชันลื่นไหล**: Framer Motion
- **รองรับหลายหน้าจอ**: เน้นมือถือก่อน

### 📄 ลิขสิทธิ์

MIT License - ดูรายละเอียดที่ [LICENSE](./LICENSE)

---

**Made with ❤️ for the Binance Alpha community**

**⚠️ Disclaimer**: Markets are unpredictable. Always do your own research (DYOR). This tool is for informational purposes only. No liability for trading losses.
