# Golden Voices Connect — Setup Status

**Last audited:** 2026-05-02
**Stack:** Wasp OpenSaaS / Prisma / PostgreSQL / VAPI / OpenAI / Resend / Stripe
**Working dir:** `/root/Golden-Voices-Wasp/template/app/`

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

| Env Var | Blocked By | Impact |
|---|---|---|
| `VAPI_PRIVATE_KEY` | Ali | Cannot initiate outbound calls |
| `VAPI_ASSISTANT_ID` | Ali | Cannot initiate outbound calls |
| `VAPI_PHONE_NUMBER_ID` | Ali | Cannot initiate outbound calls |
| `OPENAI_API_KEY` | Ali | AI summary generation fails (call summary is toast) |
| `RESEND_API_KEY` | Ali | Email notifications not sent |
| `STRIPE_SECRET_KEY` | Ali | Payment processing broken |
| `STRIPE_WEBHOOK_SECRET` | Ali | Payment webhook verification fails |
| `DATABASE_URL` | Ali | App starts but DB is unreachable |
| `CLERK_PUBLISHABLE_KEY` | Ali | Clerk not yet wired in main.wasp anyway |
| `CLERK_SECRET_KEY` | Ali | Clerk not yet wired in main.wasp anyway |

### Priority order for Ali to provide:
1. `DATABASE_URL` — everything fails without DB
2. `VAPI_PRIVATE_KEY` + `VAPI_ASSISTANT_ID` + `VAPI_PHONE_NUMBER_ID` — core product loop
3. `OPENAI_API_KEY` — call summaries
4. `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` — billing
5. `RESEND_API_KEY` — user notifications

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

## What Can Ship Immediately Once Vars Arrive

Once Ali provides the 5 priority env vars, the following are ready to work with zero code changes:

```
DATABASE_URL               → DB connection + Prisma migrations
VAPI_PRIVATE_KEY           → outbound calls
VAPI_ASSISTANT_ID          → outbound calls
VAPI_PHONE_NUMBER_ID      → outbound calls
OPENAI_API_KEY            → AI summaries
```

### After env vars arrive, run:
```bash
cd /root/Golden-Voices-Wasp/template/app
wasp db migrate-dev       # apply schema
npx wasp start             # start dev server
```

### Still needs code work (not env-blocked):
- [ ] Wire Clerk auth in `main.wasp` (auth config) — currently using Wasp built-in email/password
- [ ] Stripe checkout session creation (`src/payment/operations.ts`)
- [ ] `CLERK_*` env vars are in schema but Clerk is not in main.wasp auth block
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
```

Push command: `git push origin main`
