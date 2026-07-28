/**
 * AUTH-001 Slice B — entitlement snapshot bind + assertEntitled hooks.
 */
import type { SaasPlanCode } from "../integrations/saas-billing/contracts";
import {
  assertModuleEntitled,
  assertWithinLimit,
  resolveEntitlementsForPlan,
  type EntitlementResult,
  type PlanEntitlementSnapshot
} from "./capability-matrix";
import { createServiceRoleServerClient } from "./server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

function serviceClient(client?: AnyClient): AnyClient {
  if (client) return client;
  const created = createServiceRoleServerClient();
  if (!created) throw new Error("Entitlements require SUPABASE_SERVICE_ROLE_KEY");
  return created;
}

export async function bindEntitlementSnapshot(input: {
  organizationId: string;
  planCode: SaasPlanCode;
  sourceSubscriptionId?: string | null;
  client?: AnyClient;
}): Promise<PlanEntitlementSnapshot> {
  const snapshot = resolveEntitlementsForPlan(input.planCode);
  const db = serviceClient(input.client);

  const { error } = await db.from("saas_entitlement_snapshots").upsert(
    {
      organization_id: input.organizationId,
      plan_code: snapshot.planCode,
      features: snapshot.features,
      limits: snapshot.limits,
      source_subscription_id: input.sourceSubscriptionId ?? null,
      computed_at: new Date().toISOString()
    },
    { onConflict: "organization_id" }
  );

  if (error) {
    throw new Error(error.message ?? "Failed to bind entitlement snapshot");
  }

  return snapshot;
}

export async function getEntitlementSnapshot(
  organizationId: string,
  client?: AnyClient
): Promise<PlanEntitlementSnapshot | null> {
  const db = serviceClient(client);
  const { data, error } = await db
    .from("saas_entitlement_snapshots")
    .select("plan_code, features, limits")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const planCode = String(data["plan_code"] ?? "professional") as SaasPlanCode;
  const resolved = resolveEntitlementsForPlan(planCode);
  const features =
    data["features"] && typeof data["features"] === "object"
      ? (data["features"] as Record<string, boolean>)
      : resolved.features;
  const limits =
    data["limits"] && typeof data["limits"] === "object"
      ? { ...resolved.limits, ...(data["limits"] as Record<string, unknown>) }
      : resolved.limits;

  return {
    ...resolved,
    features,
    limits: {
      maxUsers: Number(limits["maxUsers"] ?? resolved.limits.maxUsers),
      maxProperties: Number(limits["maxProperties"] ?? resolved.limits.maxProperties),
      storageGb: Number(limits["storageGb"] ?? resolved.limits.storageGb),
      aiUsage: (limits["aiUsage"] as PlanEntitlementSnapshot["limits"]["aiUsage"]) ?? resolved.limits.aiUsage,
      marketplace: Boolean(limits["marketplace"] ?? resolved.limits.marketplace),
      prioritySupport: Boolean(limits["prioritySupport"] ?? resolved.limits.prioritySupport)
    }
  };
}

/** Server-side entitlement assert for a module key (see-what-you-bought). */
export async function assertEntitled(
  organizationId: string,
  moduleKey: string,
  client?: AnyClient
): Promise<EntitlementResult> {
  const snapshot = await getEntitlementSnapshot(organizationId, client);
  return assertModuleEntitled(snapshot, moduleKey);
}

export async function assertPropertyLimit(
  organizationId: string,
  currentPropertyCount: number,
  client?: AnyClient
): Promise<EntitlementResult> {
  const snapshot = await getEntitlementSnapshot(organizationId, client);
  return assertWithinLimit(snapshot, "maxProperties", currentPropertyCount);
}

export async function assertUserSeatLimit(
  organizationId: string,
  currentUserCount: number,
  client?: AnyClient
): Promise<EntitlementResult> {
  const snapshot = await getEntitlementSnapshot(organizationId, client);
  return assertWithinLimit(snapshot, "maxUsers", currentUserCount);
}
