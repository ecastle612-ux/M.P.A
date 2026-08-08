/**
 * COM-002 onboarding lifecycle event generation (writes saas_lifecycle_events).
 * Does not redesign Slice E subscription state machine — only records milestones.
 */

import { serverEnv } from "../env/server-env";

export type OnboardingLifecycleEventType =
  | "purchase_completed"
  | "provisioned"
  | "owner_pending"
  | "owner_claimed"
  | "activated";

async function tryServiceRole() {
  try {
    if (process.env["VITEST"]) return null;
    if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) return null;
    const { createServiceRoleClient } = await import("../supabase/service-role");
    return createServiceRoleClient();
  } catch {
    return null;
  }
}

export async function recordOnboardingLifecycleEvent(input: {
  checkoutSessionId: string;
  eventType: OnboardingLifecycleEventType;
  stripeSubscriptionId?: string | null;
  organizationId?: string | null;
  summary: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  const supabase = await tryServiceRole();
  if (!supabase) return;
  const stripeEventId = `mpa_onboarding:${input.checkoutSessionId}:${input.eventType}`;
  await supabase.from("saas_lifecycle_events").upsert(
    {
      stripe_event_id: stripeEventId,
      event_type: input.eventType,
      stripe_subscription_id: input.stripeSubscriptionId ?? null,
      organization_id: input.organizationId ?? null,
      processed_at: new Date().toISOString(),
      summary: input.summary,
      payload: {
        checkout_session_id: input.checkoutSessionId,
        ...(input.payload ?? {})
      }
    },
    { onConflict: "stripe_event_id" }
  );
}
