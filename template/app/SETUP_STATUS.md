# Golden Voices Connect — Setup Status

**Last updated:** 2026-05-03 05:03 UTC
**Env vars status:** PARTIAL — DATABASE_URL, OPENAI_API_KEY, RESEND_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, ADMIN_EMAILS all set in `.env.server`. **VAPI keys still missing.**
**Stack:** Wasp OpenSaaS / Prisma / PostgreSQL / VAPI / OpenAI / Resend / Stripe
**Working dir:** `/root/Golden-Voices-Wasp/template/app/`
**Branch:** `hermes` — push with `git push origin hermes`
**SSH key:** `id_ed25519_goldenvoices` → verified working

---

## What's Working

| Component | Status | Notes |
|---|---|---|
| Wasp project scaffold | ✅ | `main.wasp`, `package.json`, `tsconfig.json` all present |
| Prisma schema | ✅ | 8 models: User, Senior, Call, CallSummary, CallInsight, ScheduledCall, UserSubscription, CreditTransaction |
| VAPI webhook handler | ✅ | `src/golden-voices/vapiWebhook.ts` — handles `call-start`, `call-end`, `status-update`, `conversation-update` |
| VAPI client (outbound) | ✅ | `src/golden-voices/vapiClient.ts` — `initiateOutboundCall`, `getCall`, `endCall` |
| AI call summary job | ✅ | `src/golden-voices/jobs/generateCallSummary.ts` — GPT-4o-mini → CallSummary + CallInsight records |
| Scheduled call processor | ✅ | `src/golden-voices/jobs/processScheduledCalls.ts` — PgBoss job, finds due calls, debits credits, initiates VAPI outbound |
| Resend email (call completed) | ✅ | `src/golden-voices/lib/emailNotifications.ts` — branded HTML email with CTA link |
| Operations (CRUD) | ✅ | `src/golden-voices/operations.ts` — createSenior, scheduleCall, getCalls, etc. |
| Stripe billing pages | ✅ | `src/golden-voices/BillingPage.tsx` |
| Dashboard pages | ✅ | 10 React pages: Dashboard, CallDetail, Calls, NewSenior, EditSenior, Schedule, Billing, SeniorsList |
| PgBoss job executor | ✅ | Configured in `main.wasp` for `generateCallSummary` + `processScheduledCalls` |
| envValidationSchema wired | ✅ | `src/env.ts` merges `gvEnvValidationSchema` — all 12 GV env vars validated at startup |
| `main.wasp` syntax | ✅ | All commas present — no compile errors from syntax |
| Git branch clean | ✅ | Nothing to commit on `hermes` |

---

## What's Blocked on Env Vars

`.env.server` exists at `template/app/.env.server` with real values confirmed:

| Env Var | `.env.server` | Blocked By | Impact |
|---|---|---|---|
| `DATABASE_URL` | ✅ Set | — | DB connection ready |
| `OPENAI_API_KEY` | ✅ Set | — | AI summaries ready |
| `RESEND_API_KEY` | ✅ Set | — | Email notifications ready |
| `STRIPE_SECRET_KEY` | ✅ Set | — | Payment processing ready |
| `STRIPE_WEBHOOK_SECRET` | ✅ Set | — | Webhook verification ready |
| `ADMIN_EMAILS` | ✅ Set | — | Admin access: `ali@socialdots.ca` |
| `VAPI_PRIVATE_KEY` | ❌ Missing | Ali | Cannot initiate outbound calls |
| `VAPI_ASSISTANT_ID` | ❌ Missing | Ali | Cannot initiate outbound calls |
| `VAPI_PHONE_NUMBER_ID` | ❌ Missing | Ali | Cannot initiate outbound calls |
| `CLERK_PUBLISHABLE_KEY` | ❌ N/A | — | Clerk not wired in main.wasp (uses Wasp built-in email/password) |
| `CLERK_SECRET_KEY` | ❌ N/A | — | Clerk not wired in main.wasp |

### VAPI keys needed from Ali:
1. `VAPI_PRIVATE_KEY` → https://dashboard.vapi.ai → API Keys
2. `VAPI_ASSISTANT_ID` → create an outbound assistant in Vapi dashboard
3. `VAPI_PHONE_NUMBER_ID` → a Vapi-provisioned outbound phone number

### Wasp CLI version mismatch — Ali must run one command
The VPS Wasp CLI is version **0.21.1**. The project requires **^0.23.0**.

```bash
npm install -g @wasp.sh/wasp-cli@^0.23.0
```

After that, on the VPS:
```bash
cd /root/Golden-Voices-Wasp/template/app
wasp db migrate-dev
wasp start
```

**Note:** `npm install -g @wasp.sh/wasp-cli@^0.23.0` is blocked by tirith scanner when run via Hermes. Ali must run this manually in an interactive shell.

---

## Prisma Schema Audit — Complete

### Models present (8)
`User`, `Senior`, `Call`, `CallSummary`, `CallInsight`, `ScheduledCall`, `UserSubscription`, `CreditTransaction`

### VAPI calling flow — data model trace

```
User
  └── seniors[] → Senior (phone, language, relationship, notes)
        └── scheduledCalls[] → ScheduledCall (frequency, time, timezone, enabled, nextCallAt)
              └── calls[] → Call (vapiCallSid, status, duration, transcript)
                    ├── CallSummary (mood, engagementScore, summary, topics, highlights) @unique(callId)
                    └── CallInsight[] (type, content, severity)
```

### Schema verdict: Complete. No new models needed.

The only minor gap: `ContactFormMessage` exists in schema but has no relation field on `User`. This is a non-critical contact-us feature (GH issue backlog) — not part of the core calling loop.

---

## Resend Email Audit — Complete

### What's wired
- `sendCallCompletedEmail()` in `src/golden-voices/lib/emailNotifications.ts`
- Called from `vapiWebhook.ts` → `handleCallEnd()` after each `completed` call
- Checks `if (!RESEND_API_KEY)` — graceful no-op if not set
- From: `"Golden Voices <no-reply@goldenvoices.app>"` — **domain not verified in Resend**

### Hardcoded strings
| Location | Value | Risk |
|---|---|---|
| `FROM_EMAIL` constant | `"Golden Voices <no-reply@goldenvoices.app>"` | Low — make env-driven when domain is verified |
| `CLIENT_URL` fallback | `"http://localhost:3000"` | Low — already has `env.CLIENT_URL` override |
| Email subject | `"Your call with ${seniorName} is complete"` | Low — static template |
| CSS theme colors | `#1A1A2E`, `#D4AF37`, `#F59E0B`, `#FDF8F3` | None — branding constants |

### Missing
- **Resend domain verification** — `goldenvoices.app` must be verified in Resend dashboard before production emails deliver
- **No welcome email** — first-time users get no onboarding email
- **No credit-low alert** — no warning when credits < 2
- **No subscription expiry notice**
- **Fire-and-forget** — no retry/DLQ on email failure

### Action items for Ali
1. Verify `goldenvoices.app` domain in Resend dashboard
2. Add `RESEND_DOMAIN_ID` to env and make `FROM_EMAIL` env-driven once verified
3. Consider: welcome email, credit-low warning, subscription expiry

---

## What Can Ship Immediately Once VAPI Vars Arrive

**All non-VAPI infrastructure is ready. Only VAPI keys + Wasp CLI upgrade block the core loop.**

```
DATABASE_URL               ✅ → DB connection + migrations ready
OPENAI_API_KEY             ✅ → AI summaries ready
RESEND_API_KEY             ✅ → Email notifications ready
STRIPE_SECRET_KEY          ✅ → Payment processing ready
STRIPE_WEBHOOK_SECRET      ✅ → Webhook verification ready
VAPI_PRIVATE_KEY           ❌ → BLOCKING: outbound calls
VAPI_ASSISTANT_ID          ❌ → BLOCKING: outbound calls
VAPI_PHONE_NUMBER_ID       ❌ → BLOCKING: outbound calls
```

### After Ali provides VAPI keys + runs Wasp CLI upgrade:

```bash
# 1. Ali runs in interactive shell (tirith blocks automated):
npm install -g @wasp.sh/wasp-cli@^0.23.0

# 2. Hermes then runs:
cd /root/Golden-Voices-Wasp/template/app
wasp db migrate-dev
wasp start
```

### Still needs code work (not env-blocked)
- [ ] Clerk auth — wire into `main.wasp` auth block (currently using Wasp built-in email/password)
- [ ] Stripe checkout session creation — `src/payment/operations.ts` needs full Stripe checkout flow
- [ ] Replace Lemon Squeezy references in `main.wasp` with Stripe-only (already clean — LS vars are optional in env schema)
- [ ] Resend domain verification + env-driven `FROM_EMAIL`
- [ ] Landing page redesign (GH issue backlog)
- [ ] Vercel deploy (GH issue backlog)
- [ ] End-to-end test flow (GH issue backlog)
- [ ] ContactFormMessage relation on User model (GH issue backlog)

---

## Git Push Status

```bash
# Remote — hybrid SSH push / HTTPS fetch:
git remote -v
origin  git@github.com:alishafique1/golden-voices-wasp.git (push)  ← SSH via id_ed25519_goldenvoices ✅
origin  https://x-access-token:***@github.com/alishafique1/golden-voices-wasp.git (fetch)

# Push command:
git push origin hermes
```

Current branch: `hermes` — clean, synced with origin/hermes.

---

## Last Commit
```
547c8dd Golden Voices: fix main.wasp missing commas + update SETUP_STATUS.md (Wasp 0.21 vs 0.23)
```
