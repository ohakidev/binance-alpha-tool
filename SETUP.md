# Binance Alpha Tool - Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
# or
pnpm install
```

### 2. Setup Database
```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push
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
```

### 4. Run Development Server
```bash
pnpm dev
```

Visit `http://localhost:3000`

---

## 📊 Features

### ✅ Calculator Page (`/calculator`)
- **Dual Input**: Slider + Direct input field
- **Real-time Sync**: Both inputs synchronized
- **Professional UI**: Game-style design with animations

### ✅ Stability Dashboard (`/stability`)
- **Live Data**: From Binance Alpha API
- **4x Multiplier Projects**: BLUM, MAJOR, SEED, TOMARKET, PLUTO, CATS, DOGS
- **KOGE Baseline**: 1x baseline reference
- **Spread bps**: Trade discrepancy indicator (🟢🟢 = good)
- **Professional Table**: TanStack Table with sorting, filtering, search
- **Criteria Display**: Price range, volume swings, abnormal spikes, short-term trend

### ✅ Settings Page (`/settings`)
- **Theme Switcher**: Dark/Light/Auto (fully functional)
- **Language Switcher**: EN/TH
- **Animation Speed**: Fast/Normal/Slow/None
- **Notifications**: Sound, volume, alerts
- **All settings persist** to localStorage

### ✅ Airdrop Management System

#### API Endpoints

**Public Endpoints:**
- `GET /api/airdrops` - List all airdrops
- `GET /api/airdrops/[id]` - Get single airdrop
- `GET /api/airdrops/export` - Export to JSON

**Admin Endpoints (require `x-admin-key` header):**
- `POST /api/airdrops` - Create airdrop
- `PUT /api/airdrops/[id]` - Update airdrop
- `DELETE /api/airdrops/[id]` - Delete airdrop
- `POST /api/airdrops/import` - Import from JSON

#### Using Admin API

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

# Import airdrops
curl -X POST http://localhost:3000/api/airdrops/import \
  -H "Content-Type: application/json" \
  -H "x-admin-key: your-admin-key" \
  -d @data/backups/airdrop-backup-2025-10-04.json
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
pnpm db:import airdrop-backup-2025-10-04.json
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

## 🎨 Professional Data Table

### Component Usage

```tsx
import { AdvancedDataTable } from '@/components/features/data-table/advanced-data-table';

<AdvancedDataTable
  data={airdrops}
  columns={columns}
  enableRowSelection={true}
  enableExport={true}
  enableColumnVisibility={true}
  searchPlaceholder="Search airdrops..."
  pageSizes={[10, 20, 50, 100]}
/>
```

### Features:
- ✅ **Global Search**: Search across all columns
- ✅ **Column Sorting**: Click headers to sort
- ✅ **Column Visibility**: Show/hide columns
- ✅ **Pagination**: Multiple page sizes
- ✅ **Row Selection**: Select multiple rows
- ✅ **Export**: CSV and JSON export
- ✅ **Responsive**: Mobile-friendly design
- ✅ **Animations**: Smooth transitions with Framer Motion

---

## 📊 Database Schema

### Airdrop Model
```prisma
model Airdrop {
  id              String    @id @default(uuid())
  token           String    @unique  // BLUM, MAJOR, etc.
  name            String
  chain           String    // BSC, ETH
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

  // Links
  websiteUrl      String?
  twitterUrl      String?
  alphaUrl        String?

  createdAt       DateTime
  updatedAt       DateTime
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

# Migrate (production)
pnpm db:migrate
```

---

## 🎯 API Integration

### Binance Alpha Projects API
`GET /api/binance/alpha/projects`

Returns:
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
      "riskLevel": "MEDIUM",
      "spreadBps": 45,
      "trend": "STABLE"
    }
  ],
  "baseline": {...},
  "disclaimer": "⚠️ Markets are unpredictable. DYOR"
}
```

### Stability API (Auto-redirects to Projects API)
`GET /api/binance/alpha/stability`

---

## 🎨 UI/UX Features

### Theme System
- **Dark Theme**: Game-inspired (Genshin Impact style)
- **Light Theme**: Clean and modern
- **Auto Theme**: Follows system preference
- **Persists**: Saves to localStorage

### Animation Speeds
- **Fast**: 150ms transitions
- **Normal**: 300ms transitions (default)
- **Slow**: 500ms transitions
- **None**: No animations (accessibility)

### Glass Morphism
```tsx
className="glass-card" // Backdrop blur + transparency
className="glass" // Simple glass effect
```

### Gradients
```tsx
className="gradient-gold" // Gold gradient
className="gradient-cyan" // Cyan gradient
className="gradient-text-gold" // Gradient text
```

---

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Mobile Optimizations
- Bottom navigation bar
- Touch-friendly buttons (min 44px)
- Swipe gestures
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

---

## 📚 Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Prisma + SQLite
- **UI**: TailwindCSS 4 + shadcn/ui
- **Animations**: Framer Motion
- **Tables**: TanStack Table v8
- **State**: Zustand
- **Data Fetching**: React Query
- **Validation**: Zod
- **TypeScript**: Strict mode

---

## 🎮 Game-Style Design

Inspired by **Genshin Impact**:
- ✨ Glassmorphism effects
- 🎨 Gold/Cyan accent colors
- ⚡ Smooth spring animations
- 🌟 Particle effects
- 💫 Glow effects on hover
- 🎯 Professional data tables

---

## 📖 Reference Projects

- https://bn-alpha-tool.com
- https://new.alphabot.cm/
- https://www.bn-alpha.site
- https://litangdingzhen.me/
- https://alpha-nu-self.vercel.app/

---

## 🆘 Troubleshooting

### Database Issues
```bash
# Reset database
rm prisma/dev.db
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

---

## 📝 Next Steps

1. **Add Real Binance API**: Implement web scraping or find official API
2. **Admin Panel UI**: Create visual admin interface
3. **User Authentication**: Add proper auth system
4. **Cloud Database**: Migrate to PostgreSQL/MySQL
5. **Real-time Updates**: WebSocket for live data
6. **Mobile App**: React Native version

---

## 💡 Tips

- Use `pnpm db:studio` for visual database management
- Export data regularly with `pnpm db:export`
- Check backups with `pnpm db:list-backups`
- Set strong `ADMIN_KEY` in production
- Monitor API rate limits

---

**Made with ❤️ for the Binance Alpha community**
