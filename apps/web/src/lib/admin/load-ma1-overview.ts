import { isBillingCycle, isProductSku } from "@mpa/shared";
import { createAuthServerClient } from "../auth/server";
import { serverEnv } from "../env/server-env";
import { listRecentPlatformErrorEvents } from "../observability/durable-errors";
import { listProvisioningJobsFromDb } from "../saas-provisioning/jobs-store";
import {
  listSaasPurchases,
  listSaasWebhookEvents,
  type StoredSaasPurchase,
  type StoredSaasWebhookEvent
} from "../saas-stripe/purchase-store";
import { isSaasCheckoutReady, isSaasStripeConfigured } from "../saas-stripe/client";
import { loadCommandCenterSnapshot } from "./load-command-center";
import type { CommandCenterSnapshot, OrgMetricRow } from "./command-center-metrics";
import {
  buildMa1OverviewExtras,
  isAuthRelatedError,
  type CapacityOrgRow,
  type Ma1OverviewExtras,
  type NotificationDeliveryRow,
  type SignWellWebhookRow
} from "./ma1-overview";
import { toSafePlatformErrorDto, type SafePlatformErrorDto } from "./platform-errors";

export type Ma1OverviewSnapshot = {
  commandCenter: CommandCenterSnapshot;
  ma1: Ma1OverviewExtras;
  recentErrors: SafePlatformErrorDto[];
  degraded: string[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- loose service client for additive tables
type AnyClient = { from: (table: string) => any };

async function tryServiceRole(): Promise<AnyClient | null> {
  try {
    if (process.env["VITEST"]) return null;
    if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) return null;
    const { createServiceRoleClient } = await import("../supabase/service-role");
    return createServiceRoleClient() as unknown as AnyClient;
  } catch {
    return null;
  }
}

async function loadCapacityRows(client: AnyClient | null): Promise<{
  rows: CapacityOrgRow[];
  degraded?: string;
}> {
  if (!client) return { rows: [], degraded: "Capacity metrics unavailable (no service role)" };
  try {
    const { data, error } = await client
      .from("organization_subscriptions")
      .select(
        "organization_id, status, managed_unit_count, authorized_unit_capacity, pending_authorized_unit_capacity, declared_unit_count, last_capacity_authorized_at"
      )
      .limit(2000);
    if (error) return { rows: [], degraded: `Capacity query failed: ${error.message}` };
    const rows: CapacityOrgRow[] = ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
      organizationId: String(row["organization_id"]),
      managedUnitCount:
        typeof row["managed_unit_count"] === "number" ? row["managed_unit_count"] : null,
      authorizedUnitCapacity:
        typeof row["authorized_unit_capacity"] === "number"
          ? row["authorized_unit_capacity"]
          : null,
      pendingAuthorizedUnitCapacity:
        typeof row["pending_authorized_unit_capacity"] === "number"
          ? row["pending_authorized_unit_capacity"]
          : null,
      declaredUnitCount:
        typeof row["declared_unit_count"] === "number" ? row["declared_unit_count"] : null,
      lastCapacityAuthorizedAt:
        typeof row["last_capacity_authorized_at"] === "string"
          ? row["last_capacity_authorized_at"]
          : null,
      subscriptionStatus: typeof row["status"] === "string" ? row["status"] : null
    }));
    return { rows };
  } catch (error) {
    return {
      rows: [],
      degraded: error instanceof Error ? error.message : "Capacity load failed"
    };
  }
}

async function loadSignWellWebhooks(client: AnyClient | null): Promise<{
  rows: SignWellWebhookRow[];
  degraded?: string;
}> {
  if (!client) return { rows: [], degraded: "SignWell webhook metrics unavailable (no service role)" };
  try {
    const { data, error } = await client
      .from("signwell_webhook_events")
      .select("id, event_type, processed_at, organization_id")
      .order("processed_at", { ascending: false })
      .limit(80);
    if (error) return { rows: [], degraded: `SignWell webhook query failed: ${error.message}` };
    return {
      rows: ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
        id: String(row["id"]),
        eventType: String(row["event_type"] ?? "unknown"),
        processedAt: String(row["processed_at"] ?? ""),
        organizationId:
          typeof row["organization_id"] === "string" ? row["organization_id"] : null
      }))
    };
  } catch (error) {
    return {
      rows: [],
      degraded: error instanceof Error ? error.message : "SignWell webhook load failed"
    };
  }
}

async function loadNotificationDeliveries(client: AnyClient | null): Promise<{
  rows: NotificationDeliveryRow[];
  degraded?: string;
}> {
  if (!client) {
    return { rows: [], degraded: "Notification delivery metrics unavailable (no service role)" };
  }
  try {
    const { data, error } = await client
      .from("maintenance_notifications")
      .select("id, email_delivery_status, created_at, organization_id")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      return { rows: [], degraded: `Notification query failed: ${error.message}` };
    }
    return {
      rows: ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
        id: String(row["id"]),
        emailDeliveryStatus:
          typeof row["email_delivery_status"] === "string" ? row["email_delivery_status"] : null,
        createdAt: String(row["created_at"] ?? ""),
        organizationId:
          typeof row["organization_id"] === "string" ? row["organization_id"] : null
      }))
    };
  } catch (error) {
    return {
      rows: [],
      degraded: error instanceof Error ? error.message : "Notification load failed"
    };
  }
}

async function loadStripeWebhooksFallback(): Promise<StoredSaasWebhookEvent[]> {
  return listSaasWebhookEvents();
}

async function loadPurchasesFallback(): Promise<StoredSaasPurchase[]> {
  return listSaasPurchases();
}

/**
 * Reconstruct org metric rows from the already-built command center activity links
 * is lossy — prefer loading capacity/orgs via the shared command center path.
 * For MA-1 extras we re-query subscriptions capacity and reuse CC org totals where possible.
 */
export async function loadMa1OverviewSnapshot(): Promise<Ma1OverviewSnapshot> {
  const degraded: string[] = [];
  const commandCenter = await loadCommandCenterSnapshot();
  const service = await tryServiceRole();
  const authClient = (await createAuthServerClient()) as unknown as AnyClient;
  const client = service ?? authClient;

  const [capacity, signwell, notifications, errorRows, provisioningJobs, purchases, stripeEvents] =
    await Promise.all([
      loadCapacityRows(service),
      loadSignWellWebhooks(service),
      loadNotificationDeliveries(service),
      listRecentPlatformErrorEvents(50),
      listProvisioningJobsFromDb(60).catch(() => []),
      loadPurchasesFallback(),
      loadStripeWebhooksFallback()
    ]);

  if (capacity.degraded) degraded.push(capacity.degraded);
  if (signwell.degraded) degraded.push(signwell.degraded);
  if (notifications.degraded) degraded.push(notifications.degraded);
  if (!service) degraded.push("Service role unavailable — some MA-1 tiles may be empty");

  // Rebuild org rows for bucket math from capacity + CC totals alone is insufficient.
  // Re-load lightweight org+subscription snapshot for authoritative MA-1 org section.
  const orgRows = await loadOrgMetricRows(client, degraded);

  let criticalSeverityCount = 0;
  let errorSeverityCount = 0;
  let authRelatedErrorCount = 0;
  for (const row of errorRows) {
    if (row.severity === "critical") criticalSeverityCount += 1;
    if (row.severity === "error") errorSeverityCount += 1;
    if (
      isAuthRelatedError({
        message: row.message,
        route: row.route,
        metadata: row.metadata ?? {}
      })
    ) {
      authRelatedErrorCount += 1;
    }
  }

  const ma1 = buildMa1OverviewExtras({
    organizations: orgRows,
    capacityRows: capacity.rows,
    provisioningJobs,
    purchases,
    stripeWebhooks: stripeEvents,
    signwellWebhooks: signwell.rows,
    notifications: notifications.rows,
    criticalErrorCount: errorRows.length,
    criticalSeverityCount,
    errorSeverityCount,
    authRelatedErrorCount,
    supabaseOk: commandCenter.system.find((s) => s.id === "supabase")?.tone !== "down",
    generatedAt: commandCenter.generatedAt
  });

  // Align system config tones into overall when Stripe/email down.
  if (!isSaasStripeConfigured() || !isSaasCheckoutReady()) {
    if (ma1.overallHealth === "ok") {
      ma1.overallHealth = "warn";
      ma1.overallDetail = "Stripe SaaS checkout not fully ready";
    }
  }

  return {
    commandCenter,
    ma1,
    recentErrors: errorRows.slice(0, 12).map(toSafePlatformErrorDto),
    degraded
  };
}

async function loadOrgMetricRows(
  client: AnyClient,
  degraded: string[]
): Promise<OrgMetricRow[]> {
  try {
    const { data: organizations, error } = await client
      .from("organizations")
      .select("id, name, slug, created_at")
      .order("created_at", { ascending: false })
      .limit(2000);
    if (error) {
      degraded.push(`Organizations query failed: ${error.message}`);
      return [];
    }
    const orgs = (organizations ?? []) as Array<{
      id: string;
      name: string;
      slug: string;
      created_at: string;
    }>;
    const orgIds = orgs.map((o) => o.id);
    if (!orgIds.length) return [];

    const [{ data: subscriptions }, { data: setups }] = await Promise.all([
      client
        .from("organization_subscriptions")
        .select("organization_id, sku_code, status, plan_tier, billing_cycle")
        .in("organization_id", orgIds),
      client
        .from("organization_setup_state")
        .select("organization_id, completed_at")
        .in("organization_id", orgIds)
    ]);

    const subByOrg = new Map(
      ((subscriptions ?? []) as Array<Record<string, unknown>>).map((row) => [
        String(row["organization_id"]),
        row
      ])
    );
    const setupByOrg = new Map(
      ((setups ?? []) as Array<Record<string, unknown>>).map((row) => [
        String(row["organization_id"]),
        Boolean(row["completed_at"])
      ])
    );

    return orgs.map((org) => {
      const sub = subByOrg.get(org.id);
      const skuRaw = typeof sub?.["sku_code"] === "string" ? sub["sku_code"] : "";
      const cycleRaw = typeof sub?.["billing_cycle"] === "string" ? sub["billing_cycle"] : "";
      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        createdAt: org.created_at,
        subscriptionStatus: typeof sub?.["status"] === "string" ? (sub["status"] as string) : null,
        setupComplete: setupByOrg.get(org.id) ?? false,
        productSku: isProductSku(skuRaw) ? skuRaw : null,
        planTier: typeof sub?.["plan_tier"] === "string" ? (sub["plan_tier"] as string) : "professional",
        billingCycle: isBillingCycle(cycleRaw) ? cycleRaw : null
      };
    });
  } catch (error) {
    degraded.push(error instanceof Error ? error.message : "Org metric load failed");
    return [];
  }
}
