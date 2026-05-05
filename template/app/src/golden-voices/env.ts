import * as z from "zod";

/**
 * env.ts — Golden Voices environment variables
 * Add to the Wasp server envValidationSchema in main.wasp
 */

export const gvEnvValidationSchema = z.object({
  VAPI_PRIVATE_KEY: z.string().min(1, "VAPI_PRIVATE_KEY is required for outbound calls"),
  VAPI_ASSISTANT_ID: z.string().min(1, "VAPI_ASSISTANT_ID is required for outbound calls"),
  VAPI_PHONE_NUMBER_ID: z.string().min(1, "VAPI_PHONE_NUMBER_ID is required for outbound calls"),
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required for AI summaries"),
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required for email notifications"),
  STRIPE_API_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  CLIENT_URL: z.string().url().default("http://localhost:3000"),
  CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  DATABASE_URL: z.string().optional(),
});
