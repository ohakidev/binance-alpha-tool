# Alpha Airdrop Tracker Deployment Guide

## Production Target

As of March 13, 2026, the GitHub `master` branch is the branch that auto-deploys for this repository.

The linked Vercel production hostname currently used by this repo is:

- `https://binance-alpha-tool-chi.vercel.app`

Use a custom domain if you want a cleaner public production URL. Do not assume `https://binance-alpha-tool.vercel.app` belongs to this repo; it does not.

## Required Environment Variables

Set these in Vercel before the first production deploy:

```env
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
ADMIN_KEY="generate-a-random-32-plus-char-secret"
CRON_SECRET="generate-a-random-32-plus-char-secret"
NEXT_PUBLIC_APP_URL="https://your-production-domain.example"
APP_URL="https://your-production-domain.example"
BINANCE_ALPHA_API_URL="https://www.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/cex/alpha/all/token/list"
TELEGRAM_BOT_TOKEN=""
TELEGRAM_CHAT_ID=""
TELEGRAM_LANGUAGE="th"
MORALIS_API_KEY=""
```

Rules:

- `NEXT_PUBLIC_APP_URL` and `APP_URL` must be the same public HTTPS origin.
- Do not use `localhost` or `127.0.0.1` in production.
- Telegram links no longer fall back to an old hostname when production URLs are missing.
- The app expects a persistent Postgres database in production, not local SQLite.

## Vercel Setup

Recommended flow:

1. Push the repo to GitHub.
2. Import the repo into Vercel.
3. Set the environment variables above for Production.
4. Deploy.
5. After deploy, run schema sync against the production database.

This repo already includes:

- `vercel.json` with `npm ci` install
- `prisma generate && next build` build command
- function duration settings for API and cron routes

## Database Setup

After the first deploy, apply the Prisma schema to the production database:

```bash
npm run db:generate
npm run db:push
```

If you are running locally against production env values:

```bash
vercel env pull .env.local
npm run db:generate
npm run db:push
```

## Cron Setup

The repo includes GitHub Actions cron in [`.github/workflows/cron-update-airdrops.yml`](./.github/workflows/cron-update-airdrops.yml).

Required GitHub Actions secrets:

- `CRON_SECRET`
- `APP_URL`

`APP_URL` is required now. The workflow will fail fast if it is missing instead of silently calling a stale hostname.

Alternative cron options:

- Vercel Cron
- cron-job.org
- UptimeRobot

The target endpoint is:

- `GET /api/cron/update-airdrops?secret=YOUR_CRON_SECRET`

Vercel native cron can also authenticate with the `x-vercel-cron` header automatically.

## Production Checklist

Before deploy:

- Confirm `master` contains the intended release commit.
- Confirm no API secrets are hardcoded in the UI.
- Confirm `NEXT_PUBLIC_APP_URL` and `APP_URL` are set to the real HTTPS origin.
- Confirm `DATABASE_URL` points to the production Postgres instance.
- Confirm `CRON_SECRET` is set in both Vercel and GitHub Actions.

After deploy:

- Open `/` and verify the header branding is `Alpha Tracker`, not `Binance Alpha`.
- Open `/settings` and verify there is no public API key or secret key form.
- Verify `GET /api/binance/alpha/airdrops` returns `200`.
- Verify `GET /api/binance/alpha/stability` returns `200`.
- Trigger `GET /api/cron/update-airdrops?secret=...` once and verify success.
- Check the latest GitHub Actions `update-airdrops` run is green.
- Check the latest Vercel deployment for `master` is green.

## Update Workflow

Production updates should be shipped by pushing to `master`:

```bash
git add .
git commit -m "chore: production hardening"
git push origin master
```

If GitHub is linked to Vercel correctly, that push creates the production deploy automatically.

## Security Notes

This repo is now hardened to avoid the main trust failures seen earlier:

- No public Binance API key or secret key inputs in the settings UI
- No hardcoded fallback to `alpha123.uk` for history enrichment
- No workflow fallback to an unknown Vercel hostname
- No compile-time API CORS header that can accidentally ship `localhost` or `*`
- Neutral app metadata and manifest branding

Additional runtime protections shipped in config:

- `Strict-Transport-Security`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-origin`

## Verification Commands

Local verification before push:

```bash
npm run build
npx tsc --noEmit
```

Useful production probes:

```bash
curl https://your-production-domain.example/api/binance/alpha/airdrops
curl https://your-production-domain.example/api/binance/alpha/stability
curl "https://your-production-domain.example/api/cron/update-airdrops?secret=YOUR_CRON_SECRET"
```

## Troubleshooting

If Vercel deploys but the wrong website appears:

- Check the deployed hostname carefully.
- `https://binance-alpha-tool.vercel.app` is not this repo's production site.
- Reconfirm which Vercel project is connected to `ohakidev/binance-alpha-tool`.

If cron fails:

- Verify GitHub secret `APP_URL` matches the real production origin exactly.
- Verify `CRON_SECRET` matches between GitHub Actions and Vercel.
- Verify the production deployment is healthy before the cron run starts.

If Telegram links are missing:

- Check `APP_URL` and `NEXT_PUBLIC_APP_URL`.
- If they are missing or set to localhost, website links are intentionally omitted.
