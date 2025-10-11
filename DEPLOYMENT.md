# Binance Alpha Tool - Deployment Guide

## 🚀 Quick Deploy to Vercel

### 1. Prerequisites

- GitHub account
- Vercel account (free tier available)
- Supabase account (for database)
- Moralis account (for Web3 API)
- Telegram Bot (optional)

### 2. Database Setup (Supabase)

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Wait for database to be ready (~2 minutes)
4. Go to **Settings > Database**
5. Copy **Connection String** (URI format)
6. Replace `[YOUR-PASSWORD]` with your password

Example:

```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

### 3. Get API Keys

#### Moralis (Web3 API)

1. Go to [https://moralis.io](https://moralis.io)
2. Sign up / Login
3. Go to **Web3 Data API** > **Get your API Key**
4. Copy the API key

#### Telegram Bot (Optional)

1. Open Telegram, search for `@BotFather`
2. Send `/newbot` command
3. Follow instructions to create bot
4. Copy the **Bot Token**
5. Start a chat with your bot
6. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
7. Look for `"chat":{"id":123456789}` and copy the ID

### 4. Deploy to Vercel

#### Option A: Deploy with Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts and set environment variables
```

#### Option B: Deploy from GitHub

1. Push your code to GitHub
2. Go to [https://vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Configure environment variables (see below)
5. Click **Deploy**

### 5. Environment Variables

Add these in **Vercel Dashboard > Settings > Environment Variables**:

```bash
# Database (Required)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres

# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Moralis (Required)
MORALIS_API_KEY=your_moralis_api_key_here

# Binance API (Optional - for real-time market data)
BINANCE_API_KEY=your_binance_api_key
BINANCE_API_SECRET=your_binance_secret

# Telegram (Optional - for notifications)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
TELEGRAM_LANGUAGE=th

# Cron Security (Required - generate random string)
CRON_SECRET=your_random_secret_key_min_32_chars

# Optional
SENTRY_DSN=your_sentry_dsn
NODE_ENV=production
```

### 6. Run Database Migrations

After first deployment:

```bash
# Install dependencies locally
npm install

# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Seed sample data (optional)
npm run db:seed
```

Or via Vercel CLI:

```bash
vercel env pull .env
npm run db:push
npm run db:seed
```

### 7. Setup Cron Jobs

Vercel Pro plan required for cron jobs. Alternative for free tier:

#### Option A: External Cron Service (Free)

1. Go to [https://cron-job.org](https://cron-job.org)
2. Create a new cron job:
   - **URL**: `https://your-domain.vercel.app/api/cron/update-airdrops?secret=YOUR_CRON_SECRET`
   - **Schedule**: `0 * * * *` (every hour)
   - **Method**: GET

#### Option B: GitHub Actions (Free)

Create `.github/workflows/cron.yml`:

\`\`\`yaml
name: Hourly Airdrop Update

on:
schedule: - cron: '0 \* \* \* \*' # Every hour
workflow_dispatch: # Manual trigger

jobs:
update:
runs-on: ubuntu-latest
steps: - name: Trigger Cron
run: |
curl -X GET "https://your-domain.vercel.app/api/cron/update-airdrops?secret=${{ secrets.CRON_SECRET }}"
\`\`\`

Add `CRON_SECRET` to GitHub Secrets.

### 8. Verify Deployment

1. Visit your deployed URL: `https://your-app.vercel.app`
2. Check API endpoints:
   - `/api/binance/market/ticker`
   - `/api/binance/alpha/airdrops`
   - `/api/binance/alpha/stability`
3. Test Telegram notifications (if configured)
4. Check Prisma Studio: `npm run db:studio`

---

## 🔧 Troubleshooting

### Build Fails

**Error**: `Cannot find module '@prisma/client'`

**Solution**:

```json
// vercel.json
{
  "buildCommand": "prisma generate && next build"
}
```

### Database Connection Error

**Error**: `Can't reach database server`

**Solutions**:

1. Check `DATABASE_URL` is correct
2. Ensure IP allowlist in Supabase (allow all: `0.0.0.0/0`)
3. Verify password has no special characters (or URL encode them)

### Cron Job Not Working

**Solutions**:

1. Verify `CRON_SECRET` matches in `.env` and cron service
2. Check Vercel function logs
3. Test manually: `curl https://your-domain.vercel.app/api/cron/update-airdrops?secret=YOUR_SECRET`

### Telegram Not Sending

**Solutions**:

1. Ensure `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are set
2. Start a chat with your bot first
3. Check bot has permission to send messages
4. Verify language setting: `TELEGRAM_LANGUAGE=th` or `en`

---

## 📊 Monitoring

### Vercel Analytics

- Enable in Vercel Dashboard > Analytics
- Track page views, performance

### Error Tracking (Sentry)

```bash
npm install @sentry/nextjs

# Follow setup wizard
npx @sentry/wizard@latest -i nextjs
```

### Database Monitoring

- Supabase Dashboard > Database > Logs
- Query performance
- Connection pooling

---

## 🔄 Updates & Maintenance

### Deploy Updates

```bash
git add .
git commit -m "Update features"
git push origin main  # Auto-deploys on Vercel
```

### Database Migrations

```bash
# After schema changes
npm run db:push

# Generate new client
npm run db:generate

# Re-deploy
vercel --prod
```

### Backup Database

```bash
# Export from Supabase
# Settings > Database > Backups
# Download .sql file
```

---

## 🎯 Performance Tips

1. **Enable caching**: Already configured in `next.config.ts`
2. **Use CDN**: Vercel Edge Network (automatic)
3. **Optimize images**: Use Next.js `<Image>` component
4. **Monitor bundle size**: `ANALYZE=true npm run build`
5. **Database indexes**: Already in Prisma schema

---

## 📱 PWA Features

The app is PWA-ready:

- Offline support (via service worker)
- Install to home screen
- Push notifications (requires setup)

To enable push notifications:

1. Get VAPID keys
2. Add to `.env`
3. Implement service worker

---

## 🔐 Security Checklist

- ✅ Environment variables secure
- ✅ HTTPS only (Vercel automatic)
- ✅ Rate limiting enabled
- ✅ Input validation (Zod)
- ✅ CORS configured
- ✅ CSP headers set
- ✅ API key rotation (manual - do quarterly)

---

## 📚 Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [Supabase Guide](https://supabase.com/docs/guides/getting-started)

---

## 💡 Cost Estimate

**Free Tier:**

- Vercel: Free (100GB bandwidth, 100GB-hrs compute)
- Supabase: Free (500MB database, 2GB transfer)
- Moralis: Free (40,000 requests/month)
- Total: **$0/month** for small projects

**Production (Recommended):**

- Vercel Pro: $20/month (cron jobs, analytics)
- Supabase Pro: $25/month (8GB database, daily backups)
- Moralis: $49/month (3M requests)
- Total: **~$94/month**

---

## ✅ Deployment Checklist

Before going live:

- [ ] Database migrated and seeded
- [ ] All environment variables set
- [ ] API endpoints tested
- [ ] Telegram bot working
- [ ] Cron jobs configured
- [ ] PWA manifest correct
- [ ] SEO metadata added
- [ ] Error tracking enabled
- [ ] Analytics configured
- [ ] Domain configured (optional)
- [ ] SSL certificate active (automatic)
- [ ] Backup strategy in place

---

**Need help?** Check [DATABASE_SETUP.md](./DATABASE_SETUP.md) for API usage examples.
