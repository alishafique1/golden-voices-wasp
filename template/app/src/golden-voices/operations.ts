import OpenAI from "openai";
import type { Call, CallSummary, CallInsight, Senior } from "wasp/entities";
import { env, prisma } from "wasp/server";
import type {
  CreateSenior,
  UpdateSenior,
  DeleteSenior,
  GetSeniors,
  GetSenior,
  ScheduleCall,
  UpdateScheduledCall,
  CancelScheduledCall,
  GetScheduledCalls,
  GetCalls,
  GetCall,
  GetDashboardStats,
  GetCredits,
} from "wasp/server/operations";
import type { HttpError } from "wasp/server";
import * as z from "zod";
import { ensureArgsSchemaOrThrowHttpError } from "../server/validation";

// ─── Validators ───────────────────────────────────────────────────────────────

const seniorInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(7, "Valid phone number required"),
  language: z.enum(["en", "ur", "hi"]).default("en"),
  relationship: z.enum(["grandmother", "grandfather", "mother", "father", "other"]).optional(),
  notes: z.string().optional(),
});

const scheduleInputSchema = z.object({
  seniorId: z.string().uuid(),
  frequency: z.enum(["daily", "every_other_day", "weekly", "bi_weekly"]),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM format"),
  timezone: z.string().default("America/Toronto"),
  language: z.enum(["en", "ur", "hi"]).default("en"),
});

const updateScheduleSchema = z.object({
  id: z.string().uuid(),
  frequency: z.enum(["daily", "every_other_day", "weekly", "bi_weekly"]).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  timezone: z.string().optional(),
  language: z.enum(["en", "ur", "hi"]).optional(),
  enabled: z.boolean().optional(),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isSubscribed(user: { subscriptionStatus?: string | null }): boolean {
  return (
    user.subscriptionStatus === "active" ||
    user.subscriptionStatus === "cancel_at_period_end"
  );
}

async function deductCredit(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  if (!isSubscribed(user)) {
    if (user.credits <= 0) {
      throw Object.assign(new HttpError(402, "Insufficient credits") as Error, {
        code: "INSUFFICIENT_CREDITS",
      });
    }
    await prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: 1 } },
    });
    await prisma.creditTransaction.create({
      data: {
        userId,
        amount: -1,
        type: "call_debit",
        description: "Outbound AI call",
      },
    });
  }
}

function calculateNextCallAt(frequency: string, from: Date = new Date(), timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const next = new Date(from);
  next.setHours(hours, minutes, 0, 0);

  switch (frequency) {
    case "daily":
      if (next <= from) next.setDate(next.getDate() + 1);
      break;
    case "every_other_day":
      if (next <= from) next.setDate(next.getDate() + 2);
      break;
    case "weekly":
      if (next <= from) next.setDate(next.getDate() + 7);
      break;
    case "bi_weekly":
      if (next <= from) next.setDate(next.getDate() + 14);
      break;
  }
  return next;
}

// ─── Senior Operations ────────────────────────────────────────────────────────

export const createSenior: CreateSenior<z.infer<typeof seniorInputSchema>, Senior> = async (
  rawArgs,
  context,
) => {
  if (!context.user) throw new HttpError(401, "Not authenticated");
  const args = ensureArgsSchemaOrThrowHttpError(seniorInputSchema, rawArgs);

  return context.entities.Senior.create({
    data: { ...args, user: { connect: { id: context.user.id } } },
  });
};

export const updateSenior: UpdateSenior<{ id: string } & z.infer<typeof seniorInputSchema>, Senior> = async (
  rawArgs,
  context,
) => {
  if (!context.user) throw new HttpError(401, "Not authenticated");
  const { id, ...data } = rawArgs;
  const args = ensureArgsSchemaOrThrowHttpError(seniorInputSchema, data);

  const senior = await context.entities.Senior.findFirst({
    where: { id, user: { id: context.user.id } },
  });
  if (!senior) throw new HttpError(404, "Senior not found");

  return context.entities.Senior.update({
    where: { id },
    data: args,
  });
};

export const deleteSenior: DeleteSenior<{ id: string }, Senior> = async (
  rawArgs,
  context,
) => {
  if (!context.user) throw new HttpError(401, "Not authenticated");
  const { id } = rawArgs;

  const senior = await context.entities.Senior.findFirst({
    where: { id, user: { id: context.user.id } },
  });
  if (!senior) throw new HttpError(404, "Senior not found");

  return context.entities.Senior.delete({ where: { id } });
};

export const getSeniors: GetSeniors<void, Senior[]> = async (_args, context) => {
  if (!context.user) throw new HttpError(401, "Not authenticated");
  return context.entities.Senior.findMany({
    where: { userId: context.user.id, isActive: true },
    orderBy: { createdAt: "desc" },
  });
};

export const getSenior: GetSenior<{ id: string }, Senior> = async (rawArgs, context) => {
  if (!context.user) throw new HttpError(401, "Not authenticated");
  const senior = await context.entities.Senior.findFirst({
    where: { id: rawArgs.id, userId: context.user.id },
    include: { scheduledCalls: true },
  });
  if (!senior) throw new HttpError(404, "Senior not found");
  return senior;
};

// ─── Schedule Operations ─────────────────────────────────────────────────────

export const scheduleCall: ScheduleCall<z.infer<typeof scheduleInputSchema>, any> = async (
  rawArgs,
  context,
) => {
  if (!context.user) throw new HttpError(401, "Not authenticated");
  const args = ensureArgsSchemaOrThrowHttpError(scheduleInputSchema, rawArgs);

  const senior = await context.entities.Senior.findFirst({
    where: { id: args.seniorId, userId: context.user.id },
  });
  if (!senior) throw new HttpError(404, "Senior not found");

  const nextCallAt = calculateNextCallAt(args.frequency, new Date(), args.time);

  return context.entities.ScheduledCall.create({
    data: {
      ...args,
      user: { connect: { id: context.user.id } },
      senior: { connect: { id: args.seniorId } },
      nextCallAt,
    },
  });
};

export const updateScheduledCall: UpdateScheduledCall<
  z.infer<typeof updateScheduleSchema>,
  any
> = async (rawArgs, context) => {
  if (!context.user) throw new HttpError(401, "Not authenticated");
  const { id, ...data } = ensureArgsSchemaOrThrowHttpError(updateScheduleSchema, rawArgs);

  const existing = await context.entities.ScheduledCall.findFirst({
    where: { id, user: { id: context.user.id } },
  });
  if (!existing) throw new HttpError(404, "Scheduled call not found");

  const nextCallAt =
    data.frequency || data.time
      ? calculateNextCallAt(
          (data.frequency ?? existing.frequency) as string,
          new Date(),
          (data.time ?? existing.time) as string,
        )
      : undefined;

  return context.entities.ScheduledCall.update({
    where: { id },
    data: { ...data, nextCallAt },
  });
};

export const cancelScheduledCall: CancelScheduledCall<{ id: string }, any> = async (
  rawArgs,
  context,
) => {
  if (!context.user) throw new HttpError(401, "Not authenticated");
  const scheduledCall = await context.entities.ScheduledCall.findFirst({
    where: { id: rawArgs.id, userId: context.user.id },
  });
  if (!scheduledCall) throw new HttpError(404, "Scheduled call not found");

  return context.entities.ScheduledCall.delete({ where: { id: rawArgs.id } });
};

export const getScheduledCalls: GetScheduledCalls<void, any> = async (_args, context) => {
  if (!context.user) throw new HttpError(401, "Not authenticated");
  return context.entities.ScheduledCall.findMany({
    where: { userId: context.user.id },
    include: { senior: true },
    orderBy: { nextCallAt: "asc" },
  });
};

// ─── Call Operations ──────────────────────────────────────────────────────────

export const getCalls: GetCalls<{ seniorId?: string }, Call[]> = async (rawArgs, context) => {
  if (!context.user) throw new HttpError(401, "Not authenticated");
  return context.entities.Call.findMany({
    where: {
      userId: context.user.id,
      ...(rawArgs.seniorId ? { seniorId: rawArgs.seniorId } : {}),
    },
    include: { senior: true, summary: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
};

export const getCall: GetCall<{ id: string }, Call> = async (rawArgs, context) => {
  if (!context.user) throw new HttpError(401, "Not authenticated");
  const call = await context.entities.Call.findFirst({
    where: { id: rawArgs.id, userId: context.user.id },
    include: { senior: true, summary: true, insights: true },
  });
  if (!call) throw new HttpError(404, "Call not found");
  return call;
};

export const getDashboardStats: GetDashboardStats<void, any> = async (_args, context) => {
  if (!context.user) throw new HttpError(401, "Not authenticated");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [callsThisMonth, seniors, subscription, credits] = await Promise.all([
    context.entities.Call.count({
      where: { userId: context.user.id, createdAt: { gte: monthStart }, status: "completed" },
    }),
    context.entities.Senior.count({
      where: { userId: context.user.id, isActive: true },
    }),
    context.entities.UserSubscription.findUnique({
      where: { userId: context.user.id },
    }),
    context.entities.CreditTransaction.aggregate({
      where: { userId: context.user.id },
      _sum: { amount: true },
    }),
  ]);

  const recentCalls = await context.entities.Call.findMany({
    where: { userId: context.user.id, status: "completed" },
    include: { senior: true, summary: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const moodTrend = recentCalls
    .map((c) => c.summary?.mood)
    .filter(Boolean)
    .slice(0, 5);

  const nextScheduled = await context.entities.ScheduledCall.findFirst({
    where: { userId: context.user.id, enabled: true },
    include: { senior: true },
    orderBy: { nextCallAt: "asc" },
  });

  return {
    callsThisMonth,
    seniors,
    creditsBalance: subscription?.creditsBalance ?? context.user.credits,
    monthlyLimit: subscription?.monthlyCallLimit ?? 5,
    moodTrend,
    nextScheduledCall: nextScheduled,
    recentCalls,
  };
};

export const getCredits: GetCredits<void, any> = async (_args, context) => {
  if (!context.user) throw new HttpError(401, "Not authenticated");

  const [subscription, transactions] = await Promise.all([
    context.entities.UserSubscription.findUnique({
      where: { userId: context.user.id },
    }),
    context.entities.CreditTransaction.findMany({
      where: { userId: context.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return {
    balance: subscription?.creditsBalance ?? context.user.credits,
    plan: subscription?.plan ?? "free",
    status: subscription?.status ?? "active",
    currentPeriodEnd: subscription?.currentPeriodEnd,
    transactions,
  };
}
