/**
 * processScheduledCalls — runs every 5 minutes via PgBoss.
 * Finds all ScheduledCalls where enabled=true and nextCallAt <= now(),
 * then initiates a Vapi outbound call for each.
 */

import { prisma } from "wasp/server";
import type { JobFn } from "wasp/server/job";
import { getVapiClient } from "../vapiClient";

export const processScheduledCalls: JobFn = async (_args) => {
  const now = new Date();

  // Find all due scheduled calls
  const dueCalls = await prisma.scheduledCall.findMany({
    where: {
      enabled: true,
      nextCallAt: { lte: now },
    },
    include: {
      senior: { include: { user: true } },
      user: true,
    },
  });

  if (dueCalls.length === 0) {
    console.log("[processScheduledCalls] No calls due");
    return;
  }

  console.log(`[processScheduledCalls] Processing ${dueCalls.length} due calls`);

  const results = await Promise.allSettled(
    dueCalls.map(async (scheduledCall) => {
      const { senior, user } = scheduledCall;

      // Check credit / plan limit
      const subscription = await prisma.userSubscription.findUnique({
        where: { userId: user.id },
      });

      const isUnlimited = subscription?.monthlyCallLimit === -1;
      const isSubscribed = subscription?.status === "active";

      if (!isSubscribed && !isUnlimited) {
        if (user.credits <= 0) {
          console.log(`[processScheduledCalls] No credits for user ${user.id}, skipping`);
          return;
        }
        await prisma.user.update({
          where: { id: user.id },
          data: { credits: { decrement: 1 } },
        });
        await prisma.creditTransaction.create({
          data: {
            userId: user.id,
            amount: -1,
            type: "call_debit",
            description: `Scheduled call to ${senior.name}`,
          },
        });
      }

      // Create Call record
      const call = await prisma.call.create({
        data: {
          userId: user.id,
          seniorId: senior.id,
          status: "pending",
        },
      });

      // Initiate Vapi call
      let vapiCallSid: string;
      try {
        const vapi = getVapiClient();
        vapiCallSid = await vapi.initiateOutboundCall({
          seniorPhone: senior.phone,
          seniorName: senior.name,
          language: senior.language as "en" | "ur" | "hi",
          metadata: {
            callId: call.id,
            userId: user.id,
            scheduledCallId: scheduledCall.id,
          },
        });
      } catch (error) {
        console.error(`[processScheduledCalls] Vapi error for call ${call.id}:`, error);
        await prisma.call.update({
          where: { id: call.id },
          data: { status: "failed" },
        });
        throw error;
      }

      // Update Call with Vapi SID
      await prisma.call.update({
        where: { id: call.id },
        data: { vapiCallSid },
      });

      // Update ScheduledCall: set lastCallAt, calculate nextCallAt
      const nextCallAt = calculateNextCallAt(scheduledCall.frequency, new Date(), scheduledCall.time);

      await prisma.scheduledCall.update({
        where: { id: scheduledCall.id },
        data: {
          lastCallAt: now,
          nextCallAt,
        },
      });

      console.log(`[processScheduledCalls] Initiated call ${call.id} (Vapi: ${vapiCallSid}) to ${senior.phone}`);
    }),
  );

  // Log failures
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(`[processScheduledCalls] Call ${i} failed:`, r.reason);
    }
  });
};

function calculateNextCallAt(frequency: string, from: Date, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const next = new Date(from);
  next.setHours(hours, minutes, 0, 0);

  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "every_other_day":
      next.setDate(next.getDate() + 2);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "bi_weekly":
      next.setDate(next.getDate() + 14);
      break;
  }
  return next;
}
