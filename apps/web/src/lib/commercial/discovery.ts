/**
 * COM-001 Slice C — entitlement-safe feature discovery.
 */
import { createServiceRoleServerClient } from "../auth/server";
import { getEntitlementSnapshot } from "../auth/entitlements";
import { getImplementationProgress } from "./progress";
import { emitCommercialOpsEvent } from "./ops-events";
import { appendCommunicationTimeline } from "./timeline";
import {
  DISCOVERY_CATALOG,
  DISCOVERY_COOLDOWN_DAYS,
  DISCOVERY_KEYS,
  type DiscoveryCandidate,
  type DiscoveryKey,
  type DiscoveryStatus,
  type FeatureDiscoverySnapshot
} from "./discovery-types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

function serviceClient(): AnyClient {
  const client = createServiceRoleServerClient();
  if (!client) throw new Error("Feature discovery requires SUPABASE_SERVICE_ROLE_KEY");
  return client;
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

function isFeatureEntitled(
  features: Record<string, boolean> | undefined,
  requiredFeature: string | null
): boolean {
  if (!requiredFeature) return true;
  return Boolean(features?.[requiredFeature]);
}

export function filterEntitledDiscoveries(input: {
  features: Record<string, boolean> | undefined;
  keys?: DiscoveryKey[];
}): DiscoveryKey[] {
  const keys = input.keys ?? [...DISCOVERY_KEYS];
  return keys.filter((key) =>
    isFeatureEntitled(input.features, DISCOVERY_CATALOG[key].requiredFeature)
  );
}

type MemoryRow = {
  discovery_key: string;
  status: string;
  dismissed_at: string | null;
  snoozed_until: string | null;
  accepted_at: string | null;
};

function memoryBlocks(
  row: MemoryRow | undefined,
  nowMs: number
): { blocked: boolean; status: DiscoveryStatus } {
  if (!row) return { blocked: false, status: "open" };
  const status = String(row.status) as DiscoveryStatus;
  if (status === "accepted") return { blocked: true, status };
  if (status === "snoozed" && row.snoozed_until) {
    const until = Date.parse(row.snoozed_until);
    if (Number.isFinite(until) && until > nowMs) return { blocked: true, status };
    return { blocked: false, status: "open" };
  }
  if (status === "dismissed" && row.dismissed_at) {
    const coolEnds = Date.parse(addDays(row.dismissed_at, DISCOVERY_COOLDOWN_DAYS));
    if (Number.isFinite(coolEnds) && coolEnds > nowMs) return { blocked: true, status };
    return { blocked: false, status: "open" };
  }
  return { blocked: false, status: status === "impressed" ? "impressed" : "open" };
}

async function countRows(
  admin: AnyClient,
  table: string,
  organizationId: string
): Promise<number> {
  const { count, error } = await admin
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);
  if (error) return 0;
  return count ?? 0;
}

async function evaluateEligibleKeys(
  organizationId: string,
  features: Record<string, boolean> | undefined,
  saasStatus: string | null
): Promise<{ eligible: Array<{ key: DiscoveryKey; reason: string }>; suppressedBilling: boolean }> {
  const admin = serviceClient();
  const suppressedBilling =
    saasStatus === "past_due" ||
    saasStatus === "unpaid" ||
    saasStatus === "canceled" ||
    saasStatus === "paused";

  const entitled = filterEntitledDiscoveries({ features });
  const progress = await getImplementationProgress(organizationId, { refresh: false });
  const [woCount, aiCount, techCount, prefs] = await Promise.all([
    countRows(admin, "maintenance_work_orders", organizationId),
    countRows(admin, "ai_conversations", organizationId),
    admin
      .from("organization_memberships")
      .select("user_id, roles")
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .then((r: { data: Array<{ roles: unknown }> | null }) => {
        const rows = r.data ?? [];
        return rows.filter((row) => {
          const roles = Array.isArray(row.roles) ? row.roles.map(String) : [];
          return roles.includes("facility_technician");
        }).length;
      }),
    admin
      .from("notification_preferences")
      .select("email_enabled, push_enabled, sms_enabled, in_app_enabled")
      .eq("organization_id", organizationId)
      .limit(50)
      .then((r: { data: Array<Record<string, unknown>> | null; error: unknown }) => r)
  ]);

  const channelsOn =
    !prefs.error && prefs.data?.length
      ? prefs.data.some((row: Record<string, unknown>) =>
          Boolean(row["email_enabled"]) ||
          Boolean(row["push_enabled"]) ||
          Boolean(row["sms_enabled"]) ||
          Boolean(row["in_app_enabled"])
        )
      : true;

  const eligible: Array<{ key: DiscoveryKey; reason: string }> = [];
  const consider = (key: DiscoveryKey, condition: boolean, reason: string) => {
    if (!entitled.includes(key) || !condition) return;
    const def = DISCOVERY_CATALOG[key];
    if (suppressedBilling && !def.billingSafe) return;
    eligible.push({ key, reason });
  };

  consider(
    "payments_gap",
    !progress.milestones.stripe_connected.complete &&
      !progress.milestones.stripe_connected.waived,
    "Stripe not connected"
  );
  consider("ai_never_used", aiCount === 0, "Zero AI conversations");
  consider("no_technicians", techCount === 0, "No facility technicians");
  consider("notifications_off", !channelsOn, "All notification channels off");
  consider(
    "owner_reports_unused",
    progress.score >= 70,
    "Owner reports available but unused"
  );
  consider("low_wo_adoption", woCount === 0 && progress.score >= 40, "No work orders");

  return { eligible, suppressedBilling };
}

export async function getFeatureDiscoveries(
  organizationId: string
): Promise<FeatureDiscoverySnapshot> {
  const admin = serviceClient();
  const now = new Date();
  const nowMs = now.getTime();

  const [entitlements, saasRow, memoryRows] = await Promise.all([
    getEntitlementSnapshot(organizationId, admin),
    admin
      .from("saas_subscriptions")
      .select("status")
      .eq("organization_id", organizationId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then((r: { data: { status?: string } | null }) => r.data),
    admin
      .from("commercial_feature_discovery_states")
      .select("discovery_key, status, dismissed_at, snoozed_until, accepted_at")
      .eq("organization_id", organizationId)
      .then((r: { data: MemoryRow[] | null }) => (r.data ?? []) as MemoryRow[])
  ]);

  const saasStatus = saasRow?.status != null ? String(saasRow.status) : null;
  const { eligible, suppressedBilling } = await evaluateEligibleKeys(
    organizationId,
    entitlements?.features,
    saasStatus
  );

  const memoryByKey = new Map<string, MemoryRow>(
    memoryRows.map((row: MemoryRow) => [row.discovery_key, row])
  );
  const open: DiscoveryCandidate[] = [];

  for (const item of eligible) {
    const mem = memoryByKey.get(item.key);
    const block = memoryBlocks(mem, nowMs);
    if (block.blocked) continue;
    const def = DISCOVERY_CATALOG[item.key];
    open.push({
      ...def,
      status: block.status,
      reason: item.reason
    });
  }

  return {
    organizationId,
    primary: open[0] ?? null,
    open,
    suppressedBilling,
    evaluatedAt: now.toISOString()
  };
}

async function upsertMemory(input: {
  organizationId: string;
  discoveryKey: DiscoveryKey;
  patch: Record<string, unknown>;
}): Promise<void> {
  const admin = serviceClient();
  const { error } = await admin.from("commercial_feature_discovery_states").upsert(
    {
      organization_id: input.organizationId,
      discovery_key: input.discoveryKey,
      ...input.patch,
      updated_at: new Date().toISOString()
    },
    { onConflict: "organization_id,discovery_key" }
  );
  if (error) throw new Error(error.message ?? "Failed to update discovery state");
}

export async function impressDiscovery(input: {
  organizationId: string;
  discoveryKey: DiscoveryKey;
  actorUserId?: string | null;
}): Promise<FeatureDiscoverySnapshot> {
  if (!(DISCOVERY_KEYS as readonly string[]).includes(input.discoveryKey)) {
    throw new Error("Unknown discovery key");
  }
  const snapshot = await getFeatureDiscoveries(input.organizationId);
  const match = snapshot.open.find((d) => d.key === input.discoveryKey);
  if (!match) throw new Error("Discovery not currently eligible");

  const admin = serviceClient();
  const { data: existing } = await admin
    .from("commercial_feature_discovery_states")
    .select("impressed_count")
    .eq("organization_id", input.organizationId)
    .eq("discovery_key", input.discoveryKey)
    .maybeSingle();
  const nextCount = Number(existing?.["impressed_count"] ?? 0) + 1;
  const now = new Date().toISOString();

  await upsertMemory({
    organizationId: input.organizationId,
    discoveryKey: input.discoveryKey,
    patch: {
      status: "impressed",
      impressed_count: nextCount,
      last_impressed_at: now
    }
  });

  await appendCommunicationTimeline({
    organizationId: input.organizationId,
    channel: "in_app",
    entryType: "feature_discovery",
    templateKey: `discovery.${input.discoveryKey}.impressed`,
    direction: "outbound",
    actorType: "system",
    actorUserId: input.actorUserId ?? null,
    deliveryStatus: "delivered",
    summary: `Feature discovery impressed: ${input.discoveryKey}`,
    metadata: { discovery_key: input.discoveryKey, action: "impressed" },
    actorEmitUserId: input.actorUserId ?? null
  });

  await emitCommercialOpsEvent({
    eventType: "commercial.discovery.impressed",
    organizationId: input.organizationId,
    subjectType: "organization",
    subjectId: input.organizationId,
    actorUserId: input.actorUserId ?? null,
    summary: `Discovery impressed ${input.discoveryKey}`,
    payload: { discovery_key: input.discoveryKey }
  });

  return getFeatureDiscoveries(input.organizationId);
}

export async function dismissOrSnoozeDiscovery(input: {
  organizationId: string;
  discoveryKey: DiscoveryKey;
  mode: "dismiss" | "snooze" | "accept";
  snoozeDays?: number;
  actorUserId?: string | null;
}): Promise<FeatureDiscoverySnapshot> {
  if (!(DISCOVERY_KEYS as readonly string[]).includes(input.discoveryKey)) {
    throw new Error("Unknown discovery key");
  }

  const entitled = filterEntitledDiscoveries({
    features: (
      await getEntitlementSnapshot(input.organizationId)
    )?.features
  });
  if (!entitled.includes(input.discoveryKey)) {
    throw new Error("Discovery not entitled for this organization");
  }

  const now = new Date();
  const nowIso = now.toISOString();
  let status: DiscoveryStatus = "dismissed";
  const patch: Record<string, unknown> = {};

  if (input.mode === "accept") {
    status = "accepted";
    patch["accepted_at"] = nowIso;
  } else if (input.mode === "snooze") {
    status = "snoozed";
    const days = Math.max(1, Math.min(30, input.snoozeDays ?? 14));
    patch["snoozed_until"] = addDays(nowIso, days);
  } else {
    status = "dismissed";
    patch["dismissed_at"] = nowIso;
  }
  patch["status"] = status;

  await upsertMemory({
    organizationId: input.organizationId,
    discoveryKey: input.discoveryKey,
    patch
  });

  const action =
    input.mode === "accept" ? "accepted" : input.mode === "snooze" ? "snoozed" : "dismissed";

  await appendCommunicationTimeline({
    organizationId: input.organizationId,
    channel: "in_app",
    entryType: "feature_discovery",
    templateKey: `discovery.${input.discoveryKey}.${action}`,
    direction: "outbound",
    actorType: input.actorUserId ? "cs_user" : "system",
    actorUserId: input.actorUserId ?? null,
    deliveryStatus: "n_a",
    summary: `Feature discovery ${action}: ${input.discoveryKey}`,
    metadata: { discovery_key: input.discoveryKey, action },
    actorEmitUserId: input.actorUserId ?? null
  });

  await emitCommercialOpsEvent({
    eventType:
      action === "accepted"
        ? "commercial.discovery.accepted"
        : action === "snoozed"
          ? "commercial.discovery.snoozed"
          : "commercial.discovery.dismissed",
    organizationId: input.organizationId,
    subjectType: "organization",
    subjectId: input.organizationId,
    actorUserId: input.actorUserId ?? null,
    summary: `Discovery ${action} ${input.discoveryKey}`,
    payload: { discovery_key: input.discoveryKey, action }
  });

  return getFeatureDiscoveries(input.organizationId);
}
