import { z } from "zod";

export const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1)
});

export const serverEnvSchema = clientEnvSchema.extend({
  SESSION_COOKIE_NAME: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  /** Optional until Stripe keys are provisioned; online pay degrades to manual-only. */
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  /** FIN-OPS resident payments webhook secret. */
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  /** COM-002 SaaS Checkout dedicated webhook secret (separate endpoint). */
  STRIPE_SAAS_WEBHOOK_SECRET: z.string().min(1).optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  /** COM-002 PM self-serve Price ids (Stripe Dashboard / test mode). */
  STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY: z.string().min(1).optional(),
  STRIPE_PRICE_PM_PROFESSIONAL_ANNUAL: z.string().min(1).optional(),
  STRIPE_PRICE_PM_BUSINESS_MONTHLY: z.string().min(1).optional(),
  STRIPE_PRICE_PM_BUSINESS_ANNUAL: z.string().min(1).optional(),
  /** When "true", enable Stripe Tax on SaaS Checkout (requires active Tax registration). */
  STRIPE_SAAS_AUTOMATIC_TAX: z.string().optional(),
  /** Optional until Resend is provisioned; invites still create + expose accept link. */
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  /** Optional until SignWell is provisioned; offline signed path remains available. */
  SIGNWELL_API_KEY: z.string().min(1).optional(),
  SIGNWELL_WEBHOOK_ID: z.string().min(1).optional(),
  /** Defaults to test mode unless explicitly set to "false". */
  SIGNWELL_TEST_MODE: z.string().optional()
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;
