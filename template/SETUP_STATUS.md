# Golden Voices Connect — Setup Status

**Last Audit:** 2026-05-02
**Branch:** `hermes` (default)
**Local:** `/root/Golden-Voices-Wasp`

---

## What's Working

### Core Infrastructure
- **10 React pages** built (Dashboard, CallDetail, Calls, NewSenior, EditSenior, Schedule, Billing, LandingPage, Login, Signup)
- **Prisma schema** — 8 models: User, Senior, Call, CallSummary, CallInsight, ScheduledCall, UserSubscription, CreditTransaction
- **VAPI webhook** — `POST /webhooks/vapi` wired to handle `call-start`, `call-end`, `status-update`, `conversation-update`
- **AI call summaries** — `generateCallSummary` job triggered on call-end via PgBoss
- **Resend email** — `sendCallCompletedEmail()` sends branded HTML email after each completed call
- **PgBoss scheduling** — `processScheduledCalls` job runs every 5 minutes (`*/5 * * * *`)
- **Credit/billing** — UserSubscription, CreditTransaction, deductCredit() logic, Stripe webhook handler
- **Stripe webhook** — wired at `POST /payments-webhook` (invoice.paid, customer.subscription.updated/deleted)
- **Auth** — email/password auth via Wasp, Clerk env vars declared (not yet wired)
- **Env validation schema** — `gvEnvValidationSchema` in `src/golden-voices/env.ts`

### Wasp Config
- All Golden Voices routes declared in `main.wasp`
- All operations (queries/actions) registered with correct entities
- `serverEnvValidationSchema` aggregates all feature schemas

### Git
- SSH deploy key verified (`id_ed25519_goldenvoices` → `golden-voices-wasp`)
- Branch: `hermes` (not `main`)

---

## What's Blocked

### P0 — Cannot start app

| Blocker | Detail |
|---------|--------|
| **VAPI keys missing** | `VAPI_PRIVATE_KEY`, `VAPI_ASSISTANT_ID`, `VAPI_PHONE_NUMBER_ID` — without these, outbound calls cannot be initiated |
| **DATABASE_URL missing** | Cannot connect to Supabase PostgreSQL — app crashes at startup |
| **Wasp CLI not installed** | `npm install -g @wasp.sh/wasp-cli-linux-x64-glibc` blocked by tirith security scanner |

### P1 — Not wired yet

| Item | Status |
|------|--------|
| **Clerk auth** | Env vars declared (`CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`) but Wasp email auth is still primary. Clerk middleware/webhook not registered |
| **Stripe billing UI** | Stripe webhook handler exists, but the pricing page and checkout flow are standard OpenSaaS (not customized for Golden Voices plans yet) |
| **Resend domain** | `no-reply@goldenvoices.app` must be verified in Resend dashboard before emails deliver |

---

## Schema Audit

### Prisma Models — Complete ✓
- `User` — credits, subscriptionStatus, stripeCustomerId, preferredLanguage
- `Senior` — name, phone, language (en/ur/hi), relationship, notes, isActive
- `Call` — vapiCallSid, status, duration, transcript, rawRecordingUrl
- `CallSummary` — mood, moodScore, engagementScore, summary, topics[], highlights[]
- `CallInsight` — type (health_alert/memory_spark/topic/concern), content, severity
- `ScheduledCall` — frequency, time, timezone, enabled, nextCallAt, lastCallAt
- `UserSubscription` — plan, status, creditsBalance, monthlyCallLimit
- `CreditTransaction` — amount, type (purchase/call_debit/refund/bonus)

### Missing Models — None identified for VAPI calling flow

### Potential Gaps

1. **`Call.rawRecordingUrl` is String** — Should be an S3/storage URL (file upload not wired yet)
2. **`Senior.notes`** is a free-text String — could be JSON for structured health/interest data
3. **`CallInsight.severity`** only exists for `health_alert` type — other types ignore it (acceptable)
4. **No `User.clerkUserId`** — if migrating fully to Clerk, User model needs `clerkUserId @unique` field

---

## Email Audit

### `src/golden-voices/lib/emailNotifications.ts` — Status: OK ✓

- Uses **Resend API** directly (not Wasp email sender)
- Guard: `if (!RESEND_API_KEY) { console.log(...); return; }` — safe if key missing
- From: `"Golden Voices <no-reply@goldenvoices.app>"` — domain must be verified in Resend
- One email type implemented: `sendCallCompletedEmail`
  - Triggered in `vapiWebhook → handleCallEnd` when status = `completed`
  - Links to `${CLIENT_URL}/dashboard/calls/${callId}`

### Hardcoded Strings
| String | Location | Notes |
|--------|----------|-------|
| `"Golden Voices"` | Header logo | Brand name — no i18n |
| `"no-reply@goldenvoices.app"` | From address | Must be verified in Resend |
| `"Daily connection for the people who matter most"` | Tagline | Static |
| `"Your call with ${seniorName} is complete"` | Subject + headline | Static template |
| `"You're receiving this because you have an active account."` | Footer | Static |

### Not Implemented (Opportunity)
- [ ] Welcome email on signup
- [ ] Low credits warning email
- [ ] Subscription expiry notice
- [ ] Weekly summary email

---

## Ship Readiness

### Can ship immediately after env vars arrive:

1. **Database + Clerk + Resend + OpenAI + Stripe** — just set `.env.server` vars, app starts
2. **All 10 pages** — they use static data/fixtures now, but the UI is built
3. **Webhook handlers** — Stripe and VAPI webhooks are registered, just need live endpoints in Stripe/VAPI dashboards
4. **PgBoss jobs** — `processScheduledCalls` and `generateCallSummary` will auto-run once DB is connected

### Needs work before production:

1. **VAPI assistant configuration** — create the AI assistant in VAPI dashboard (en/ur/hi prompts, voice, greeting)
2. **Resend domain verification** — `goldenvoices.app` must be verified in Resend
3. **Stripe billing plans** — OpenSaaS default plans (free/starter/premium) need review against Golden Voices pricing
4. **Clerk SSO** — swap Wasp email auth for Clerk or add Clerk as secondary method
5. **S3/file uploads** — `Call.rawRecordingUrl` needs real storage (S3, R2, etc.)
6. **Production deployment** — Vercel, Railway, or Fly.io

---

## Action Items for @ali

- [ ] **Set VAPI keys** in `.env.server` — get from https://app.vapi.ai
- [ ] **Set `DATABASE_URL`** — Supabase → Settings → Database → Connection string
- [ ] **Verify `goldenvoices.app` in Resend** — https://resend.com/domains
- [ ] **Run Wasp CLI install manually** on VPS: `npm install -g @wasp.sh/wasp-cli-linux-x64-glibc`
- [ ] **Create VAPI assistant** with en/ur/hi conversation prompts at https://app.vapi.ai
- [ ] **Register Stripe webhook** in Stripe dashboard → point to `https://your-domain.com/payments-webhook`
- [ ] **Register VAPI webhook** in VAPI dashboard → point to `https://your-domain.com/webhooks/vapi`
- [ ] **Decide: Clerk or Wasp email auth?** Currently hybrid — Wasp email is active, Clerk vars declared but unused

---

## Quick Start (once env vars set)

```bash
cd /root/Golden-Voices-Wasp/template
cp .env.server.example .env.server
# Fill in all values in .env.server

# Run database migrations
npx wasp db migrate-dev

# Start development server
npx wasp start
```
