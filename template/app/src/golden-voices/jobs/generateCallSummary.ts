/**
 * generateCallSummary — PgBoss job.
 * Receives { callId }, fetches the Call + transcript, calls OpenAI for a structured
 * summary, then creates CallSummary + CallInsight DB records.
 *
 * Triggered by vapiWebhook when a call completes (status=completed).
 */

import type { JobFn } from "wasp/server/job";
import { generateCallSummaryWithAI } from "../lib/aiSummary";

interface GenerateCallSummaryArgs {
  callId: string;
}

export const generateCallSummary: JobFn<GenerateCallSummaryArgs> = async (args) => {
  const { callId } = args;

  if (!callId) {
    console.error("[generateCallSummary] Missing callId in job args");
    return;
  }

  console.log(`[generateCallSummary] Starting for callId=${callId}`);

  try {
    await generateCallSummaryWithAI(callId);
    console.log(`[generateCallSummary] Completed for callId=${callId}`);
  } catch (error) {
    console.error(`[generateCallSummary] Failed for callId=${callId}:`, error);
    throw error;
  }
};
