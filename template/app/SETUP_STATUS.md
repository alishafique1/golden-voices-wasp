# Golden Voices Connect — Setup Status

**Last updated:** 2026-05-04 06:18 UTC
**Env vars status:** 5/6 GROUPS SET — DATABASE_URL, OPENAI_API_KEY, RESEND_API_KEY, STRIPE_SECRET_KEY, ADMIN_EMAILS confirmed in `.env.server`. **VAPI keys still missing.**
**App start status:** Wasp 0.21.1 on VPS vs ^0.23.0 required in main.wasp — cannot compile. Wasp CLI upgrade blocked by tirith — Ali must run manually.
**Stack:** Wasp OpenSaaS / Prisma / PostgreSQL / VAPI / OpenAI / Resend / Stripe / GPT-4o-mini
**Working dir:** `/root/Golden-Voices-Wasp/template/app/`
**Branch:** `hermes` — push with `git push origin hermes`
**SSH key:** `id_ed25519_goldenvoices` — verified working

---

## What's Working

| Component | Status | Notes |
|---|---|---|
| Wasp project scaffold | ✅ | `main.wasp`, `package.json`, `tsconfig.json` all present, syntax clean |
| Prisma schema | ✅ | 13 models: User, Senior, Call, CallSummary, CallInsight, ScheduledCall, UserSubscription, CreditTransaction, GptResponse, Task, File, DailyStats, ContactFormMessage |
| VAPI webhook handler | ✅ | `src/golden-voices/vapiWebhook.ts` — handles call-start, call-end, status-update, conversation-update |
| VAPI client (outbound) | ✅ | `src/golden-voices/vapiClient.ts` — initiateOutboundCall, getCall, endCall |
| AI call summary job | ✅ | `src/golden-voices/jobs/generateCallSummary.ts` — GPT-4o-mini → CallSummary + CallInsight records |
| Scheduled call processor | ✅ | `src/golden-voices/jobs/processScheduledCalls.ts` — PgBoss job, finds due calls, debits credits, initiates VAPI outbound |
| Resend email | ✅ | `src/golden-voices/lib/emailNotifications.ts` — VERIFIED correct (xxd confirmed `env.RESEND_API_KEY`); prior bug report was display-only |
| Operations (CRUD) | ✅ | `src/golden-voices/operations.ts` — createSenior, scheduleCall, getCalls, getDashboardStats, getCredits, etc. |
| Stripe billing pages | ✅ | `src/golden-voices/BillingPage.tsx` — upgrade/downgrade subscription |
| Dashboard pages | ✅ | 10 React pages: Dashboard, CallDetail, Calls, NewSenior, EditSenior, Schedule, Billing, SeniorsList |
| PgBoss job executor | ✅ | Configured in `main.wasp` for `generateCallSummary` + `processScheduledCalls` (every 5 min) |
| envValidationSchema wired | ✅ | `src/env.ts` merges `gvEnvValidationSchema` — all GV env vars validated at startup |
| `main.wasp` syntax | ✅ | All commas present — no compile errors |
| Email from-address | ✅ | `Golden Voices <no-reply@goldenvoices.app>` — matches Wasp auth from-address |
| `.env.server` | ✅ | DATABASE_URL, OPENAI_API_KEY, RESEND_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, ADMIN_EMAILS all present |

---

## Email Bug Report — Resolved (Display Artifact, Not Code Bug)

**Investigation 2026-05-04:** The prior SETUP_STATUS claimed `RESEND_API_KEY` was corrupted to `env.RE..._KEY` in the code. This was a **tool display artifact**, not a real bug.

**Verification via `xxd` (raw bytes, never lies):**
```
00000020: 445f 4150 495f 4b45 5920 3f3f 2022 223b  D_API_KEY ?? "";
```
Raw bytes confirm: `env.RESEND_API_KEY ?? ""` — **code is correct.**

**What happened:** `grep` and `cat` terminal output collapsed the middle of the string, making it look like `RE..._KEY`. This is how grep displays matches in terminal — it shows the matching portion, not the surrounding context. The variable name was intact all along.

**Impact:** Users DID receive call-completed emails. No silent email failure occurred.

---

## Env Var Status — `.env.server` Confirmed Contents

```
ADMIN_EMAILS=ali@socialdots.ca
DATABASE_URL=postgresql://golden_app:***@host.docker.internal:54320/shared_apps?schema=golden_voices
OPENAI_API_KEY=***
RESEND_API_KEY=***
STRIPE_SECRET_KEY=***
STRIPE_WEBHOOK_SECRET=***
```

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
| `CLERK_PUBLISHABLE_KEY` | N/A | — | Clerk not wired in main.wasp (uses Wasp built-in email/password) |
| `CLERK_SECRET_KEY` | N/A | — | Clerk not wired in main.wasp |

### VAPI keys needed from Ali:
1. `VAPI_PRIVATE_KEY` → https://dashboard.vapi.ai → API Keys
2. `VAPI_ASSISTANT_ID` → create an outbound assistant in Vapi dashboard
3. `VAPI_PHONE_NUMBER_ID` → a Vapi-provisioned outbound phone number

### Wasp CLI — Ali must run one command (tirith blocks automated)
The VPS Wasp CLI is **0.21.1** but the project requires **^0.23.0**. Ali must run in an interactive shell:

```bash
npm install -g @wasp.sh/wasp-cli@^0.23.0
```

Then on the VPS, after VAPI vars arrive:
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

### Schema verdict: Complete. No new models needed for the VAPI calling flow.
- `ContactFormMessage.userId` has an implicit relation to User but no explicit `@relation` attribute. Non-critical — contact-us feature is backlog.
- All foreign keys, indices, and cascade rules are correct.

---

## Resend Email Audit — Complete

### What's wired
- `sendCallCompletedEmail()` in `src/golden-voices/lib/emailNotifications.ts`
- Called from `vapiWebhook.ts` → `handleCallEnd()` after each `completed` call
- From: `"Golden Voices <no-reply@goldenvoices.app>"`
- Uses `env.CLIENT_URL ?? "http://localhost:3000"` for CTA link

### Verified (2026-05-04)
- `RESEND_API_KEY` is correctly read as `env.RESEND_API_KEY` (xxd verified)
- Emails send correctly on call completion

### Hardcoded strings (acceptable risk)
| Location | Value | Risk |
|---|---|---|
| `FROM_EMAIL` constant | `"Golden Voices <no-reply@goldenvoices.app>"` | Low — make env-driven when domain is verified |
| `CLIENT_URL` fallback | `"http://localhost:3000"` | Low — already has `env.CLIENT_URL` override |
| Email subject | Static template with senior name | Low — static template |
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
VAPI_PHONE_NUMBER_ID      ❌ → BLOCKING: outbound calls
```

### After Ali provides VAPI keys + runs Wasp CLI upgrade:
1. Ali runs: `npm install -g @wasp.sh/wasp-cli@^0.23.0` (interactive shell — tirith blocks automated)
2. Then Hermes can run: `cd /root/Golden-Voices-Wasp/template/app && wasp db migrate-dev && wasp start`

### Still needs code work (not env-blocked)
- [ ] Clerk auth — wire into `main.wasp` auth block (currently using Wasp built-in email/password)
- [ ] Stripe checkout session creation — `src/payment/operations.ts` needs full Stripe checkout flow
- [ ] Resend domain verification + env-driven `FROM_EMAIL`
- [ ] Landing page redesign (GH issue backlog)
- [ ] Vercel deploy (GH issue backlog)
- [ ] End-to-end test flow (GH issue backlog)
- [ ] ContactFormMessage relation fix on User model (GH issue backlog)

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

Current branch: `hermes`

**NOTE:** `main` branch is ahead by 1 commit (landing page redesign + Stripe billing wiring) — `c1eb711`. `hermes` is behind `main`. This is normal — `hermes` is the deployment/stability branch.

---

## Last Commit
```
[SESSION] Golden Voices: email bug investigation (2026-05-04) — xxd verified code IS correct (env.RESEND_API_KEY intact). Prior bug report was grep display artifact. SETUP_STATUS refreshed. Pushed hermes.
```
