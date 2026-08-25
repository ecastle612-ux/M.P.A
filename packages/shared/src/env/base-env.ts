import { z } from "zod";
import { isResendFromAddress } from "./resend";

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
  /** FIN-OPS resident payments webhook secret (platform-account destination). */
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  /** FIN-OPS connected-account destination secret. Do not overwrite STRIPE_WEBHOOK_SECRET. */
  STRIPE_CONNECT_WEBHOOK_SECRET: z.string().min(1).optional(),
  /** COM-002 SaaS Checkout dedicated webhook secret (separate endpoint). */
  STRIPE_SAAS_WEBHOOK_SECRET: z.string().min(1).optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  /** Legacy COM-002 PM Price ids (display / transitional). Not the unit-volume registry. */
  STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY: z.string().min(1).optional(),
  STRIPE_PRICE_PM_PROFESSIONAL_ANNUAL: z.string().min(1).optional(),
  STRIPE_PRICE_PM_BUSINESS_MONTHLY: z.string().min(1).optional(),
  STRIPE_PRICE_PM_BUSINESS_ANNUAL: z.string().min(1).optional(),
  /**
   * Unit-volume Checkout Price registry (Slice 3+) — optional until Prices are published.
   * Do not set in Production from this slice. Do not hard-code Price IDs in code.
   */
  STRIPE_PRICE_PM_BASE_MONTHLY: z.string().min(1).optional(),
  STRIPE_PRICE_PM_BASE_ANNUAL: z.string().min(1).optional(),
  STRIPE_PRICE_COMPLETE_BASE_MONTHLY: z.string().min(1).optional(),
  STRIPE_PRICE_COMPLETE_BASE_ANNUAL: z.string().min(1).optional(),
  STRIPE_PRICE_UNIT_BLOCK_MONTHLY: z.string().min(1).optional(),
  STRIPE_PRICE_UNIT_BLOCK_ANNUAL: z.string().min(1).optional(),
  /**
   * Facility Operations base Prices (unit-volume Checkout) — reuse existing FO Prices.
   * Complete professional Price ids remain display-only until COMPLETE_READY.
   */
  STRIPE_PRICE_FO_PROFESSIONAL_MONTHLY: z.string().min(1).optional(),
  STRIPE_PRICE_FO_PROFESSIONAL_ANNUAL: z.string().min(1).optional(),
  STRIPE_PRICE_COMPLETE_PROFESSIONAL_MONTHLY: z.string().min(1).optional(),
  STRIPE_PRICE_COMPLETE_PROFESSIONAL_ANNUAL: z.string().min(1).optional(),
  /** When "true", enable Stripe Tax on SaaS Checkout (requires active Tax registration). */
  STRIPE_SAAS_AUTOMATIC_TAX: z.string().optional(),
  /** Optional until Resend is provisioned; invites still create + expose accept link. */
  RESEND_API_KEY: z.string().min(1).optional(),
  /** Bare email or `Name <email>`. Production must use a verified domain, not resend.dev. */
  RESEND_FROM_EMAIL: z
    .string()
    .min(1)
    .refine((value) => isResendFromAddress(value), {
      message: "RESEND_FROM_EMAIL must be an email or Name <email>"
    })
    .optional(),
  /** Optional until SignWell is provisioned; offline signed path remains available. */
  SIGNWELL_API_KEY: z.string().min(1).optional(),
  SIGNWELL_WEBHOOK_ID: z.string().min(1).optional(),
  /** Defaults to test mode unless explicitly set to "false". */
  SIGNWELL_TEST_MODE: z.string().optional(),
  /**
   * STAB-006 — optional Sentry DSN. Local/dev work without these.
   * Do not configure Production from application code; operators set env when ready.
   */
  SENTRY_DSN: z.string().min(1).optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().min(1).optional(),
  SENTRY_ENVIRONMENT: z.string().min(1).optional(),
  /**
   * STAB-015 — when VERCEL_ENV=production, demo APIs stay disabled unless "true".
   */
  DEMO_ENABLED: z.string().optional()
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;
