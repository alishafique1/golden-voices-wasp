# Golden Voices Connect — Build Specification
## Wasp OpenSaaS Boilerplate + Vapi AI Voice

---

## 1. Product Overview

**Product:** AI-powered daily calling service for busy adults to check on elderly loved ones (grandparents, parents).

**Core Flow:**
1. User signs up, adds a senior (grandma/mom) with name + phone + language
2. Schedules AI calls: daily, every-other-day, weekly, bi-weekly
3. Vapi calls the senior's phone at the scheduled time in their language (English, Urdu, Hindi)
4. Vapi's AI has a warm conversation about their day, health, and memories
5. After the call, user gets a summary: mood, topics discussed, health alerts
6. Credits-based subscription: Free (5 calls/mo), Starter ($19/mo, 30 calls), Premium ($39/mo, unlimited)

**Stack:**
- Framework: Wasp (React + Node/Express + Prisma)
- Database: PostgreSQL (via Wasp/Prisma)
- Auth: Wasp built-in (email/password)
- Voice: Vapi (outbound AI voice calls)
- AI Summaries: OpenAI GPT-4o-mini (call summaries after completion)
- Email: Resend (call notifications, summaries)
- Payments: Stripe (replace Lemon Squeezy in boilerplate)

---

## 2. Database Schema (Prisma — schema.prisma)

Replace the existing `schema.prisma` models. Keep the `User` model (add fields below) and add all new models.

### Extended User Model
```prisma
model User {
  // Keep existing: id, email, isAdmin, credits
  phone          String?
  preferredLanguage String @default("en") // en | ur | hi
  isAdmin        Boolean @default(false)
  credits        Int     @default(5) // Free tier: 5 calls
  subscriptionStatus String? // 'active' | 'cancel_at_period_end' | 'past_due' | 'deleted'
  subscriptionPlan     String? // 'free' | 'starter' | 'premium'
  stripeCustomerId     String?

  seniors              Senior[]
  calls                Call[]
  scheduledCalls       ScheduledCall[]
  userSubscriptions    UserSubscription[]
  creditTransactions   CreditTransaction[]
}
```

### New Models
```prisma
model Senior {
  id           String   @id @default(uuid())
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  userId       String
  user         User     @relation(fields: [userId], references: [id])

  name         String
  phone        String
  language     String   @default("en") // en | ur | hi
  relationship String?  // grandmother | grandfather | mother | father | other
  notes        String?  // health conditions, interests, etc.
  isActive     Boolean  @default(true)

  calls         Call[]
  scheduledCalls ScheduledCall[]
}

model Call {
  id           String   @id @default(uuid())
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  userId       String
  user         User     @relation(fields: [userId], references: [id])
  seniorId     String
  senior       Senior   @relation(fields: [seniorId], references: [id])

  vapiCallSid  String?  // Vapi call ID
  status       String   @default("pending") // pending | in_progress | completed | failed | no_answer
  duration     Int?     // seconds
  transcript   String?  // full conversation transcript
  rawRecordingUrl String?

  summary      CallSummary?
  insights     CallInsight[]
}

model CallSummary {
  id              String   @id @default(uuid())
  createdAt       DateTime @default(now())

  callId         String   @unique
  call           Call     @relation(fields: [callId], references: [id])

  mood           String?  // happy | neutral | sad | tired | confused
  moodScore      Int?     // 1-10
  engagementScore Int?    // 1-10
  summary        String   // 2-3 sentence summary of the call
  topics         String[] // what they talked about
  highlights     String[] // memorable moments
}

model CallInsight {
  id           String   @id @default(uuid())
  createdAt    DateTime @default(now())

  callId       String
  call         Call     @relation(fields: [callId], references: [id])

  type         String   // health_alert | memory_spark | topic | concern
  content      String
  severity     String?  // low | medium | high (for health alerts)
}

model ScheduledCall {
  id           String   @id @default(uuid())
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  userId       String
  user         User     @relation(fields: [userId], references: [id])
  seniorId     String
  senior       Senior   @relation(fields: [seniorId], references: [id])

  frequency    String   // daily | every_other_day | weekly | bi_weekly
  time         String   // HH:MM in 24h format
  timezone     String   @default("America/Toronto")
  language     String   @default("en") // en | ur | hi

  enabled      Boolean  @default(true)
  nextCallAt   DateTime?
  lastCallAt   DateTime?

  calls        Call[]
}

model UserSubscription {
  id                 String   @id @default(uuid())
  createdAt          DateTime @default(now())

  userId             String   @unique
  user               User     @relation(fields: [userId], references: [id])

  plan               String   // free | starter | premium
  status             String   // active | canceled | past_due
  creditsBalance     Int      @default(5)
  monthlyCallLimit   Int      @default(5) // -1 for unlimited
  currentPeriodEnd   DateTime?

  stripeSubscriptionId String?
  stripePriceId        String?
}

model CreditTransaction {
  id           String   @id @default(uuid())
  createdAt    DateTime @default(now())

  userId       String
  user         User     @relation(fields: [userId], references: [id])

  amount       Int      // positive = credit, negative = debit
  type         String   // purchase | call_debit | refund | bonus
  description  String
}
```

---

## 3. Wasp main.wasp Changes

### Extend existing User entity declarations
Add to the `userEntity: User` auth block (user fields are defined in Prisma, Wasp uses them).

### Add new routes and pages

```
// === Golden Voices Pages ===

// Main dashboard (replaces /demo-app)
route DashboardRoute { path: "/dashboard", to: DashboardPage }
page DashboardPage {
  authRequired: true
  component: import { DashboardPage } from "@src/golden-voices/DashboardPage"
}

// Call history for a senior
route CallDetailRoute { path: "/dashboard/calls/:callId", to: CallDetailPage }
page CallDetailPage {
  authRequired: true
  component: import { CallDetailPage } from "@src/golden-voices/CallDetailPage"
}

// Add/edit senior
route SeniorSetupRoute { path: "/dashboard/seniors/new", to: NewSeniorPage }
page NewSeniorPage {
  authRequired: true
  component: import { NewSeniorPage } from "@src/golden-voices/NewSeniorPage"
}

route EditSeniorRoute { path: "/dashboard/seniors/:seniorId/edit", to: EditSeniorPage }
page EditSeniorPage {
  authRequired: true
  component: import { EditSeniorPage } from "@src/golden-voices/EditSeniorPage"
}

// Schedule management
route ScheduleRoute { path: "/dashboard/schedule", to: SchedulePage }
page SchedulePage {
  authRequired: true
  component: import { SchedulePage } from "@src/golden-voices/SchedulePage"
}

// Billing / subscription
route BillingRoute { path: "/dashboard/billing", to: BillingPage }
page BillingPage {
  authRequired: true
  component: import { BillingPage } from "@src/golden-voices/BillingPage"
}

// Account settings
route AccountRoute { path: "/account", to: AccountPage }
page AccountPage {
  authRequired: true
  component: import { AccountPage } from "@src/user/AccountPage"
}
```

### Add Wasp Operations

```wasp
// === Senior Management ===
action createSenior {
  fn: import { createSenior } from "@src/golden-voices/operations"
  entities: [User, Senior]
}
action updateSenior {
  fn: import { updateSenior } from "@src/golden-voices/operations"
  entities: [User, Senior]
}
action deleteSenior {
  fn: import { deleteSenior } from "@src/golden-voices/operations"
  entities: [User, Senior]
}
query getSeniors {
  fn: import { getSeniors } from "@src/golden-voices/operations"
  entities: [User, Senior]
}
query getSenior {
  fn: import { getSenior } from "@src/golden-voices/operations"
  entities: [User, Senior, ScheduledCall]
}

// === Call Operations ===
query getCalls {
  fn: import { getCalls } from "@src/golden-voices/operations"
  entities: [User, Call]
}
query getCall {
  fn: import { getCall } from "@src/golden-voices/operations"
  entities: [User, Call, CallSummary, CallInsight]
}
query getDashboardStats {
  fn: import { getDashboardStats } from "@src/golden-voices/operations"
  entities: [User, Call, Senior, UserSubscription, CreditTransaction]
}

// === Scheduling ===
action scheduleCall {
  fn: import { scheduleCall } from "@src/golden-voices/operations"
  entities: [User, Senior, ScheduledCall]
}
action updateScheduledCall {
  fn: import { updateScheduledCall } from "@src/golden-voices/operations"
  entities: [User, Senior, ScheduledCall]
}
action cancelScheduledCall {
  fn: import { cancelScheduledCall } from "@src/golden-voices/operations"
  entities: [User, ScheduledCall]
}
query getScheduledCalls {
  fn: import { getScheduledCalls } from "@src/golden-voices/operations"
  entities: [User, Senior, ScheduledCall]
}

// === Credits / Billing ===
query getCredits {
  fn: import { getCredits } from "@src/golden-voices/operations"
  entities: [User, UserSubscription, CreditTransaction]
}
action updateSubscription {
  fn: import { updateSubscription } from "@src/golden-voices/operations"
  entities: [User, UserSubscription]
}

// === Vapi Webhook ===
api vapiWebhook {
  fn: import { vapiWebhook } from "@src/golden-voices/vapiWebhook"
  entities: [User, Call, CallSummary, CallInsight, Senior, ScheduledCall, CreditTransaction]
  httpRoute: (POST, "/webhooks/vapi")
}

// === Cron Job for processing scheduled calls ===
job processScheduledCalls {
  executor: PgBoss,
  perform: {
    fn: import { processScheduledCalls } from "@src/golden-voices/jobs/processScheduledCalls"
  }
  schedule: {
    cron: "*/5 * * * *" // every 5 minutes
  }
  entities: [User, Senior, ScheduledCall, Call, UserSubscription, CreditTransaction]
}

// === Cron Job for generating call summaries ===
job generateCallSummary {
  executor: PgBoss,
  perform: {
    fn: import { generateCallSummary } from "@src/golden-voices/jobs/generateCallSummary"
  }
  entities: [Call, CallSummary, CallInsight]
}
```

---

## 4. Vapi Integration

### Environment Variables
```env
VAPI_PRIVATE_KEY=***
VAPI_ASSISTANT_ID=***
OPENAI_API_KEY=***
RESEND_API_KEY=***
STRIPE_SECRET_KEY=***
STRIPE_WEBHOOK_SECRET=***
DATABASE_URL=***
```

### Vapi Assistant Config (create in Vapi dashboard)
- Model: GPT-4o
- Voice: Pakistani female (for Urdu) / Indian female (for Hindi) / US female (for English)
- Language: match senior's language preference
- System prompt: Warm, patient AI companion who asks about the senior's day, health, memories, and feelings. Keeps conversation natural and caring.
- First sentence: "Assalam o Alaikum [Senior Name], this is [User Name]'s friend calling to check on you. How are you feeling today?"

### Outbound Call Flow
1. Cron job (every 5 min) checks `ScheduledCall` where `enabled=true` AND `nextCallAt <= now()`
2. Server creates Vapi outbound call:
   ```typescript
   POST https://api.vapi.ai/call/phone
   {
     "assistant_id": process.env.VAPI_ASSISTANT_ID,
     "phone_number_id": "...", // your Vapi phone number ID
     "customer": {
       "number": senior.phone,
       "name": senior.name
     },
     "metadata": {
       "seniorId": senior.id,
       "userId": user.id,
       "scheduledCallId": scheduledCall.id,
       "language": senior.language
     }
   }
   ```
3. Save `vapiCallSid` to `Call` record with status `in_progress`
4. Calculate next `nextCallAt` based on frequency
5. Deduct 1 credit (unless unlimited plan)

### Vapi Webhook Handler
```
POST /webhooks/vapi
```
Handles: `call-ended`, `call-started`, `speech-update`, `status-update`

On `call-ended`:
1. Get transcript from Vapi payload
2. Update `Call` record: status, duration, transcript
3. Enqueue `generateCallSummary` job
4. Send email notification to user with summary preview

---

## 5. AI Summary Generation (generateCallSummary job)

```typescript
// After call ends, run GPT-4o on transcript:
const prompt = `
You are an AI assistant analyzing a conversation between an AI caller and an elderly person.

Transcript:
{transcript}

Analyze the call and return JSON:
{
  "mood": "happy|neutral|sad|tired|confused",
  "moodScore": 1-10,
  "engagementScore": 1-10,
  "summary": "2-3 sentence summary",
  "topics": ["topic1", "topic2"],
  "highlights": ["memorable moment 1", "memorable moment 2"],
  "healthAlerts": ["any health concerns mentioned"],
  "memorySparks": ["specific memories shared"]
}
`
```

Create `CallSummary` and `CallInsight` records.

---

## 6. Pages / Frontend

### Dashboard Page (`/dashboard`)
- Header: "Golden Voices" branding
- Stats row: Total calls this month, mood trend (emoji), credits remaining, next scheduled call
- "Add Senior" CTA card (if no seniors yet)
- Senior cards: each senior shows name, relationship, last call date, mood indicator
- Recent calls list: date, senior name, duration, mood emoji, "View" link

### Call Detail Page (`/dashboard/calls/:callId`)
- Call metadata: date, duration, senior, status
- Mood + engagement scores (visual gauges)
- Transcript (collapsible)
- AI Summary card
- Topics discussed (tags)
- Memory sparks
- Health alerts (if any)

### New/Edit Senior Page (`/dashboard/seniors/new`, `/dashboard/seniors/:seniorId/edit`)
- Form: Name, Phone, Relationship (dropdown), Language (English/Urdu/Hindi), Notes
- Validation: all required except notes
- Delete senior (edit page only, with confirmation)

### Schedule Page (`/dashboard/schedule`)
- List of seniors with schedule status
- Per-senior schedule card:
  - Frequency: Daily / Every Other Day / Weekly / Bi-Weekly
  - Time: HH:MM picker
  - Timezone
  - Enable/Disable toggle
  - "Test Call Now" button
- Add schedule: select senior, configure, save

### Billing Page (`/dashboard/billing`)
- Current plan card: Free / Starter / Premium
- Credits: balance, usage this month
- Plan selector (upgrade/downgrade)
- Payment method (Stripe managed)
- Invoice history (from Stripe)
- Cancel subscription

### Landing Page (update existing)
- Hero: "Stay Connected to the People Who Matter Most"
- Sub: "AI-powered daily calls to check on your elderly loved ones. Available in English, Urdu, and Hindi."
- How it works: 3 steps
- Features: Daily check-ins, multilingual AI, mood tracking, health alerts
- Pricing: Free / Starter / Premium
- CTA: "Get Started Free"

---

## 7. Cron Jobs (PgBoss via Wasp)

### processScheduledCalls
- Runs every 5 minutes
- Query: `ScheduledCall` where `enabled=true` AND `nextCallAt <= now()`
- For each: initiate Vapi call, deduct credit, update `nextCallAt`
- Handle: no-answer, credit insufficient, plan limit reached

### generateCallSummary
- Triggered after `call-ended` webhook
- Input: `callId`
- Gets transcript, calls OpenAI, saves `CallSummary` + `CallInsight`
- Sends Resend email to user with summary preview

---

## 8. Stripe Integration

Replace Lemon Squeezy with Stripe. Keep the existing Stripe webhook infrastructure in the boilerplate but update plans:

| Plan | Price | Credits | Features |
|------|-------|---------|----------|
| Free | $0 | 5/month | 1 senior, email support |
| Starter | $19/mo | 30/month | 3 seniors, priority support |
| Premium | $39/mo | Unlimited | 5 seniors, unlimited calls, priority support |

---

## 9. File Structure

```
src/golden-voices/
  DashboardPage.tsx       — main dashboard
  CallDetailPage.tsx      — individual call view
  NewSeniorPage.tsx       — add senior form
  EditSeniorPage.tsx       — edit senior form
  SchedulePage.tsx         — schedule management
  BillingPage.tsx          — subscription management
  operations.ts            — all Wasp actions/queries
  vapiClient.ts            — Vapi API wrapper
  vapiWebhook.ts           — webhook handler
  jobs/
    processScheduledCalls.ts
    generateCallSummary.ts
  lib/
    aiSummary.ts           — OpenAI summary generation
    creditManager.ts       — credit deduction logic
    emailNotifications.ts  — Resend email helpers
  components/
    SeniorCard.tsx
    CallHistoryList.tsx
    MoodGauge.tsx
    ScheduleCard.tsx
    CreditsDisplay.tsx
```

---

## 10. Implementation Order

1. Update `schema.prisma` with all new models
2. Run `wasp db migrate` to create tables
3. Update `main.wasp` with new routes, pages, operations, jobs
4. Build `operations.ts` — all CRUD for seniors, calls, schedules
5. Build `vapiClient.ts` — initiate outbound calls
6. Build `vapiWebhook.ts` — handle call events
7. Build `jobs/processScheduledCalls.ts` — cron for call initiation
8. Build `jobs/generateCallSummary.ts` — AI summary generation
9. Build all frontend pages (Dashboard → Seniors → Schedule → Billing → Call Detail)
10. Update landing page for Golden Voices branding
11. Wire Stripe billing (replace Lemon Squeezy)
12. Wire Resend email notifications
