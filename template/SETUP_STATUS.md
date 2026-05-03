# Golden Voices Connect — Setup Status

**Last Audit:** 2026-05-03 (refreshed)
**Branch:** `hermes`
**Local:** `/root/Golden-Voices-Wasp`

---

## What's Working

### Core Infrastructure
- **10 React pages** built (Dashboard, CallDetail, Calls, NewSenior, EditSenior, Schedule, Billing, LandingPage, Login, Signup)
- **Prisma schema** — 8 models: User, Senior, Call, CallSummary, CallInsight, ScheduledCall, UserSubscription, CreditTransaction
- **VAPI webhook** — `POST /webhooks/vapi` handles `call-start`, `call-end`, `status-update`, `conversation-update`
- **AI call summaries** — `generateCallSummary` job triggered on call-end via PgBoss, calls GPT-4o-mini
- **Resend email** — `sendCallCompletedEmail()` sends branded HTML email after each completed call
- **PgBoss scheduling** — `processScheduledCalls` job runs every 5 minutes (`*/5 * * * *`)
- **Credit/billing** — UserSubscription, CreditTransaction, deductCredit() logic, Stripe webhook handler
- **Stripe webhook** — wired at `POST /payments-webhook` (invoice.paid, customer.subscription.updated/deleted)
- **Wasp email/password auth** — active; Clerk vars declared but not wired
- **Env validation schema** — `gvEnvValidationSchema` in `src/golden-voices/env.ts`

### Git
- SSH deploy key verified (`id_ed25519_goldenvoices` → `golden-voices-wasp`)
- Branch: `hermes` (not `main`)
- Push verified: `git push origin hermes` works

---

## What's Blocked

### P0 — Cannot start app

| Blocker | Status |
|---------|--------|
| **Wasp CLI version mismatch** | VPS has `0.21.1`, project requires `^0.23.0`. One cmd: `npm install -g @wasp.sh/wasp-cli@^0.23.0` — tirith blocks automated install, **@ali must run manually** |
| **VAPI keys missing** | `VAPI_PRIVATE_KEY`, `VAPI_ASSISTANT_ID`, `VAPI_PHONE_NUMBER_ID` — without these, outbound calls cannot be initiated (app can start, but no calls work) |

### P1 — Partially working

| Var | Status |
|-----|--------|
| `DATABASE_URL` | Set in `.env.server` — pointing to `host.docker.internal:54320/shared_apps?schema=golden_voices` |
| `OPENAI_API_KEY` | Set in `.env.server` |
| `RESEND_API_KEY` | Set in `.env.server` |
| `STRIPE_SECRET_KEY` | Set in `.env.server` |
| `STRIPE_WEBHOOK_SECRET` | Set in `.env.server` |
| `CLERK_PUBLISHABLE_KEY` | Not set — Clerk not wired (Wasp email auth is active) |
| `CLERK_SECRET_KEY` | Not set — Clerk not wired |
| `STRIPE_PUBLISHABLE_KEY` | Not set — Stripe checkout UI may not work |
| `PAYMENTS_STARTER_PLAN_PRICE_ID` | Not set — Stripe billing plans not configured |

---

## Schema Audit

### Prisma Models — Complete

```
User
  ├── seniors (1:N)
  ├── calls (1:N)
  ├── scheduledCalls (1:N)
  ├── userSubscriptions (1:N)
  └── creditTransactions (1:N)

Senior
  ├── calls (1:N)
  └── scheduledCalls (1:N)

Call
  ├── summary (1:1 CallSummary)
  ├── insights (1:N CallInsight)
  ├── user (N:1 User)
  └── senior (N:1 Senior)

ScheduledCall
  ├── calls (1:N)
  ├── user (N:1 User)
  └── senior (N:1 Senior)
```

### Missing Models — None identified for VAPI calling flow

### Potential Gaps
1. **`Call.rawRecordingUrl`** is String — needs real S3/storage URL (file upload not wired yet)
2. **`Senior.notes`** is free-text String — could be JSON for structured health/interest data
3. **`User.clerkUserId`** missing — if migrating fully to Clerk, add `@unique` field
4. **No `ScheduledCall.vapiCallSid`** — if a scheduled call fails mid-way, no way to track the Vapi SID back to the ScheduledCall (Call record tracks it)

---

## Email Audit

### `src/golden-voices/lib/emailNotifications.ts` — Status: OK

- Uses **Resend API** directly (not Wasp email sender)
- Guard: `if (!RESEND_API_KEY) return` — safe if key missing
- From: `"Golden Voices <no-reply@goldenvoices.app>"` — domain must be verified in Resend
- **One email type implemented:** `sendCallCompletedEmail`
  - Triggered in `vapiWebhook → handleCallEnd` when status = `completed`
  - Links to `${CLIENT_URL}/dashboard/calls/${callId}`

### Hardcoded Strings
| String | Location |
|--------|----------|
| `"Golden Voices"` | Header logo — brand name, no i18n |
| `"no-reply@goldenvoices.app"` | From address |
| `"Daily connection for the people who matter most"` | Tagline in email header |
| `"Your call with ${seniorName} is complete"` | Subject + headline |
| `"You're receiving this because you have an active account."` | Email footer |

### Not Yet Implemented
- [ ] Welcome email on signup
- [ ] Low credits warning email
- [ ] Subscription expiry notice
- [ ] Weekly summary digest

---

## Env Var Arrival Log

| Date | Vars That Arrived |
|------|-------------------|
| 2026-05-02 | DB, OpenAI, Resend, Stripe |
| 2026-05-03 | Still waiting: VAPI keys |

---

## Ship Readiness

### Can ship immediately once blockers resolved:
1. **All 10 pages** — UI built, working with static data
2. **Stripe webhook** — registered at `POST /payments-webhook`
3. **VAPI webhook** — registered at `POST /webhooks/vapi`
4. **PgBoss jobs** — `processScheduledCalls` and `generateCallSummary` auto-run when DB connected
5. **Email** — Resend wired, just needs domain verification

### Needs work before production:
1. **VAPI assistant configuration** — create AI assistant in Vapi dashboard (en/ur/hi prompts, voice, greeting)
2. **Resend domain verification** — `goldenvoices.app` must be verified at https://resend.com/domains
3. **Stripe billing plans** — configure products at `PAYMENTS_STARTER_PLAN_PRICE_ID` / `PAYMENTS_PREMIUM_PLAN_PRICE_ID`
4. **Clerk SSO** — decide: keep Wasp email auth or migrate to Clerk
5. **S3/file uploads** — `Call.rawRecordingUrl` needs real storage
6. **Production deployment** — Vercel, Railway, or Fly.io
7. **Wasp CLI upgrade** — `@ali must run: npm install -g @wasp.sh/wasp-cli@^0.23.0`

---

## Action Items for @ali

- [ ] **Run Wasp CLI upgrade manually** on VPS: `npm install -g @wasp.sh/wasp-cli@^0.23.0`
- [ ] **Set VAPI keys** in `.env.server` — from https://app.vapi.ai:
  - `VAPI_PRIVATE_KEY`
  - `VAPI_ASSISTANT_ID` (create outbound assistant with en/ur/hi prompts)
  - `VAPI_PHONE_NUMBER_ID` (buy outbound-capable number)
- [ ] **Verify `goldenvoices.app` domain** in Resend — https://resend.com/domains
- [ ] **Create Stripe products** — https://dashboard.stripe.com → Products, then set:
  - `PAYMENTS_STARTER_PLAN_PRICE_ID`
  - `PAYMENTS_PREMIUM_PLAN_PRICE_ID`
- [ ] **Register Stripe webhook** — point to `https://your-domain.com/payments-webhook`
- [ ] **Register VAPI webhook** — point to `https://your-domain.com/webhooks/vapi`
- [ ] **Decide: Clerk or Wasp email auth?** Currently Wasp email is active, Clerk vars declared but unused

---

## Quick Start (once all blockers resolved)

```bash
cd /root/Golden-Voices-Wasp/template/app

# Verify Wasp CLI version
wasp --version  # must be >= 0.23.0

# Run database migrations
npx wasp db migrate-dev

# Start development server
npx wasp start
```
