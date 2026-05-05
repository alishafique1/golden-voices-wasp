# Golden Voices Connect — Setup Status

**Last updated:** 2026-05-05 18:50 UTC
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
| `vapiWebhookMiddlewareConfigFn` | ✅ | Exported and correct |
| Zod schema — VAPI/AI/Resend vars | ✅ | `.min(1)` required — blocks start without real keys |

---

## Env Var Status

### Present in `.env.server` (2026-05-05 11:43 UTC)

| Env Var | Status |
|---|---|
| `DATABASE_URL` | ✅ Set (Neon, shared_apps schema, golden_voices) |
| `OPENAI_API_KEY` | ✅ Set |
| `RESEND_API_KEY` | ✅ Set |
| `STRIPE_API_KEY` | ✅ Set |
| `STRIPE_WEBHOOK_SECRET` | ✅ Set |
| `ADMIN_EMAILS` | ✅ Set |

### Missing from `.env.server` — BLOCKING LAUNCH

| Env Var | Blocker Level | Notes |
|---|---|---|
| `VAPI_PRIVATE_KEY` | **CRITICAL** | Outbound calls blocked — app refuses to start without this |
| `VAPI_ASSISTANT_ID` | **CRITICAL** | Outbound calls blocked — app refuses to start without this |
| `VAPI_PHONE_NUMBER_ID` | **CRITICAL** | Outbound calls blocked — app refuses to start without this |
| `CLIENT_URL` | HIGH | Email CTAs use localhost fallback; needs `https://goldenvoices.app` |
| `STRIPE_PUBLISHABLE_KEY` | LOW | Stripe checkout needs this (webhook-only works without) |

### Missing from `.env.server.example` (2026-05-05 audit) — Will block when those features are wired

| Env Var | Blocker Level | Notes |
|---|---|---|
| `PAYMENTS_HOBBY_SUBSCRIPTION_PLAN_ID` | HIGH | Required by `stripeEnvSchema` — Stripe checkout needs this |
| `PAYMENTS_PRO_SUBSCRIPTION_PLAN_ID` | HIGH | Required by `stripeEnvSchema` |
| `PAYMENTS_CREDITS_10_PLAN_ID` | HIGH | Required by `stripeEnvSchema` |
| `AWS_S3_REGION` | HIGH | Required by `fileUploadEnvSchema` — file uploads blocked |
| `AWS_S3_IAM_ACCESS_KEY` | HIGH | Required by `fileUploadEnvSchema` |
| `AWS_S3_IAM_SECRET_KEY` | HIGH | Required by `fileUploadEnvSchema` |
| `AWS_S3_FILES_BUCKET` | HIGH | Required by `fileUploadEnvSchema` |
| `PLAUSIBLE_API_KEY` | LOW | Optional analytics — commented out in `.env.server.example` |
| `PLAUSIBLE_SITE_ID` | LOW | Optional analytics |
| `PLAUSIBLE_BASE_URL` | LOW | Optional analytics |
| `GOOGLE_ANALYTICS_*` | LOW | Optional analytics — commented out in `.env.server.example` |

### .env.server vs .env.server.example Diff

```
.env.server has:        DATABASE_URL, OPENAI_API_KEY, RESEND_API_KEY,
                         STRIPE_API_KEY, STRIPE_WEBHOOK_SECRET, ADMIN_EMAILS
.env.server.example:    All 14 variables with <placeholder> values
```

> **Note:** VAPI vars are required (`.min(1)`) — app blocks startup without them. This is intentional and correct.

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

After upgrade, attempt start:

```bash
cd /root/Golden-Voices-Wasp/template/app
wasp db migrate-dev
wasp start
```

> **Confirmed 2026-05-05:** `wasp start` fails with version mismatch before any env var check runs. VAPI env vars are the runtime blocker; CLI version is the compile blocker.

---

## Git Push

```bash
git remote -v
# origin  git@github.com:alishafique1/golden-voices-wasp.git (push)  ← SSH ✅
# origin  https://x-access-token:***@github.com/... (fetch)

git push origin hermes
```
