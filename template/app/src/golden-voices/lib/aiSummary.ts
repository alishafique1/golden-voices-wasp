/**
 * AI Summary Generation — runs after each completed call.
 * Uses OpenAI GPT-4o to analyze the transcript and produce a structured summary.
 */

import OpenAI from "openai";
import { env, prisma } from "wasp/server";
import type { JobFn } from "wasp/server/job";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY ?? "" });

interface AISummaryResult {
  mood: "happy" | "neutral" | "sad" | "tired" | "confused";
  moodScore: number;
  engagementScore: number;
  summary: string;
  topics: string[];
  highlights: string[];
  healthAlerts: string[];
  memorySparks: string[];
}

export const generateCallSummaryWithAI = async (callId: string): Promise<void> => {
  const call = await prisma.call.findUnique({
    where: { id: callId },
    include: { senior: true },
  });

  if (!call) throw new Error(`Call ${callId} not found`);
  if (!call.transcript) {
    console.log(`[AI Summary] No transcript for call ${callId}, skipping`);
    return;
  }

  const systemPrompt = `You are an AI assistant analyzing a recorded phone conversation between an AI caller and an elderly person. The AI caller is warm, patient, and speaks in a caring tone.

Analyze the transcript and return a JSON object with this exact shape:
{
  "mood": "happy" | "neutral" | "sad" | "tired" | "confused",
  "moodScore": 1-10 (10 = very happy/engaged),
  "engagementScore": 1-10 (10 = very engaged, lots to talk about),
  "summary": "2-3 sentence summary of the entire conversation from the elder's perspective",
  "topics": ["topic1", "topic2", "topic3"],
  "highlights": ["most memorable or touching moment from the conversation"],
  "healthAlerts": ["any health concerns, pain mentions, or wellness issues mentioned"],
  "memorySparks": ["specific memories, people, or events the elder mentioned"]
}

Be conservative with healthAlerts — only include genuine health concerns, not general tiredness.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Transcript:\n${call.transcript}` },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const raw = completion.choices[0].message.content ?? "{}";
  let result: AISummaryResult;
  try {
    result = JSON.parse(raw);
  } catch {
    throw new Error(`AI summary parse failed: ${raw}`);
  }

  // Save CallSummary
  const callSummary = await prisma.callSummary.create({
    data: {
      callId: call.id,
      mood: result.mood,
      moodScore: result.moodScore,
      engagementScore: result.engagementScore,
      summary: result.summary,
      topics: result.topics,
      highlights: result.highlights,
    },
  });

  // Save CallInsights
  const insightPromises = [
    ...result.healthAlerts.map((alert) =>
      prisma.callInsight.create({
        data: {
          callId: call.id,
          type: "health_alert",
          content: alert,
          severity: "medium",
        },
      }),
    ),
    ...result.memorySparks.map((spark) =>
      prisma.callInsight.create({
        data: {
          callId: call.id,
          type: "memory_spark",
          content: spark,
        },
      }),
    ),
    ...result.topics.slice(0, 3).map((topic) =>
      prisma.callInsight.create({
        data: {
          callId: call.id,
          type: "topic",
          content: topic,
        },
      }),
    ),
  ];

  await Promise.all(insightPromises);

  console.log(`[AI Summary] Saved summary ${callSummary.id} for call ${call.id}`);
};
