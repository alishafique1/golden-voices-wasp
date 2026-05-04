# Golden Voices Connect — Setup Status

**Last updated:** 2026-05-04 10:30 UTC
**Wasp CLI:** 0.21.1 (project requires `^0.23.0` — Ali must run upgrade manually)
**Working dir:** `/root/Golden-Voices-Wasp/template/app/`
**Branch:** `hermes`
**Push:** `git push origin hermes`
**SSH key:** `id_ed25519_goldenvoices` — verified working

---

## What's Working

| Component | Status | Notes |
|---|---|---|
| Wasp project scaffold | ✅ | `main.wasp` syntax clean, all commas present |
| Prisma schema (13 models) | ✅ | User, Senior, Call, CallSummary, CallInsight, ScheduledCall, UserSubscription, CreditTransaction, GptResponse, Task, File, DailyStats, ContactFormMessage |
| VAPI webhook handler | ✅ | `vapiWebhook.ts` — handles call-start, call-end, status-update, conversation-update |
| VAPI client (outbound) | ✅ | `vapiClient.ts` — initiateOutboundCall, getCall, endCall |
| AI summary job (PgBoss) | ✅ | `jobs/generateCallSummary.ts` — GPT-4o-mini → CallSummary + CallInsight |
| Scheduled call processor | ✅ | `jobs/processScheduledCalls.ts` — PgBoss every 5 min |
| Resend email | ✅ | `lib/emailNotifications.ts` — sendCallCompletedEmail on call-end |
| CRUD operations | ✅ | `golden-voices/operations.ts` |
| Dashboard pages | ✅ | Dashboard, CallDetail, Calls, NewSenior, EditSenior, Schedule, Billing |
| envValidationSchema | ✅ | `src/env.ts` merges `gvEnvValidationSchema` |
| `.env.server` | ✅ | DATABASE_URL, OPENAI_API_KEY, RESEND_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, ADMIN_EMAILS |
| `.env.server.example` | ✅ | Complete reference — updated 2026-05-04 |

---

## Env Var Status

### Present in `.env.server`

| Env Var | Value | Status |
|---|---|---|
| `DATABASE_URL` | ✅ Set | DB connection ready |
| `OPENAI_API_KEY` | ✅ Set | AI summaries ready |
| `RESEND_API_KEY` | ✅ Set | Email notifications ready |
| `STRIPE_SECRET_KEY` | ✅ Set | Payment processing ready |
| `STRIPE_WEBHOOK_SECRET` | ✅ Set | Webhook verification ready |
| `ADMIN_EMAILS` | ✅ Set | ali@socialdots.ca |
| `VAPI_PRIVATE_KEY` | ❌ Missing | BLOCKING — outbound calls |
| `VAPI_ASSISTANT_ID` | ❌ Missing | BLOCKING — outbound calls |
| `VAPI_PHONE_NUMBER_ID` | ❌ Missing | BLOCKING — outbound calls |

### Missing: VAPI Keys (needed from Ali)

1. **`VAPI_PRIVATE_KEY`** → https://dashboard.vapi.ai → API Keys → Create key
2. **`VAPI_ASSISTANT_ID`** → Create outbound assistant: GPT-4o-mini, elderly check-in (en/ur/hi)
3. **`VAPI_PHONE_NUMBER_ID`** → Provision outbound phone number in Vapi dashboard

---

## Wasp CLI Upgrade — Ali Must Run Manually

**tirith blocks automated `npm install -g`** — Ali runs this once in an interactive shell:

```bash
npm install -g @wasp.sh/wasp-cli@^0.23.0
```

After upgrade, to start the app:

```bash
cd /root/Golden-Voices-Wasp/template/app
wasp db migrate-dev
wasp start
```

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

Non-blocking notes:
- `ContactFormMessage.userId` lacks explicit `@relation` attribute (contact-us is backlog)
- All foreign keys, indices, and cascade rules are correct

---

## Resend Email Audit — Complete

- `sendCallCompletedEmail()` wired to `vapiWebhook.ts → handleCallEnd()`
- From: `"Golden Voices <no-reply@goldenvoices.app>"`
- Uses `env.CLIENT_URL ?? "http://localhost:3000"` for CTA link
- No retry/DLQ on failure (acceptable for MVP)

Backlog items:
- No welcome email for new users
- No credit-low alert (credits < 2)
- `goldenvoices.app` domain not verified in Resend

---

## What Can Ship Immediately After VAPI Vars Arrive

| Blocker | Status After VAPI |
|---|---|
| Outbound AI calls | ✅ Ready |
| AI call summaries | ✅ Ready |
| Call email notifications | ✅ Ready |
| Credit tracking | ✅ Ready |
| Stripe checkout flow | ⚠️ Needs code (webhook-only, no checkout page wiring) |
| Clerk auth | ⚠️ Not wired (Wasp built-in email/password in use) |
| Vercel deploy | ⚠️ Backlog |

---

## Git Push

```bash
git remote -v
# origin  git@github.com:alishafique1/golden-voices-wasp.git (push)  ← SSH ✅
# origin  https://x-access-token:***@github.com/... (fetch)

git push origin hermes
```
