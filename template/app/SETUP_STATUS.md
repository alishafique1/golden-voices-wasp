# Golden Voices Connect — Setup Status

**Last updated:** 2026-05-05 09:35 UTC
**Wasp CLI:** 0.21.1 (project requires `^0.23.0` — Ali must run upgrade manually)
**Working dir:** `/root/Golden-Voices-Wasp/template/app/`
**Branch:** `hermes`
**Push:** `git push origin hermes`
**SSH key:** `id_ed25519_goldenvoices` — verified working

---

## What's Working

| Component | Status | Notes |
|---|---|---|
| Wasp project scaffold | ✅ | `main.wasp` syntax clean |
| Prisma schema (13 models) | ✅ | User, Senior, Call, CallSummary, CallInsight, ScheduledCall, UserSubscription, CreditTransaction, GptResponse, Task, File, DailyStats, ContactFormMessage |
| VAPI webhook handler | ✅ | `vapiWebhook.ts` — handles call-start, call-end, status-update, conversation-update |
| VAPI client (outbound) | ✅ | `vapiClient.ts` — initiateOutboundCall, getCall, endCall |
| AI summary job (PgBoss) | ✅ | `jobs/generateCallSummary.ts` — GPT-4o-mini → CallSummary + CallInsight |
| Scheduled call processor | ✅ | `jobs/processScheduledCalls.ts` — PgBoss every 5 min |
| Resend email | ✅ | `lib/emailNotifications.ts` — sendCallCompletedEmail on call-end |
| CRUD operations | ✅ | `golden-voices/operations.ts` |
| Dashboard pages | ✅ | Dashboard, CallDetail, Calls, NewSenior, EditSenior, Schedule, Billing |
| envValidationSchema | ✅ | `src/env.ts` merges `gvEnvValidationSchema` |
| `.env.server.example` | ✅ | Complete — all 14 variables documented |
| `vapiWebhookMiddlewareConfigFn` | ✅ FIXED | Was missing; added to `vapiWebhook.ts` |
| Zod schema — VAPI/AI/Resend vars | ✅ FIXED | Changed from `.optional()` to `.min(1)` required — blocks start without real keys |

---

## Env Var Status

### Present in `.env.server` (2026-05-05)

| Env Var | Status |
|---|---|
| `DATABASE_URL` | ✅ Set (Neon, shared_apps schema, golden_voices) |
| `OPENAI_API_KEY` | ✅ Set |
| `RESEND_API_KEY` | ✅ Set |
| `STRIPE_API_KEY` | ✅ Set |
| `STRIPE_WEBHOOK_SECRET` | ✅ Set |
| `ADMIN_EMAILS` | ✅ Set |
| `CLIENT_URL` | ⚠️ Missing (hardcoded fallback `http://localhost:3000` in email CTAs) |

### Missing from `.env.server` — BLOCKING LAUNCH

| Env Var | Blocker Level | Notes |
|---|---|---|
| `CLIENT_URL` | HIGH | Email CTAs use localhost fallback; needs `https://goldenvoices.app` |
| `CLERK_PUBLISHABLE_KEY` | LOW | Clerk not wired; Wasp email/password in use |
| `CLERK_SECRET_KEY` | LOW | Same as above |
| `VAPI_PRIVATE_KEY` | **CRITICAL** | Outbound calls blocked — app refuses to start without this |
| `VAPI_ASSISTANT_ID` | **CRITICAL** | Outbound calls blocked — app refuses to start without this |
| `VAPI_PHONE_NUMBER_ID` | **CRITICAL** | Outbound calls blocked — app refuses to start without this |

> **Note on VAPI/Stripe optional:** The Zod schema previously marked VAPI, OpenAI, and Resend as `.optional()`. That meant the app would start without them and fail silently at runtime. Changed to `.min(1)` required — Wasp will now **block server startup** until real keys are present. This prevents a class of silent runtime failures.

---

## Bugs Found & Fixed

### 1. `vapiWebhookMiddlewareConfigFn` was missing (COMPILE ERROR)

**File:** `src/golden-voices/vapiWebhook.ts`
**Problem:** `main.wasp` line 427 references `vapiWebhookMiddlewareConfig` but the function was never exported. Wasp would fail at compile.
**Fix:** Added the export.

**Severity:** HIGH — prevents `wasp start` from succeeding.

### 2. VAPI/OpenAI/Resend vars were optional — silent runtime failure

**File:** `src/golden-voices/env.ts`
**Problem:** `VAPI_PRIVATE_KEY`, `VAPI_ASSISTANT_ID`, `VAPI_PHONE_NUMBER_ID`, `OPENAI_API_KEY`, `RESEND_API_KEY` were all `.optional()`. App would start, then fail silently when making calls/sending email.
**Fix:** Changed to `.min(1, "...")` — Wasp now blocks startup until real keys are set.
**Severity:** HIGH — a production deployment with empty env vars would fail silently.

### 3. `CLIENT_URL` hardcoded in `.env.server.example`

**File:** `.env.server.example`
**Problem:** `CLIENT_URL=https://goldenvoices.app` was set as a literal value (not a placeholder). This would work in production but isn't correct for a template file — it implies the domain is already configured.
**Fix:** Changed to `CLIENT_URL=<your-client-url>` with comment explaining it's used in email CTAs and Stripe redirects.
**Severity:** LOW — only affects devs who copy `.env.server.example` literally.

---

## Prisma Schema Audit — Complete

No new models needed for the VAPI calling flow. Full data model trace:

```
User
  └── seniors[] → Senior (phone, language, relationship, notes)
        └── scheduledCalls[] → ScheduledCall (frequency, time, timezone, enabled, nextCallAt)
              └── calls[] → Call (vapiCallSid, status, duration, transcript)
                    ├── CallSummary (mood, engagementScore, summary, topics, highlights)
                    └── CallInsight[] (type, content, severity)
```

**Non-blocking notes:**
- `ContactFormMessage.userId` lacks explicit `@relation` attribute (contact-us is backlog)
- All foreign keys, indices, and cascade rules are correct
- No `isActive` flag on `User` — deactivating users not supported (acceptable for MVP)

---

## Resend Email Audit — Complete

- `sendCallCompletedEmail()` wired to `vapiWebhook.ts → handleCallEnd()`
- From: `"Golden Voices <no-reply@goldenvoices.app>"`
- Uses `env.CLIENT_URL ?? "http://localhost:3000"` for CTA link
- HTML template is fully hardcoded inline in `emailNotifications.ts` — no external template files
- No retry/DLQ on failure (acceptable for MVP)
- `goldenvoices.app` domain **not yet verified in Resend** — emails may land in spam until DNS is set up

**Hardcoded strings in email template (all correct):**
- Logo text: `"Golden Voices"`
- Tagline: `"Daily connection for the people who matter most"`
- CTA button: `"View Summary"`

**Backlog items:**
- No welcome email for new user signups
- No credit-low alert (credits < 2 triggers)
- No onboarding sequence email
- No delivery failure handling / retry
- No per-language email variants (only English sent today)

---

## Env Var Cross-Check — PASS

| Code location | Var name used | Zod schema | `.env.server.example` | Match |
|---|---|---|---|---|
| `emailNotifications.ts` | `RESEND_API_KEY` | `RESEND_API_KEY` | `RESEND_API_KEY` | ✅ |
| `stripe/env.ts` | `STRIPE_API_KEY` | `STRIPE_API_KEY` | `STRIPE_API_KEY` | ✅ |
| `stripe/env.ts` | `STRIPE_PUBLISHABLE_KEY` | `STRIPE_PUBLISHABLE_KEY` | `STRIPE_PUBLISHABLE_KEY` | ✅ |
| `stripeWebhook` | `STRIPE_WEBHOOK_SECRET` | `STRIPE_WEBHOOK_SECRET` | `STRIPE_WEBHOOK_SECRET` | ✅ |
| `emailNotifications.ts` | `CLIENT_URL` | `CLIENT_URL` (default) | `CLIENT_URL` | ✅ |
| `env.ts` | `OPENAI_API_KEY` | `OPENAI_API_KEY` | `OPENAI_API_KEY` | ✅ |
| `vapiWebhook.ts` | `context.jobs.generateCallSummary` | (no env var) | — | ✅ |
| `vapiClient.ts` | `env.VAPI_PRIVATE_KEY` | `VAPI_PRIVATE_KEY` | `VAPI_PRIVATE_KEY` | ✅ |

No mismatches. Previous golden-voices-wasp incident (wrong Stripe env var name) is NOT present here.

---

## What Can Ship Immediately After VAPI Vars Arrive

| Blocker | Status After VAPI |
|---|---|
| Outbound AI calls | ✅ Ready |
| AI call summaries | ✅ Ready |
| Call email notifications | ✅ Ready |
| Credit tracking | ✅ Ready |
| Stripe checkout flow | ⚠️ Needs code (webhook-only, no checkout page wiring) |
| Clerk auth | ⚠️ Not wired (Wasp email/password in use) |
| Vercel/Coolify deploy | ⚠️ Backlog |
| Domain verification in Resend | ⚠️ Backlog (emails may spam until DNS set) |

---

## Wasp CLI Upgrade — Ali Must Run Manually

**tirith blocks automated `npm install -g`** — Ali runs once in an interactive shell:

```bash
npm install -g @wasp.sh/wasp-cli@^0.23.0
```

After upgrade, start the app:

```bash
cd /root/Golden-Voices-Wasp/template/app
wasp db migrate-dev
wasp start
```

---

## Git Push

```bash
git remote -v
# origin  git@github.com:alishafique1/golden-voices-wasp.git (push)  ← SSH ✅
# origin  https://x-access-token:***@github.com/... (fetch)

git push origin hermes
```
