# Shared PostgreSQL — Connection Guide

**For agents:** Use this database for all Golden Voices Connect data.
**Schema:** `golden_voices` | **Database:** `shared_apps` | **Host:** `127.0.0.1:54320`

---

## Connection String

```
postgresql://golden_app:gv_golden_2026@127.0.0.1:54320/shared_apps
```

## Quick Test

```bash
# From VPS
docker exec shared-postgres psql -U ali -d shared_apps -c "SELECT 1 AS ok;"

# As golden_app user
docker exec shared-postgres psql -U golden_app -d shared_apps -c "SELECT current_schema();"
```

## Wasp/Prisma Configuration

Update `.env.server` with:

```env
DATABASE_URL=postgresql://golden_app:gv_golden_2026@127.0.0.1:54320/shared_apps?schema=golden_voices
```

Prisma will automatically use the `golden_voices` schema when you set the `schema` query param.

**In `prisma/schema.prisma`, ensure the datasource URL includes the schema:**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Running Migrations

```bash
# Set the env var first
export DATABASE_URL="postgresql://golden_app:gv_golden_2026@127.0.0.1:54320/shared_apps?schema=golden_voices"

# Run migrations
npx prisma migrate dev --name init

# Or apply existing
npx prisma migrate deploy
```

## What to Migrate

The `SPEC.md` defines these models that need tables:

- `User` — extended with phone, language, credits, subscription fields
- `Senior` — elderly family members to call
- `Call` — call logs with VAPI SID, status, transcript
- `CallSummary` — AI-generated summaries after each call
- `CallInsight` — health/mood insights extracted from conversation
- `ScheduledCall` — cron-like scheduling per senior
- `UserSubscription` — Stripe subscription tracking
- `CreditTransaction` — credits purchased/spent

## Verifying Schema

```sql
-- As golden_app
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'golden_voices'
ORDER BY table_name;
```

## Deployment Note

Wasp deploys to Vercel (or Railway/Fly.io). For production:
1. Set `DATABASE_URL` env var in Vercel project settings
2. Run `prisma migrate deploy` after setting the URL
3. The connection string must point to an externally accessible PostgreSQL

**For local dev:** Use the local connection string above.
**For production:** Use the same URL once deployed externally (port 54320 on VPS needs Cloudflare Tunnel or similar to expose, or use Supabase/Tayari's external PostgreSQL)

## Admin Access (from VPS)

```bash
docker exec shared-postgres psql -U ali -d shared_apps -c "SET search_path = golden_voices; SELECT table_name FROM information_schema.tables WHERE table_schema = 'golden_voices';"
```

## Available Tables (so far)

| Table | Description |
|---|---|
| `golden_voices.app_metadata` | Schema version tracking |

## Env Vars Needed (Update Existing Task)

Update the `golden-voices-env-vars-needed.md` task:

```
DATABASE_URL=postgresql://golden_app:gv_golden_2026@127.0.0.1:54320/shared_apps?schema=golden_voices
```

Remove the Supabase `DATABASE_URL` reference — we have local PostgreSQL now.

## Credentials

Credentials file (local VPS only, not in git):
`/root/jarvis-claw/data/WORKSPACES/CORE/credentials/shared-postgres.md`
