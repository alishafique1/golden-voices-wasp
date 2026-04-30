/**
 * env.ts — Golden Voices environment variables
 * Add to the Wasp server envValidationSchema in main.wasp
 */

export const serverEnvValidationSchema = {
  VAPI_PRIVATE_KEY: z.string().optional(),
  VAPI_ASSISTANT_ID: z.string().optional(),
  VAPI_PHONE_NUMBER_ID: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  CLIENT_URL: z.string().url().default("http://localhost:3000"),
} as const;
