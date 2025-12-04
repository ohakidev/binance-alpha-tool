# Binance Alpha Tool - Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pnpm install
# or
npm install
```

### 2. Setup Database

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# (Optional) Seed sample data
pnpm db:seed
```

### 3. Environment Variables

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

### 4. Run Development Server

```bash
pnpm dev
# or with Turbopack
pnpm dev:turbo
```

Visit `http://localhost:3000`

---

## 📄 Application Pages

### 1. 🏠 Home Page (`/`)

**Features:**
- Unified Airdrop table with all projects
- Premium Gold & Black theme
- Status badges, chain info, multiplier display
- Countdown timers for dates
- Loading skeletons for smooth UX

### 2. 📈 Stability Dashboard (`/stability`)

**Features:**
- **Live Data**: Real-time Binance Alpha API (10-second refresh)
- **4x Multiplier Projects**: BLUM, MAJOR, SEED, TOMARKET, PLUTO, CATS, DOGS
- **KOGE Baseline**: 1x reference for comparison
- **Spread bps**: Trade discrepancy indicator (🟢🟢 = good)
- **Professional Table**: TanStack Table with sorting, filtering, search
- **Risk Levels**: Safe (green) / Moderate (yellow) / High (red)
- **Stability Criteria**: Price range, volume swings, abnormal spikes, short-term trend

### 3. 🧮 Calculator Page (`/calculator`)

**Features:**
- **Dual Input System**: Slider + Direct text input with real-time sync
- **Daily Volume Tracker**: Track transaction history
- **Points Calculation**: Points per day/week, max allocations
- **Profit Strategy**: Net profit for 15/30 day periods
- **Cost Analysis**: Account cost, transaction costs
- **Full i18n Support**: Thai/English

### 4. 📅 Calendar Page (`/calendar`)

**Features:**
- **Daily Income Tracking**: Add/edit/delete entries
- **Multi-user Support**: Manage multiple accounts
- **Statistics Dashboard**: Total income, monthly stats, entry counts
- **Category Support**: Airdrop, Trading, Staking, Other
- **Visual Calendar**: Color-coded dates with income
- **Quick Tips Panel**: Usage guidance

### 5. ⚙️ Settings Page (`/settings`)

**Features:**
- **Theme Switcher**: Dark/Light/Auto (fully functional)
- **Language Switcher**: Thai/English (full i18n)
- **API Keys**: Binance API configuration
- **Telegram Integration**: Bot token and chat ID setup
- **Notifications**: Sound, alerts preferences
- **Data Management**: Export/Import/Reset
- **All settings persist** to localStorage

---

## 🗄️ State Management (Zustand Stores)

The app uses 7 Zustand stores for state management:

| Store | Purpose |
|-------|---------|
| `calculator-store.ts` | Calculator values and settings |
| `filter-store.ts` | Table filters and search |
| `income-store.ts` | Income entries and users |
| `language-store.ts` | i18n language selection |
| `settings-store.ts` | App settings (theme, API keys, etc.) |
| `ui-store.ts` | UI state (modals, panels) |
| `user-store.ts` | User profile data |

---

## 🔌 API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/airdrops` | List all airdrops |
| `GET` | `/api/airdrops/[id]` | Get single airdrop |
| `GET` | `/api/airdrops/export` | Export to JSON |
| `GET` | `/api/binance/alpha/projects` | Binance Alpha projects |
| `GET` | `/api/binance/alpha/stability` | Stability data |

### Admin Endpoints (require `x-admin-key` header)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/airdrops` | Create airdrop |
| `PUT` | `/api/airdrops/[id]` | Update airdrop |
| `DELETE` | `/api/airdrops/[id]` | Delete airdrop |
| `POST` | `/api/airdrops/import` | Import from JSON |

### Using Admin API

```bash
# Set your admin key
export ADMIN_KEY="your-admin-key"

# Create airdrop
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

# Import airdrops from backup
curl -X POST http://localhost:3000/api/airdrops/import \
  -H "Content-Type: application/json" \
  -H "x-admin-key: your-admin-key" \
  -d @data/backups/airdrop-backup-2025-01-01.json
```

---

## 🔄 Data Import/Export

### Export Database to Backup

```bash
pnpm db:export
```

Creates: `data/backups/airdrop-backup-YYYY-MM-DD.json`

### Import Backup to Database

```bash
# Import latest backup
pnpm db:import

# Import specific backup
pnpm db:import airdrop-backup-2025-01-01.json
```

### List All Backups

```bash
pnpm db:list-backups
```

### Features:

- ✅ **Smart Duplicate Check**: Skips existing records (by token)
- ✅ **Version Control**: Date-based filenames
- ✅ **Detailed Summary**: Shows imported/skipped/errors
- ✅ **Auto-select Latest**: No filename needed

---

## 📊 Database Schema

### Core Models

```prisma
model Airdrop {
  id              String    @id @default(uuid())
  token           String    @unique  // BLUM, MAJOR, etc.
  name            String
  chain           String    // BSC, ETH
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

  // Links
  websiteUrl      String?
  twitterUrl      String?
  alphaUrl        String?

  createdAt       DateTime
  updatedAt       DateTime
}

model User {
  id            String    @id @default(uuid())
  name          String
  walletAddress String?   @unique
  telegramId    String?   @unique
}

model IncomeEntry {
  id          String    @id @default(uuid())
  userId      String
  amount      Float
  currency    String    @default("USDT")
  source      String
  category    String
  date        DateTime
}

model StabilityScore {
  id              String    @id @default(uuid())
  symbol          String
  stabilityScore  Float
  riskLevel       RiskLevel  // SAFE, MODERATE, HIGH
  currentPrice    Float
  timestamp       DateTime
}
```

---

## 🔧 Database Commands

```bash
# Generate Prisma client
pnpm db:generate

# Push schema changes
pnpm db:push

# Open Prisma Studio (GUI)
pnpm db:studio

# Seed sample data
pnpm db:seed

# Migrate (production)
pnpm db:migrate
```

---

## 🌐 Internationalization (i18n)

The app supports full Thai/English translations:

### Supported Sections

- `nav` - Navigation items
- `calc` - Calculator page
- `stability` - Stability dashboard
- `dashboard` - Home dashboard
- `airdrops` - Airdrop listings
- `calendar` - Income calendar
- `settings` - Settings page
- `common` - Common UI elements

### Usage in Components

```tsx
import { useLanguage } from "@/lib/stores/language-store";

function MyComponent() {
  const { t, language } = useLanguage();
  
  return (
    <div>
      <h1>{t.nav.home}</h1>
      <p>{t.common.loading}</p>
    </div>
  );
}
```

---

## 🎨 UI/UX Features

### Theme System

- **Dark Theme**: Premium gold & black design
- **Light Theme**: Clean and modern
- **Auto Theme**: Follows system preference
- **Persists**: Saves to localStorage

### Design System

```tsx
// Glassmorphism
className="glass-card" // Backdrop blur + transparency

// Gradients
className="gradient-gold" // Gold gradient
className="gradient-text-gold" // Gradient text

// Background
className="bg-[#030305]" // Deep black
```

### Colors

- **Primary Gold**: `#D4A948` → `#B8860B`
- **Background**: `#030305` → `#0A0A0C`
- **Safe**: Green (`#22C55E`)
- **Moderate**: Yellow (`#EAB308`)
- **High Risk**: Red (`#EF4444`)

---

## 📱 Responsive Design

### Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Mobile Optimizations

- Bottom navigation bar
- Touch-friendly buttons (min 44px)
- Responsive tables
- Adaptive layouts

---

## 🔐 Security

### Admin Authentication

All admin endpoints require `x-admin-key` header:

```bash
curl -H "x-admin-key: your-key" ...
```

### Input Validation

- Zod schema validation on all inputs
- SQL injection prevention (Prisma)
- XSS prevention (React auto-escaping)

### Environment Variables

```env
ADMIN_KEY="change-this-in-production"
DATABASE_URL="file:./dev.db"
```

⚠️ **Never commit `.env.local` to git!**

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript (Strict Mode) |
| **Database** | Prisma 7 + SQLite |
| **UI Components** | shadcn/ui + Radix UI |
| **Styling** | TailwindCSS 4 |
| **Animations** | Framer Motion |
| **Data Tables** | TanStack Table v8 |
| **State** | Zustand 5 |
| **Data Fetching** | TanStack Query |
| **Validation** | Zod 4 |
| **Testing** | Vitest |
| **Charts** | Recharts |

---

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Set environment variables:
   - `DATABASE_URL`
   - `ADMIN_KEY`
   - `NEXT_PUBLIC_APP_URL`

### Database Migration

```bash
pnpm db:migrate
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

---

## 📝 Available Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm dev:turbo        # Start with Turbopack
pnpm lint             # Run ESLint

# Build
pnpm build            # Build for production
pnpm build:analyze    # Build with bundle analyzer
pnpm start            # Start production server

# Testing
pnpm test             # Run tests
pnpm test:ui          # Run tests with UI
pnpm test:coverage    # Coverage report

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

---

## 🆘 Troubleshooting

### Database Issues

```bash
# Reset database
rm dev.db
pnpm db:push
```

### Prisma Client Issues

```bash
# Regenerate client
pnpm db:generate
```

### Import Fails

```bash
# Check backup file format
cat data/backups/airdrop-backup-*.json | jq
```

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next
pnpm build
```

---

## 💡 Tips

- Use `pnpm db:studio` for visual database management
- Export data regularly with `pnpm db:export`
- Check backups with `pnpm db:list-backups`
- Set strong `ADMIN_KEY` in production
- Monitor API rate limits
- Use Turbopack (`pnpm dev:turbo`) for faster development

---

## 📚 Related Documentation

- [README.md](./README.md) - Project overview
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Database setup
- [TELEGRAM_SETUP.md](./TELEGRAM_SETUP.md) - Telegram bot setup

---

**Made with ❤️ for the Binance Alpha community**