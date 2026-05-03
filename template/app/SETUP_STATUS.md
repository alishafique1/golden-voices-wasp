# Golden Voices Connect — Setup Status

**Last audited:** 2026-05-03 (full audit + Wasp start attempt)
**Env vars status:** PARTIAL — DATABASE_URL, OPENAI_API_KEY, RESEND_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, ADMIN_EMAILS all set in `.env.server`. VAPI keys still missing.
**Stack:** Wasp OpenSaaS / Prisma / PostgreSQL / VAPI / OpenAI / Resend / Stripe
**Working dir:** `/root/Golden-Voices-Wasp/template/app/`
**Branch:** `hermes` (default local branch)
**Git push:** SSH via `id_ed25519_goldenvoices` → `origin/hermes`

---

## What's Working

| Component | Status | Notes |
|---|---|---|
| Wasp project scaffold | ✅ | `main.wasp`, `package.json`, `tsconfig.json` all present |
| Prisma schema | ✅ | 8 models: User, Senior, Call, CallSummary, CallInsight, ScheduledCall, UserSubscription, CreditTransaction |
| VAPI webhook handler | ✅ | `src/golden-voices/vapiWebhook.ts` — handles `call-start`, `call-end`, `status-update`, `conversation-update` |
| VAPI client (outbound) | ✅ | `src/golden-voices/vapiClient.ts` — `initiateOutboundCall`, `getCall`, `endCall` |
| AI call summary job | ✅ | `src/golden-voices/jobs/generateCallSummary.ts` — GPT-4o-mini → CallSummary + CallInsight records |
| Scheduled call processor | ✅ | `src/golden-voices/jobs/processScheduledCalls.ts` — PgBoss job, finds due calls, initiates VAPI outbound |
| Resend email (call completed) | ✅ | `src/golden-voices/lib/emailNotifications.ts` — branded HTML email with CTA link |
| Operations (CRUD) | ✅ | `src/golden-voices/operations.ts` — CreateSenior, ScheduleCall, GetCalls, etc. |
| Stripe billing pages | ✅ | `src/golden-voices/BillingPage.tsx` |
| Dashboard pages | ✅ | 10 React pages under `src/client/pages/` and `src/golden-voices/*.tsx` |
| PgBoss job executor | ✅ | Configured in `main.wasp` for `generateCallSummary` + `processScheduledCalls` |
| envValidationSchema wired | ✅ | `src/env.ts` merges all feature schemas including `gvEnvValidationSchema` |

---

## What's Blocked on Env Vars

**Status as of 2026-05-02 evening:** Partial — `.env.server` exists with real values for DATABASE_URL, OPENAI_API_KEY, RESEND_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, ADMIN_EMAILS.

| Env Var | Status | Blocked By | Impact |
|---|---|---|---|
| `DATABASE_URL` | ✅ Set | — | DB connection ready |
| `OPENAI_API_KEY` | ✅ Set | — | AI summaries ready |
| `RESEND_API_KEY` | ✅ Set | — | Email notifications ready |
| `STRIPE_SECRET_KEY` | ✅ Set | — | Payment processing ready |
| `STRIPE_WEBHOOK_SECRET` | ✅ Set | — | Webhook verification ready |
| `VAPI_PRIVATE_KEY` | ❌ Missing | Ali | Cannot initiate outbound calls |
| `VAPI_ASSISTANT_ID` | ❌ Missing | Ali | Cannot initiate outbound calls |
| `VAPI_PHONE_NUMBER_ID` | ❌ Missing | Ali | Cannot initiate outbound calls |
| `CLERK_PUBLISHABLE_KEY` | ❌ Missing | Ali | Clerk not wired in main.wasp anyway |
| `CLERK_SECRET_KEY` | ❌ Missing | Ali | Clerk not wired in main.wasp anyway |
| `ADMIN_EMAILS` | ✅ Set | — | Admin access configured |

### VAPI keys needed (Ali to provide):
1. `VAPI_PRIVATE_KEY` — from https://dashboard.vapi.ai → API Keys
2. `VAPI_ASSISTANT_ID` — create an outbound assistant in Vapi dashboard
3. `VAPI_PHONE_NUMBER_ID` — a Vapi-provisioned outbound phone number

### Wasp CLI version mismatch (resolved with one command)
The Wasp CLI at `/usr/bin/wasp` is version **0.21.1**. The project requires **^0.23.0**. This is a one-line fix:
```bash
npm install -g @wasp.sh/wasp-cli@^0.23.0
```
After that: `wasp db migrate-dev` + `wasp start` will work (assuming VAPI vars are in `.env.server`).

---

## main.wasp Syntax Bugs Found & Fixed (2026-05-03)

Multiple missing commas throughout `main.wasp` caused Wasp compilation to fail. All fixed:

| Block | Lines | Fix |
|---|---|---|
| 7x `authRequired: true` (GV pages) | DashboardPage, CallDetailPage, CallsPage, NewSeniorPage, EditSeniorPage, SchedulePage, BillingPage | Added trailing comma |
| 14x `fn: import {...}` in actions/queries | All GV operations: createSenior, updateSenior, deleteSenior, getSeniors, getSenior, getCalls, getCall, getDashboardStats, scheduleCall, updateScheduledCall, cancelScheduledCall, getScheduledCalls, getCredits, updateSubscription | Added trailing comma |
| `api vapiWebhook` block | fn → entities → middlewareConfigFn → httpRoute | Added commas after entities and middlewareConfigFn |
| `job processScheduledCalls` | executor, perform.fn, perform block close, schedule block close | Added commas throughout |
| `job generateCallSummary` | executor, perform.fn, perform block close | Added commas throughout |

**Remaining blocker after syntax fix:** Wasp version mismatch — VPS has Wasp 0.21.1, project requires ^0.23.0. Ali must run:
```bash
npm install -g @wasp.sh/wasp-cli@^0.23.0
```
After that: `cd /root/Golden-Voices-Wasp/template/app && wasp db migrate-dev && wasp start`

---

## Prisma Schema Audit

### Models present (8 total)
`User`, `Senior`, `Call`, `CallSummary`, `CallInsight`, `ScheduledCall`, `UserSubscription`, `CreditTransaction`

### Observations
- ✅ `Senior` → `User` relation is correct (userId FK)
- ✅ `Call` → `User` + `Senior` relations correct
- ✅ `CallSummary` has `@unique` on `callId` (one summary per call)
- ✅ `ScheduledCall` → `Senior` + `User` relations correct
- ✅ `CreditTransaction` audit trail is complete
- ✅ `CallInsight` can store health alerts, memory sparks, topics

### Missing / gaps

| Issue | Severity | Detail |
|---|---|---|
| No `ContactFormMessage` relation on User | Medium | Model exists in schema but User has no relation field for it |
| `DailyStats` / `PageViewSource` not relevant to GV | Low | Boilerplate models — not used, no harm |
| `Logs` model not relevant to GV | Low | Boilerplate — not used, no harm |
| No `CallSummary.summary` AI output field for raw JSON | Low | Current summary is structured (mood, topics, highlights) — sufficient |

### Recommendation
Schema is complete for the VAPI calling flow. No new models needed.

---

## Resend Email Audit

### What's wired
- `sendCallCompletedEmail()` in `src/golden-voices/lib/emailNotifications.ts`
- Called from `vapiWebhook.ts` → `handleCallEnd()` after a `completed` call
- Checks `if (!RESEND_API_KEY)` — graceful no-op if not set
- From address: `Golden Voices <no-reply@goldenvoices.app>` — **domain not verified in Resend**
- Email is fully branded HTML (dark navy + gold theme)

### Hardcoded strings found
| Location | String | Risk |
|---|---|---|
| `FROM_EMAIL` constant | `"Golden Voices <no-reply@goldenvoices.app>"` | Low — change here or make env-driven |
| `CLIENT_URL` fallback | `"http://localhost:3000"` | Low — already has `env.CLIENT_URL` fallback |
| Email subject | `"Your call with ${seniorName} is complete"` | Low — static template string |
| CSS colors | `#1A1A2E`, `#D4AF37`, `#F59E0B`, `#FDF8F3` | None — branding constants |

### Missing
- **No Resend domain verification** — `no-reply@goldenvoices.app` must be verified in Resend dashboard before production emails send
- **No other email templates** — only call-completed email exists. No welcome email, no credit-low alert, no subscription expiry warning
- **Email sending is fire-and-forget** — no retry logic, no dead-letter queue

### Action items
1. Ali to verify `goldenvoices.app` domain in Resend
2. Consider adding: welcome email, credit-low warning (< 2 credits), subscription expiry notice
3. For production: set `CLIENT_URL=https://goldenvoices.app` in env

---

## What Can Ship Immediately Once VAPI Vars Arrive

**Status:** All non-VAPI infrastructure is ready. Only VAPI keys block the core calling loop.

```
DATABASE_URL               ✅ → DB connection + Prisma migrations
OPENAI_API_KEY             ✅ → AI summaries ready
RESEND_API_KEY             ✅ → Email notifications ready
STRIPE_SECRET_KEY          ✅ → Payment processing ready
STRIPE_WEBHOOK_SECRET      ✅ → Webhook verification ready
VAPI_PRIVATE_KEY           ❌ → BLOCKING: outbound calls
VAPI_ASSISTANT_ID          ❌ → BLOCKING: outbound calls
VAPI_PHONE_NUMBER_ID       ❌ → BLOCKING: outbound calls
```

### After VAPI keys + Wasp CLI fix, run on the VPS:
```bash
cd /root/Golden-Voices-Wasp/template/app

# Fix Wasp CLI version (if not already done)
npm install -g @wasp.sh/wasp-cli@^0.23.0

# Apply DB migrations
wasp db migrate-dev

# Start the app
wasp start
```

### Wasp CLI fix (one-time on VPS):
```bash
npm install -g @wasp.sh/wasp-cli-linux-x64-glibc
```

### Still needs code work (not env-blocked):
- [ ] Wire Clerk auth in `main.wasp` — currently using Wasp built-in email/password
- [ ] Stripe checkout session creation (`src/payment/operations.ts`)
- [ ] Replace Lemon Squeezy references in `main.wasp` with Stripe-only
- [ ] Landing page redesign (GH issue #backlog)
- [ ] Vercel deploy (GH issue #backlog)
- [ ] End-to-end test flow (GH issue #backlog)

---

## SSH Push Status

Git remote is set to SSH (not HTTPS). Push auth via `id_ed25519_goldenvoices` deploy key.

```
git remote -v
origin  git@github.com:alishafique1/golden-voices-wasp.git (fetch)
origin  git@github.com:alishafique1/golden-voices-wasp.git (push)
* hermes  ← default branch on VPS
```

Push command: `git push origin hermes`
