import { serverEnv } from "../env/server-env";

export type StoredLifecycleEvent = {
  stripeEventId: string;
  eventType: string;
  stripeSubscriptionId: string | null;
  organizationId: string | null;
  processedAt: string;
  summary: string | null;
};

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

export async function listSaasLifecycleEventsFromDb(limit = 40): Promise<StoredLifecycleEvent[]> {
  const supabase = await tryServiceRole();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("saas_lifecycle_events")
    .select(
      "stripe_event_id, event_type, stripe_subscription_id, organization_id, processed_at, summary"
    )
    .order("processed_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((row) => ({
    stripeEventId: row.stripe_event_id as string,
    eventType: row.event_type as string,
    stripeSubscriptionId: (row.stripe_subscription_id as string | null) ?? null,
    organizationId: (row.organization_id as string | null) ?? null,
    processedAt: row.processed_at as string,
    summary: (row.summary as string | null) ?? null
  }));
}
