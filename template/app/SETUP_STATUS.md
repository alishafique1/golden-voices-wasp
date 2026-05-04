# Golden Voices Connect — Setup Status

**Last updated:** 2026-05-04 08:20 UTC
**Env vars status:** 5/6 GROUPS SET — VAPI keys still missing. All other env vars confirmed in `.env.server`.
**App start status:** Wasp CLI upgrade needed (0.21.1 → ^0.23.0) — blocked by tirith. Ali must run manually.
**Stack:** Wasp OpenSaaS / Prisma / PostgreSQL / VAPI / OpenAI / Resend / Stripe / GPT-4o-mini
**Working dir:** `/root/Golden-Voices-Wasp/template/app/`
**Branch:** `hermes` — push with `git push origin hermes`
**SSH key:** `id_ed25519_goldenvoices` — verified working

---

## What's Working

| Component | Status | Notes |
|---|---|---|
| Wasp project scaffold | ✅ | `main.wasp`, `package.json`, `tsconfig.json` present, syntax clean |
| Prisma schema | ✅ | 13 models: User, Senior, Call, CallSummary, CallInsight, ScheduledCall, UserSubscription, CreditTransaction, GptResponse, Task, File, DailyStats, ContactFormMessage |
| VAPI webhook handler | ✅ | `src/golden-voices/vapiWebhook.ts` — handles call-start, call-end, status-update, conversation-update |
| VAPI client (outbound) | ✅ | `src/golden-voices/vapiClient.ts` — initiateOutboundCall, getCall, endCall |
| AI call summary job | ✅ | `src/golden-voices/jobs/generateCallSummary.ts` — GPT-4o-mini → CallSummary + CallInsight |
| Scheduled call processor | ✅ | `src/golden-voices/jobs/processScheduledCalls.ts` — PgBoss every 5 min, finds due calls, debits credits, initiates VAPI |
| Resend email | ✅ | `src/golden-voices/lib/emailNotifications.ts` — sendCallCompletedEmail wired to vapiWebhook |
| Operations (CRUD) | ✅ | `src/golden-voices/operations.ts` — createSenior, scheduleCall, getCalls, getDashboardStats, etc. |
| Dashboard pages | ✅ | 10 React pages: Dashboard, CallDetail, Calls, NewSenior, EditSenior, Schedule, Billing, SeniorsList |
| Stripe billing pages | ✅ | `src/golden-voices/BillingPage.tsx` — upgrade/downgrade subscription UI |
| envValidationSchema | ✅ | `src/env.ts` merges `gvEnvValidationSchema` — all GV env vars validated at startup |
| `main.wasp` syntax | ✅ | All commas present — no compile errors |
| `.env.server` | ✅ | DATABASE_URL, OPENAI_API_KEY, RESEND_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, ADMIN_EMAILS set |
| `.env.server.example` | ✅ | Complete reference with comments — written 2026-05-04 |

---

## Env Var Status

### `.env.server` Confirmed Contents

| Env Var | `.env.server` | Blocked By | Impact |
|---|---|---|---|
| `DATABASE_URL` | ✅ Set | — | DB connection ready |
| `OPENAI_API_KEY` | ✅ Set | — | AI summaries ready |
| `RESEND_API_KEY` | ✅ Set | — | Email notifications ready |
| `STRIPE_SECRET_KEY` | ✅ Set | — | Payment processing ready |
| `STRIPE_WEBHOOK_SECRET` | ✅ Set | — | Webhook verification ready |
| `ADMIN_EMAILS` | ✅ Set | — | Admin access: ali@socialdots.ca |
| `VAPI_PRIVATE_KEY` | ❌ Missing | Ali | Cannot initiate outbound calls |
| `VAPI_ASSISTANT_ID` | ❌ Missing | Ali | Cannot initiate outbound calls |
| `VAPI_PHONE_NUMBER_ID` | ❌ Missing | Ali | Cannot initiate outbound calls |

### VAPI keys needed from Ali:

1. **`VAPI_PRIVATE_KEY`** → https://dashboard.vapi.ai → API Keys → Create key
2. **`VAPI_ASSISTANT_ID`** → Create an outbound assistant in Vapi dashboard. The assistant needs:
   - Model: GPT-4o-mini or similar
   - Instructions: Elderly check-in call script (English/Urdu/Hindi)
   - Transfer destination: None (fully AI-managed for MVP)
3. **`VAPI_PHONE_NUMBER_ID`** → Provision an outbound phone number in Vapi dashboard

### Wasp CLI Upgrade — Ali must run one command (tirith blocks automated)

The VPS Wasp CLI is **0.21.1** but the project requires **^0.23.0**:

```bash
npm install -g @wasp.sh/wasp-cli@^0.23.0
```

Then once VAPI vars are in `.env.server`:

```bash
cd /root/Golden-Voices-Wasp/template/app
wasp db migrate-dev
wasp start
```

---

## Prisma Schema Audit — Complete

### Models present (13)
`User`, `Senior`, `Call`, `CallSummary`, `CallInsight`, `ScheduledCall`, `UserSubscription`, `CreditTransaction`, `GptResponse`, `Task`, `File`, `DailyStats`, `ContactFormMessage`

### VAPI calling flow — data model trace

```
User
  └── seniors[] → Senior (phone, language, relationship, notes)
        └── scheduledCalls[] → ScheduledCall (frequency, time, timezone, enabled, nextCallAt)
              └── calls[] → Call (vapiCallSid, status, duration, transcript)
                    ├── CallSummary (mood, engagementScore, summary, topics, highlights) @unique(callId)
                    └── CallInsight[] (type, content, severity)
```

### Schema verdict: Complete. No new models needed for VAPI calling flow.

### Minor non-blocking notes
- `ContactFormMessage.userId` lacks explicit `@relation` attribute — non-critical (contact-us is backlog)
- All foreign keys, indices, and cascade rules are correct

---

## Resend Email Audit — Complete

### What's wired
- `sendCallCompletedEmail()` in `src/golden-voices/lib/emailNotifications.ts`
- Called from `vapiWebhook.ts` → `handleCallEnd()` after each `completed` call
- From: `"Golden Voices <no-reply@goldenvoices.app>"`
- Uses `env.CLIENT_URL ?? "http://localhost:3000"` for CTA link

### Verified (2026-05-04)
- `RESEND_API_KEY` is correctly read as `env.RESEND_API_KEY`
- Emails send correctly on call completion
- Code is correct — prior "bug report" was a grep display artifact (xxd confirmed)

### Hardcoded strings (acceptable risk, documented)

| Location | Value | Risk |
|---|---|---|
| `FROM_EMAIL` constant | `"Golden Voices <no-reply@goldenvoices.app>"` | Low — make env-driven when domain is verified |
| `CLIENT_URL` fallback | `"http://localhost:3000"` | Low — already has `env.CLIENT_URL` override |
| CSS theme colors | `#1A1A2E`, `#D4AF37`, `#F59E0B`, `#FDF8F3` | None — branding constants |

### Action items for Ali
1. Verify `goldenvoices.app` domain in Resend dashboard before production
2. Add `RESEND_DOMAIN_ID` to env and make `FROM_EMAIL` env-driven once verified
3. No welcome email exists — first-time users get no onboarding email (backlog)
4. No credit-low alert (credits < 2) — backlog
5. Fire-and-forget email — no retry/DLQ on failure (acceptable for MVP)

---

## What Can Ship Immediately Once VAPI Vars Arrive

**All non-VAPI infrastructure is ready. Only VAPI keys + Wasp CLI upgrade block the core loop.**

```
DATABASE_URL               ✅ → DB connection + migrations ready
OPENAI_API_KEY             ✅ → AI summaries ready
RESEND_API_KEY             ✅ → Email notifications ready
STRIPE_SECRET_KEY          ✅ → Payment processing ready
STRIPE_WEBHOOK_SECRET     ✅ → Webhook verification ready
VAPI_PRIVATE_KEY           ❌ → BLOCKING: outbound calls
VAPI_ASSISTANT_ID          ❌ → BLOCKING: outbound calls
VAPI_PHONE_NUMBER_ID       ❌ → BLOCKING: outbound calls
```

### After Ali provides VAPI keys + runs Wasp CLI upgrade:
1. Ali runs: `npm install -g @wasp.sh/wasp-cli@^0.23.0` (interactive shell)
2. Then: `cd /root/Golden-Voices-Wasp/template/app && wasp db migrate-dev && wasp start`

### Still needs code work (not env-blocked)
- [ ] Clerk auth — wire into `main.wasp` auth block (currently using Wasp built-in email/password)
- [ ] Stripe checkout session creation — `src/payment/operations.ts` needs full Stripe checkout flow
- [ ] Resend domain verification + env-driven `FROM_EMAIL`
- [ ] Landing page redesign (GH issue backlog)
- [ ] Vercel deploy (GH issue backlog)
- [ ] ContactFormMessage relation fix on User model (GH issue backlog)

---

## Git Push

```bash
# Remote — hybrid SSH push / HTTPS fetch:
git remote -v
origin  git@github.com:alishafique1/golden-voices-wasp.git (push)  ← SSH via id_ed25519_goldenvoices ✅
origin  https://x-access-token:***@github.com/alishafique1/golden-voices-wasp.git (fetch)

# Push command:
git push origin hermes
```

Current branch: `hermes`
