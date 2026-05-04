/**
 * Vapi Webhook Handler
 * Handles: call-start, call-end, status-update, speech-update
 *
 * Register at POST /webhooks/vapi in main.wasp:
 *   api vapiWebhook {
 *     fn: import { vapiWebhook } from "@src/golden-voices/vapiWebhook"
 *     entities: [User, Call, CallSummary, CallInsight, Senior, ScheduledCall, CreditTransaction]
 *     httpRoute: (POST, "/webhooks/vapi")
 *   }
 */

import { prisma } from "wasp/server";
import type { WebhookFn, MiddlewareConfigFn } from "wasp/server/webhooks";
import { sendCallCompletedEmail } from "./lib/emailNotifications";

// Vapi requires raw body for webhook signature verification (if enabled)
export const vapiWebhookMiddlewareConfigFn: MiddlewareConfigFn = (
  middlewareConfig,
) => {
  // Most Vapi webhooks are JSON — keep default express.json
  // If Vapi adds signature verification later, switch to raw here:
  // middlewareConfig.delete("express.json");
  // middlewareConfig.set("express.raw", express.raw({ type: "application/json" }));
  return middlewareConfig;
};

export const vapiWebhook: WebhookFn<
  any,
  | { type: "conversation-update"; data: any }
  | { type: "status-update"; data: any }
  | { type: "speech-update"; data: any }
> = async (request, context) => {
  const body = request.body as any;

  // Vapi sends a { type, data } envelope
  const eventType = body.type as string;
  const eventData = body.data as any;

  console.log(`[Vapi Webhook] event=${eventType}`);

  try {
    switch (eventType) {
      case "call-start":
        await handleCallStart(eventData);
        break;

      case "call-end":
        await handleCallEnd(eventData, context);
        break;

      case "status-update":
        await handleStatusUpdate(eventData);
        break;

      case "conversation-update":
        await handleConversationUpdate(eventData);
        break;

      default:
        console.log(`[Vapi Webhook] unhandled event type: ${eventType}`);
    }
  } catch (error) {
    console.error(`[Vapi Webhook] error handling ${eventType}:`, error);
    throw error;
  }
};

// ─── Event Handlers ────────────────────────────────────────────────────────────

async function handleCallStart(data: any): Promise<void> {
  const { id: vapiCallSid, metadata } = data;
  if (!metadata?.callId) return;

  await prisma.call.update({
    where: { id: metadata.callId },
    data: {
      vapiCallSid,
      status: "in_progress",
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleCallEnd(data: any, context: any): Promise<void> {
  const { id: vapiCallSid, duration, recordingUrl, metadata, endedReason } = data;

  // Find call by vapiCallSid or metadata.callId
  let call = await prisma.call.findFirst({
    where: { vapiCallSid },
    include: { user: true, senior: true },
  });

  if (!call && metadata?.callId) {
    call = await prisma.call.findFirst({
      where: { id: metadata.callId },
      include: { user: true, senior: true },
    });
  }

  if (!call) {
    console.error("[Vapi Webhook] call not found for:", { vapiCallSid, metadata });
    return;
  }

  const status = endedReason === "ENDED_BY_USER_NO_ANSWER" ? "no_answer"
    : endedReason === "ENDED_BY_USER" ? "completed"
    : endedReason === "ENDED_BY_OPERATOR" ? "completed"
    : endedReason === "FAILED" ? "failed"
    : "completed";

  await prisma.call.update({
    where: { id: call.id },
    data: {
      status,
      duration: duration ?? null,
      rawRecordingUrl: recordingUrl ?? null,
      transcript: metadata?.transcript ?? null,
    },
  });

  // Trigger AI summary generation via PgBoss job
  if (status === "completed" && call.id) {
    try {
      await context.jobs.generateCallSummary({ callId: call.id });
    } catch (error) {
      console.error("[Vapi Webhook] Failed to enqueue generateCallSummary job:", error);
    }

    // Send email notification to user
    if (call.user?.email) {
      try {
        await sendCallCompletedEmail({
          to: call.user.email,
          seniorName: call.senior?.name ?? "your loved one",
          callDate: call.createdAt.toISOString(),
          callId: call.id,
        });
      } catch (emailError) {
        console.error("[Vapi Webhook] email notification failed:", emailError);
      }
    }
  }
}

async function handleStatusUpdate(data: any): Promise<void> {
  const { vapiCallSid, status } = data;

  if (!vapiCallSid) return;

  const call = await prisma.call.findFirst({ where: { vapiCallSid } });
  if (!call) return;

  const statusMap: Record<string, string> = {
    "in-progress": "in_progress",
    "completed": "completed",
    "failed": "failed",
    "no-answer": "no_answer",
  };

  const mappedStatus = statusMap[status.toLowerCase()] ?? status;

  await prisma.call.update({
    where: { id: call.id },
    data: { status: mappedStatus },
  });
}

async function handleConversationUpdate(data: any): Promise<void> {
  // conversation-update fires during the call with transcript chunks
  // We accumulate transcript in the Call record
  const { vapiCallSid, transcript } = data;
  if (!vapiCallSid || !transcript) return;

  const call = await prisma.call.findFirst({ where: { vapiCallSid } });
  if (!call) return;

  // Append to existing transcript
  const existing = call.transcript ?? "";
  const updated = existing ? `${existing}\n${transcript}` : transcript;

  await prisma.call.update({
    where: { id: call.id },
    data: { transcript: updated },
  });
}
