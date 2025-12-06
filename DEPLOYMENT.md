# Binance Alpha Tool - Deployment Guide

## 🚀 Quick Deploy to Vercel

### 1. Prerequisites

- GitHub account
- Vercel account (free tier available)
- Node.js 18+ locally (for database setup)

### 2. Environment Variables

Before deploying, prepare these environment variables:

```env
# ================================
# Production Environment Variables
# ================================

# Database (Required - Use PostgreSQL for production)
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# Admin Key for API operations (Required)
# Generate with: openssl rand -base64 32
ADMIN_KEY="your-secure-admin-key-here-min-32-chars"

# App URL (Required for production)
# ⚠️ IMPORTANT: Must be valid HTTPS URL, NOT localhost
# Telegram inline buttons will fail with localhost URLs
NEXT_PUBLIC_APP_URL="https://binance-alpha-tool.vercel.app"

# Telegram (Optional - for notifications)
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_CHAT_ID="your-chat-id"
TELEGRAM_LANGUAGE="th"

# Cron Security (Required for production)
# Generate with: openssl rand -base64 32
CRON_SECRET="your-random-secret-key-min-32-chars"
```

> ⚠️ **IMPORTANT**: `NEXT_PUBLIC_APP_URL` must be a valid public HTTPS URL.
> Telegram does not allow `localhost` or `127.0.0.1` in inline keyboard buttons.
> The code will automatically fallback to `https://binance-alpha-tool.vercel.app` if localhost is detected.

### 3. Deploy to Vercel

#### Option A: Deploy from GitHub (Recommended)

1. Push your code to GitHub
2. Go to [https://vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Configure environment variables (see above)
5. Click **Deploy**

#### Option B: Deploy with Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts and set environment variables
# For production deployment:
vercel --prod
```

### 4. Post-Deployment Setup

After first deployment, run database setup:

```bash
# Pull environment variables locally
vercel env pull .env.local

# Generate Prisma Client
pnpm db:generate

# Push schema to database
pnpm db:push

# (Optional) Seed sample data
pnpm db:seed
```

---

## 🗄️ Database Options

### Option 1: SQLite (Default - Development)

SQLite is included by default. Great for:
- Local development
- Small deployments
- Testing

```env
DATABASE_URL="file:./dev.db"
```

### Option 2: PostgreSQL (Production Recommended)

For production, migrate to PostgreSQL:

#### Using Supabase (Free Tier Available)

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Settings > Database**
4. Copy **Connection String** (URI format)

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres"
```

#### Using Neon (Free Tier Available)

1. Go to [https://neon.tech](https://neon.tech)
2. Create a new project
3. Copy connection string

```env
DATABASE_URL="postgresql://username:password@ep-xxx.neon.tech/neondb"
```

#### Prisma Schema Update for PostgreSQL

Update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Change from "sqlite"
}
```

Then run:

```bash
pnpm db:generate
pnpm db:push
```

---

## 📱 Telegram Bot Setup (Optional)

See [TELEGRAM_SETUP.md](./TELEGRAM_SETUP.md) for detailed instructions.

Quick steps:
1. Create bot via `@BotFather` on Telegram
2. Get bot token
3. Get chat ID
4. Add to environment variables

---

## ⏰ Cron Jobs Setup (Required for Auto-Sync)

### Option A: Vercel Cron (Hobby Plan - Daily Only)

Vercel Hobby plan only supports **daily** cron jobs. Already configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/update-airdrops",
      "schedule": "0 0 * * *"
    }
  ]
}
```

This runs once per day at midnight UTC. For more frequent updates, use **Option B, C, or D** below.

**Security**: Vercel Cron requests include `x-vercel-cron` header which is automatically validated.

### Option A2: Vercel Pro (Unlimited Cron)

Upgrade to Vercel Pro ($20/month) for unlimited cron frequency:

```json
{
  "crons": [
    {
      "path": "/api/cron/update-airdrops",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Option B: cron-job.org (Free - Recommended) ⭐

Best free alternative for frequent cron jobs:

1. Go to [https://cron-job.org](https://cron-job.org)
2. Create free account
3. Create new cron job:
   - **Title**: `Binance Alpha Update`
   - **URL**: `https://your-domain.vercel.app/api/cron/update-airdrops?secret=YOUR_CRON_SECRET`
   - **Schedule**: Every 5 minutes
   - **Method**: GET
   - **Timeout**: 120 seconds

### Option C: UptimeRobot (Free)

Use monitoring as cron:

1. Go to [https://uptimerobot.com](https://uptimerobot.com)
2. Create free account
3. Add new monitor:
   - **Type**: HTTP(s)
   - **URL**: `https://your-domain.vercel.app/api/cron/update-airdrops?secret=YOUR_CRON_SECRET`
   - **Interval**: 5 minutes (free tier minimum)

### Option D: GitHub Actions (Free)

Already configured! File: `.github/workflows/cron-update-airdrops.yml`

Runs every 5 minutes automatically.

**Setup required:**
1. Go to your GitHub repository
2. Navigate to **Settings > Secrets and variables > Actions**
3. Add these secrets:
   - `CRON_SECRET`: Your cron secret key
   - `APP_URL`: `https://your-domain.vercel.app` (optional, has default)

**Note**: GitHub Actions cron may have delays of 1-5 minutes due to GitHub's queue system.

**Manual trigger**: Go to Actions tab > "Update Airdrops Cron" > Run workflow

---

## ✅ Deployment Checklist

### Before Deployment

- [ ] All environment variables prepared
- [ ] `ADMIN_KEY` is strong (32+ characters)
- [ ] Code pushed to GitHub
- [ ] No sensitive data in code

### After Deployment

- [ ] Visit deployed URL and verify pages load
- [ ] Test API endpoints:
  - [ ] `GET /api/airdrops`
  - [ ] `GET /api/binance/alpha/stability`
- [ ] Test admin endpoints with `x-admin-key` header
- [ ] Verify database connection
- [ ] Setup Telegram bot (optional)
- [ ] Configure cron jobs (optional)

---

## 🔧 Troubleshooting

### Build Fails

**Error**: `Cannot find module '@prisma/client'`

**Solution**: Update `vercel.json`:

```json
{
  "buildCommand": "prisma generate && next build"
}
```

### Database Connection Error

**Error**: `Can't reach database server`

**Solutions**:
1. Check `DATABASE_URL` format is correct
2. For Supabase: Enable IP allowlist (allow all: `0.0.0.0/0`)
3. URL encode special characters in password

### API Returns 401 Unauthorized

**Error**: Admin endpoints return 401

**Solutions**:
1. Verify `ADMIN_KEY` environment variable is set
2. Check `x-admin-key` header matches exactly
3. Redeploy after setting environment variables

### Pages Load Slowly

**Solutions**:
1. Enable Vercel Analytics
2. Check bundle size: `pnpm build:analyze`
3. Optimize images with Next.js `<Image>`
4. Enable ISR for static pages

### Telegram Not Working

**Solutions**:
1. Verify `TELEGRAM_BOT_TOKEN` is correct
2. Ensure you've started chat with bot first
3. Check `TELEGRAM_CHAT_ID` format
4. See [TELEGRAM_SETUP.md](./TELEGRAM_SETUP.md) for details

---

## 📊 Monitoring

### Vercel Analytics

- Enable in Vercel Dashboard > Analytics
- Track page views, performance, and vitals

### Error Tracking

Consider adding:
- Sentry (`@sentry/nextjs`)
- LogRocket
- Vercel Error Monitoring

### Database Monitoring

- Prisma Studio: `pnpm db:studio`
- Supabase Dashboard (if using)
- Query performance logs

---

## 🔄 Updates & Maintenance

### Deploy Updates

```bash
# Push changes to GitHub
git add .
git commit -m "Update features"
git push origin main

# Vercel auto-deploys on push
```

### Database Migrations

```bash
# After schema changes
pnpm db:push

# Regenerate client
pnpm db:generate

# Redeploy
vercel --prod
```

### Backup Database

```bash
# Export airdrops to JSON backup
pnpm db:export

# Creates: data/backups/airdrop-backup-YYYY-MM-DD.json
```

---

## 🎯 Performance Optimization

### Next.js 16 Features

- **App Router**: Already configured
- **Server Components**: Used by default
- **Turbopack**: Enable with `pnpm dev:turbo`

### Caching

Already configured in `next.config.ts`:
- Static page caching
- API response caching
- Image optimization

### Bundle Optimization

```bash
# Analyze bundle size
pnpm build:analyze
```

### Edge Runtime (Optional)

For faster API responses, consider Edge Runtime:

```typescript
export const runtime = 'edge';
```

---

## 💰 Cost Estimate

### Free Tier

| Service | Limit | Cost |
|---------|-------|------|
| Vercel | 100GB bandwidth, 100GB-hrs compute | $0 |
| SQLite | Local file | $0 |
| GitHub | Unlimited public repos | $0 |
| **Total** | | **$0/month** |

### Production (Recommended)

| Service | Features | Cost |
|---------|----------|------|
| Vercel Pro | Cron jobs, analytics, more bandwidth | $20/month |
| Supabase Pro | 8GB database, daily backups | $25/month |
| **Total** | | **$45/month** |

---

## 🔐 Security Best Practices

- ✅ Use strong `ADMIN_KEY` (32+ characters, random)
- ✅ Never commit `.env` or `.env.local` to git
- ✅ Rotate API keys quarterly
- ✅ Enable HTTPS (automatic on Vercel)
- ✅ Use environment variables for all secrets
- ✅ Input validation with Zod
- ✅ SQL injection prevention (Prisma)
- ✅ `NEXT_PUBLIC_APP_URL` must be valid public URL (not localhost)
- ✅ `CRON_SECRET` required for manual cron triggers
- ✅ API routes validate authorization headers

### Production URL Requirements

The codebase automatically prevents localhost URLs from being used in:
- Telegram inline keyboard buttons
- Internal API calls in production mode

If `NEXT_PUBLIC_APP_URL` is set to localhost in production:
- Telegram notifications will use fallback URL
- API routes will throw errors to prevent misconfiguration

---

## 📚 Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js 16 Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [Supabase Documentation](https://supabase.com/docs)

---

## 📞 Need Help?

1. Check [SETUP.md](./SETUP.md) for local development
2. Check [DATABASE_SETUP.md](./DATABASE_SETUP.md) for database details
3. Check [TELEGRAM_SETUP.md](./TELEGRAM_SETUP.md) for bot setup
4. Review [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details

---

---

## 🔄 Quick Production Checklist

```bash
# 1. Generate secure keys
openssl rand -base64 32  # For ADMIN_KEY
openssl rand -base64 32  # For CRON_SECRET

# 2. Set environment variables in Vercel Dashboard
#    - DATABASE_URL (PostgreSQL recommended)
#    - ADMIN_KEY
#    - NEXT_PUBLIC_APP_URL (your-domain.vercel.app)
#    - TELEGRAM_BOT_TOKEN
#    - TELEGRAM_CHAT_ID
#    - CRON_SECRET

# 3. Deploy
vercel --prod

# 4. Verify deployment
curl https://your-domain.vercel.app/api/airdrops
```

---

**Made with ❤️ for the Binance Alpha community**