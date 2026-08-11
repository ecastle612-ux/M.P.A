import {
  entitlementsForSku,
  isBillingCycle,
  isProductSku,
  isTerminalFailure,
  toSkuLabel,
  type ProductSku,
  type ProvisioningJob
} from "@mpa/shared";
import { createAuthServerClient } from "../auth/server";
import { serverEnv } from "../env/server-env";
import { listPlatformErrorEvents } from "../observability/durable-errors";
import { listProvisioningJobsFromDb } from "../saas-provisioning/jobs-store";
import { toSafePlatformErrorDto, type SafePlatformErrorDto } from "./platform-errors";
import {
  buildModuleStatesForOrg,
  capacityUtilizationPercent,
  countAuthRelatedErrors,
  deriveOrgHealth,
  mapLifecycleLabel,
  PROBLEM_SUB_STATUSES,
  scrubAuditContext,
  summarizeVendors,
  summarizeWorkOrders,
  type Ma2HealthIssue,
  type Ma2LifecycleLabel,
  type Ma2ModuleState,
  type Ma2VendorSummary,
  type Ma2WorkOrderSummary
} from "./ma2-org-detail";
import type { HealthTone } from "./command-center-metrics";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- additive ops tables
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

export type Ma2OrgDetailSnapshot = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  lifecycle: Ma2LifecycleLabel;
  health: HealthTone;
  healthIssues: Ma2HealthIssue[];
  setupComplete: boolean;
  modules: Ma2ModuleState[];
  entitlementKeys: string[];
  subscription: {
    status: string | null;
    sku: ProductSku | null;
    skuLabel: string | null;
    billingCycle: string | null;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    managedUnitCount: number | null;
    authorizedUnitCapacity: number | null;
    pendingAuthorizedUnitCapacity: number | null;
    declaredUnitCount: number | null;
    authorizedAdditionalBlocks: number | null;
    lastCapacityAuthorizedAt: string | null;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    stripeBaseItemId: string | null;
    stripeAdditionalCapacityItemId: string | null;
    quoteId: string | null;
  };
  capacity: {
    propertyCount: number;
    inventoryUnitCount: number | null;
    managedUnitCount: number | null;
    authorizedUnitCapacity: number | null;
    pendingAuthorizedUnitCapacity: number | null;
    utilizationPercent: number | null;
    utilizationAvailability: "authoritative" | "unavailable";
    utilizationNote?: string;
    overCapacity: boolean;
  };
  stripe: {
    customerId: string | null;
    subscriptionId: string | null;
    baseItemId: string | null;
    additionalCapacityItemId: string | null;
    billingCycle: string | null;
    status: string | null;
    priceIdsNote: string;
    linked: boolean;
  };
  users: Array<{
    membershipId: string;
    userId: string;
    roles: string[];
    status: string;
    updatedAt: string;
    createdAt: string | null;
  }>;
  invitations: Array<{
    id: string;
    email: string;
    status: string;
    roles: string[];
    createdAt: string;
  }>;
  properties: Array<{ id: string; name: string; status: string | null }>;
  checkout: Array<{
    sessionId: string;
    status: string;
    provisioned: boolean;
    productSku: string | null;
    billingCycle: string | null;
    createdAt: string;
    updatedAt: string;
    customerEmail: string | null;
  }>;
  provisioning: Array<{
    id: string;
    checkpoint: string;
    updatedAt: string;
    ownerEmail: string | null;
    productSku: string | null;
  }>;
  workOrders: Ma2WorkOrderSummary;
  recentWorkOrders: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    updatedAt: string;
    workSurface: string | null;
  }>;
  vendors: Ma2VendorSummary;
  recentVendors: Array<{ id: string; name: string; status: string; updatedAt: string }>;
  notifications: {
    recentFailed: number;
    recentSent: number;
    recentQueued: number;
    recent: Array<{
      id: string;
      title: string;
      createdAt: string;
      emailDeliveryStatus: string | null;
      channel: string | null;
    }>;
  };
  webhooks: {
    stripeLifecycle: Array<{
      id: string;
      eventType: string;
      processedAt: string;
      summary: string | null;
    }>;
    stripeCheckoutUnresolved: number;
    signwell: Array<{
      id: string;
      eventType: string;
      processedAt: string;
      documentId: string | null;
    }>;
    note: string;
  };
  errors: SafePlatformErrorDto[];
  audit: Array<{
    id: string;
    source: "support" | "domain";
    at: string;
    actor: string | null;
    action: string;
    target: string;
    result: string;
    context: Record<string, unknown>;
  }>;
  degraded: string[];
};

function sectionFail(degraded: string[], label: string, error: unknown): void {
  degraded.push(
    `${label}: ${error instanceof Error ? error.message : typeof error === "string" ? error : "failed"}`
  );
}

export async function loadMa2OrganizationDetail(
  orgId: string
): Promise<Ma2OrgDetailSnapshot | null> {
  const degraded: string[] = [];
  const service = await tryServiceRole();
  const authClient = (await createAuthServerClient()) as unknown as AnyClient;
  const client = (service ?? authClient) as AnyClient;

  // Server-validated org id — path param only; never trust client body/cookie for scope.
  const { data: org, error: orgError } = await client
    .from("organizations")
    .select("id, name, slug, created_at")
    .eq("id", orgId)
    .maybeSingle();

  if (orgError) {
    sectionFail(degraded, "Organization", orgError.message);
    return null;
  }
  if (!org) return null;

  const [
    subRes,
    setupRes,
    membersRes,
    invitesRes,
    propsRes,
    unitsCountRes,
    woRes,
    vendorsRes,
    notifRes,
    lifecycleWhRes,
    signwellRes,
    checkoutRes,
    supportAuditRes,
    domainAuditRes,
    jobs,
    errorFeed
  ] = await Promise.all([
    client
      .from("organization_subscriptions")
      .select(
        "status, sku_code, billing_cycle, stripe_customer_id, stripe_subscription_id, trial_ends_at, current_period_end, cancel_at_period_end, managed_unit_count, authorized_unit_capacity, pending_authorized_unit_capacity, declared_unit_count, authorized_additional_blocks, last_capacity_authorized_at, stripe_base_item_id, stripe_additional_capacity_item_id, quote_id"
      )
      .eq("organization_id", orgId)
      .maybeSingle()
      .then((r: { data: unknown; error: { message: string } | null }) => r)
      .catch((e: unknown) => {
        sectionFail(degraded, "Subscription", e);
        return { data: null, error: null };
      }),
    client
      .from("organization_setup_state")
      .select("completed_at, product_confirmed")
      .eq("organization_id", orgId)
      .maybeSingle()
      .catch((e: unknown) => {
        sectionFail(degraded, "Setup", e);
        return { data: null };
      }),
    client
      .from("organization_memberships")
      .select("id, user_id, roles, status, updated_at, created_at")
      .eq("organization_id", orgId)
      .order("updated_at", { ascending: false })
      .limit(100)
      .catch((e: unknown) => {
        sectionFail(degraded, "Memberships", e);
        return { data: [] };
      }),
    client
      .from("organization_invitations")
      .select("id, email, status, roles, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(50)
      .catch((e: unknown) => {
        sectionFail(degraded, "Invitations", e);
        return { data: [] };
      }),
    client
      .from("property_properties")
      .select("id, name, status")
      .eq("organization_id", orgId)
      .order("name")
      .limit(100)
      .catch((e: unknown) => {
        sectionFail(degraded, "Properties", e);
        return { data: [] };
      }),
    client
      .from("property_units")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .catch((e: unknown) => {
        sectionFail(degraded, "Units inventory", e);
        return { count: null };
      }),
    client
      .from("maintenance_work_orders")
      .select("id, title, status, priority, updated_at, work_surface, vendor_id")
      .eq("organization_id", orgId)
      .order("updated_at", { ascending: false })
      .limit(500)
      .catch((e: unknown) => {
        sectionFail(degraded, "Work orders", e);
        return { data: null };
      }),
    client
      .from("vendor_vendors")
      .select("id, name, status, updated_at")
      .eq("organization_id", orgId)
      .order("updated_at", { ascending: false })
      .limit(100)
      .catch((e: unknown) => {
        sectionFail(degraded, "Vendors", e);
        return { data: null };
      }),
    client
      .from("maintenance_notifications")
      .select("id, title, created_at, email_delivery_status, channel")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(50)
      .catch((e: unknown) => {
        sectionFail(degraded, "Notifications", e);
        return { data: [] };
      }),
    client
      .from("saas_lifecycle_events")
      .select("id, event_type, processed_at, summary, stripe_subscription_id")
      .eq("organization_id", orgId)
      .order("processed_at", { ascending: false })
      .limit(30)
      .catch((e: unknown) => {
        sectionFail(degraded, "Stripe lifecycle webhooks", e);
        return { data: [] };
      }),
    client
      .from("signwell_webhook_events")
      .select("id, event_type, processed_at, document_id")
      .eq("organization_id", orgId)
      .order("processed_at", { ascending: false })
      .limit(30)
      .catch((e: unknown) => {
        sectionFail(degraded, "SignWell webhooks", e);
        return { data: [] };
      }),
    client
      .from("saas_checkout_sessions")
      .select(
        "stripe_checkout_session_id, status, provisioned, product_sku, billing_cycle, created_at, updated_at, customer_email"
      )
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(40)
      .catch((e: unknown) => {
        sectionFail(degraded, "Checkout", e);
        return { data: [] };
      }),
    client
      .from("platform_support_audit_events")
      .select("id, action, created_at, entity_type, entity_id, operator_user_id, payload")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(40)
      .catch((e: unknown) => {
        sectionFail(degraded, "Support audit", e);
        return { data: [] };
      }),
    client
      .from("audit_events")
      .select("id, action, created_at, entity_type, entity_id, actor_id, payload")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(40)
      .catch((e: unknown) => {
        sectionFail(degraded, "Domain audit", e);
        return { data: [] };
      }),
    listProvisioningJobsFromDb(80).catch(() => [] as ProvisioningJob[]),
    listPlatformErrorEvents({
      organizationId: orgId,
      limit: 40
    })
  ]);

  if (errorFeed.degraded) {
    degraded.push(`Errors: ${errorFeed.detail ?? "platform_error_events unavailable"}`);
  }

  const sub = (subRes?.data ?? null) as Record<string, unknown> | null;
  const skuRaw = typeof sub?.["sku_code"] === "string" ? sub["sku_code"] : "";
  const sku = isProductSku(skuRaw) ? skuRaw : null;
  const billingCycleRaw =
    typeof sub?.["billing_cycle"] === "string" ? sub["billing_cycle"] : "";
  const billingCycle = isBillingCycle(billingCycleRaw) ? billingCycleRaw : billingCycleRaw || null;
  const status = typeof sub?.["status"] === "string" ? sub["status"] : null;
  const setupComplete = Boolean(
    (setupRes as { data?: { completed_at?: string | null } } | null)?.data?.completed_at
  );
  const cancelAtPeriodEnd = Boolean(sub?.["cancel_at_period_end"]);

  const orgJobs = ((jobs as ProvisioningJob[]) ?? []).filter((j) => j.organizationId === orgId);
  const lifecycle = mapLifecycleLabel({
    subscriptionStatus: status,
    setupComplete,
    provisioningStatuses: orgJobs.map((j) => j.checkpoint),
    cancelAtPeriodEnd
  });

  const managedUnitCount =
    typeof sub?.["managed_unit_count"] === "number" ? sub["managed_unit_count"] : null;
  const authorizedUnitCapacity =
    typeof sub?.["authorized_unit_capacity"] === "number"
      ? sub["authorized_unit_capacity"]
      : null;
  const pendingAuthorizedUnitCapacity =
    typeof sub?.["pending_authorized_unit_capacity"] === "number"
      ? sub["pending_authorized_unit_capacity"]
      : null;
  const util = capacityUtilizationPercent(managedUnitCount, authorizedUnitCapacity);
  const overCapacity =
    managedUnitCount != null &&
    authorizedUnitCapacity != null &&
    authorizedUnitCapacity > 0 &&
    managedUnitCount > authorizedUnitCapacity;

  const woRows = (woRes as { data?: Array<Record<string, unknown>> | null })?.data ?? null;
  const workOrders = summarizeWorkOrders(
    woRows?.map((r) => ({
      status: String(r["status"] ?? ""),
      priority: typeof r["priority"] === "string" ? r["priority"] : null
    })) ?? null,
    woRows === null ? "Work-order query failed" : undefined
  );

  const outstandingVendorWo =
    woRows?.filter(
      (r) =>
        r["vendor_id"] &&
        !["completed", "closed", "cancelled"].includes(String(r["status"] ?? ""))
    ).length ?? 0;

  const vendorRows = (vendorsRes as { data?: Array<Record<string, unknown>> | null })?.data ?? null;
  const vendors = summarizeVendors(
    vendorRows?.map((v) => ({ status: String(v["status"] ?? "") })) ?? null,
    outstandingVendorWo,
    vendorRows === null ? "Vendor query failed" : undefined
  );

  const notifRows =
    ((notifRes as { data?: Array<Record<string, unknown>> })?.data ?? []) as Array<
      Record<string, unknown>
    >;
  let recentFailed = 0;
  let recentSent = 0;
  let recentQueued = 0;
  for (const n of notifRows) {
    if (n["email_delivery_status"] === "failed") recentFailed += 1;
    else if (n["email_delivery_status"] === "sent") recentSent += 1;
    else if (n["email_delivery_status"] === "queued") recentQueued += 1;
  }

  const safeErrors = errorFeed.rows.map(toSafePlatformErrorDto);
  const authRelated = countAuthRelatedErrors(
    errorFeed.rows.map((r) => ({
      message: r.message,
      route: r.route,
      metadata: r.metadata ?? {}
    }))
  );

  const failedProvisioning = orgJobs.filter((j) => isTerminalFailure(j.checkpoint)).length;
  const problemSubscription = Boolean(status && PROBLEM_SUB_STATUSES.has(status));

  // Correlate unresolved Stripe checkout webhook events for this org's sessions.
  let stripeCheckoutUnresolved = 0;
  const checkoutRows =
    ((checkoutRes as { data?: Array<Record<string, unknown>> })?.data ?? []) as Array<
      Record<string, unknown>
    >;
  const sessionIds = checkoutRows
    .map((r) => r["stripe_checkout_session_id"])
    .filter((id): id is string => typeof id === "string");

  if (service && sessionIds.length > 0) {
    try {
      const { data: whRows, error: whErr } = await service
        .from("saas_stripe_webhook_events")
        .select("stripe_event_id, processed_at, checkout_session_id")
        .in("checkout_session_id", sessionIds.slice(0, 40))
        .limit(80);
      if (whErr) sectionFail(degraded, "Stripe checkout webhooks", whErr.message);
      else {
        stripeCheckoutUnresolved = ((whRows ?? []) as Array<Record<string, unknown>>).filter(
          (w) => !w["processed_at"]
        ).length;
      }
    } catch (e) {
      sectionFail(degraded, "Stripe checkout webhooks", e);
    }
  }

  const { tone, issues } = deriveOrgHealth({
    lifecycle,
    failedProvisioning,
    problemSubscription,
    overCapacity,
    criticalErrors: safeErrors.filter((e) => e.severity === "critical" || e.severity === "error")
      .length,
    notificationFailures: recentFailed,
    unresolvedStripeWebhooks: stripeCheckoutUnresolved,
    authRelatedErrors: authRelated
  });

  const entitlementKeys = sku ? entitlementsForSku(sku) : [];

  const supportAudit =
    ((supportAuditRes as { data?: Array<Record<string, unknown>> })?.data ?? []) as Array<
      Record<string, unknown>
    >;
  const domainAudit =
    ((domainAuditRes as { data?: Array<Record<string, unknown>> })?.data ?? []) as Array<
      Record<string, unknown>
    >;

  const audit = [
    ...supportAudit.map((a) => ({
      id: String(a["id"]),
      source: "support" as const,
      at: String(a["created_at"] ?? ""),
      actor: typeof a["operator_user_id"] === "string" ? a["operator_user_id"] : null,
      action: String(a["action"] ?? ""),
      target: `${a["entity_type"] ?? "unknown"}${a["entity_id"] ? `:${a["entity_id"]}` : ""}`,
      result: "recorded",
      context: scrubAuditContext(a["payload"])
    })),
    ...domainAudit.map((a) => ({
      id: String(a["id"]),
      source: "domain" as const,
      at: String(a["created_at"] ?? ""),
      actor: typeof a["actor_id"] === "string" ? a["actor_id"] : null,
      action: String(a["action"] ?? ""),
      target: `${a["entity_type"] ?? "unknown"}${a["entity_id"] ? `:${a["entity_id"]}` : ""}`,
      result: "recorded",
      context: scrubAuditContext(a["payload"] ?? {})
    }))
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 50);

  const stripeCustomerId =
    typeof sub?.["stripe_customer_id"] === "string" ? sub["stripe_customer_id"] : null;
  const stripeSubscriptionId =
    typeof sub?.["stripe_subscription_id"] === "string" ? sub["stripe_subscription_id"] : null;
  const stripeBaseItemId =
    typeof sub?.["stripe_base_item_id"] === "string" ? sub["stripe_base_item_id"] : null;
  const stripeAdditionalCapacityItemId =
    typeof sub?.["stripe_additional_capacity_item_id"] === "string"
      ? sub["stripe_additional_capacity_item_id"]
      : null;

  const inventoryUnitCount =
    typeof (unitsCountRes as { count?: number | null })?.count === "number"
      ? (unitsCountRes as { count: number }).count
      : null;

  const properties =
    ((propsRes as { data?: Array<Record<string, unknown>> })?.data ?? []) as Array<
      Record<string, unknown>
    >;

  const capacityNote = util.note;
  const capacityBlock: Ma2OrgDetailSnapshot["capacity"] = {
    propertyCount: properties.length,
    inventoryUnitCount,
    managedUnitCount,
    authorizedUnitCapacity,
    pendingAuthorizedUnitCapacity,
    utilizationPercent: util.value,
    utilizationAvailability: util.availability,
    overCapacity
  };
  if (capacityNote) capacityBlock.utilizationNote = capacityNote;

  return {
    id: org.id as string,
    name: org.name as string,
    slug: org.slug as string,
    createdAt: org.created_at as string,
    lifecycle,
    health: tone,
    healthIssues: issues,
    setupComplete,
    modules: buildModuleStatesForOrg(sku),
    entitlementKeys,
    subscription: {
      status,
      sku,
      skuLabel: sku ? toSkuLabel(sku) : null,
      billingCycle,
      trialEndsAt: typeof sub?.["trial_ends_at"] === "string" ? sub["trial_ends_at"] : null,
      currentPeriodEnd:
        typeof sub?.["current_period_end"] === "string" ? sub["current_period_end"] : null,
      cancelAtPeriodEnd,
      managedUnitCount,
      authorizedUnitCapacity,
      pendingAuthorizedUnitCapacity,
      declaredUnitCount:
        typeof sub?.["declared_unit_count"] === "number" ? sub["declared_unit_count"] : null,
      authorizedAdditionalBlocks:
        typeof sub?.["authorized_additional_blocks"] === "number"
          ? sub["authorized_additional_blocks"]
          : null,
      lastCapacityAuthorizedAt:
        typeof sub?.["last_capacity_authorized_at"] === "string"
          ? sub["last_capacity_authorized_at"]
          : null,
      stripeCustomerId,
      stripeSubscriptionId,
      stripeBaseItemId,
      stripeAdditionalCapacityItemId,
      quoteId: typeof sub?.["quote_id"] === "string" ? sub["quote_id"] : null
    },
    capacity: capacityBlock,
    stripe: {
      customerId: stripeCustomerId,
      subscriptionId: stripeSubscriptionId,
      baseItemId: stripeBaseItemId,
      additionalCapacityItemId: stripeAdditionalCapacityItemId,
      billingCycle,
      status,
      priceIdsNote:
        "Authoritative Stripe Price IDs are not stored on organization_subscriptions; subscription item IDs are shown when present.",
      linked: Boolean(stripeCustomerId || stripeSubscriptionId)
    },
    users: (
      ((membersRes as { data?: Array<Record<string, unknown>> })?.data ?? []) as Array<
        Record<string, unknown>
      >
    ).map((m) => ({
      membershipId: String(m["id"]),
      userId: String(m["user_id"]),
      roles: Array.isArray(m["roles"]) ? (m["roles"] as string[]) : [],
      status: String(m["status"] ?? ""),
      updatedAt: String(m["updated_at"] ?? ""),
      createdAt: typeof m["created_at"] === "string" ? m["created_at"] : null
    })),
    invitations: (
      ((invitesRes as { data?: Array<Record<string, unknown>> })?.data ?? []) as Array<
        Record<string, unknown>
      >
    ).map((i) => ({
      id: String(i["id"]),
      email: String(i["email"] ?? ""),
      status: String(i["status"] ?? ""),
      roles: Array.isArray(i["roles"]) ? (i["roles"] as string[]) : [],
      createdAt: String(i["created_at"] ?? "")
    })),
    properties: properties.map((p) => ({
      id: String(p["id"]),
      name: String(p["name"] ?? ""),
      status: typeof p["status"] === "string" ? p["status"] : null
    })),
    checkout: checkoutRows.map((c) => ({
      sessionId: String(c["stripe_checkout_session_id"] ?? ""),
      status: String(c["status"] ?? ""),
      provisioned: Boolean(c["provisioned"]),
      productSku: typeof c["product_sku"] === "string" ? c["product_sku"] : null,
      billingCycle: typeof c["billing_cycle"] === "string" ? c["billing_cycle"] : null,
      createdAt: String(c["created_at"] ?? ""),
      updatedAt: String(c["updated_at"] ?? ""),
      customerEmail: typeof c["customer_email"] === "string" ? c["customer_email"] : null
    })),
    provisioning: orgJobs.slice(0, 20).map((j) => ({
      id: j.checkoutSessionId || j.id,
      checkpoint: j.checkpoint,
      updatedAt: j.updatedAt,
      ownerEmail: j.ownerEmail ?? null,
      productSku: j.productSku ?? null
    })),
    workOrders,
    recentWorkOrders: (woRows ?? []).slice(0, 12).map((r) => ({
      id: String(r["id"]),
      title: String(r["title"] ?? ""),
      status: String(r["status"] ?? ""),
      priority: String(r["priority"] ?? "normal"),
      updatedAt: String(r["updated_at"] ?? ""),
      workSurface: typeof r["work_surface"] === "string" ? r["work_surface"] : null
    })),
    vendors,
    recentVendors: (vendorRows ?? []).slice(0, 12).map((v) => ({
      id: String(v["id"]),
      name: String(v["name"] ?? ""),
      status: String(v["status"] ?? ""),
      updatedAt: String(v["updated_at"] ?? "")
    })),
    notifications: {
      recentFailed,
      recentSent,
      recentQueued,
      recent: notifRows.slice(0, 12).map((n) => ({
        id: String(n["id"]),
        title: String(n["title"] ?? ""),
        createdAt: String(n["created_at"] ?? ""),
        emailDeliveryStatus:
          typeof n["email_delivery_status"] === "string" ? n["email_delivery_status"] : null,
        channel: typeof n["channel"] === "string" ? n["channel"] : null
      }))
    },
    webhooks: {
      stripeLifecycle: (
        ((lifecycleWhRes as { data?: Array<Record<string, unknown>> })?.data ?? []) as Array<
          Record<string, unknown>
        >
      ).map((e) => ({
        id: String(e["id"]),
        eventType: String(e["event_type"] ?? ""),
        processedAt: String(e["processed_at"] ?? ""),
        summary: typeof e["summary"] === "string" ? e["summary"] : null
      })),
      stripeCheckoutUnresolved,
      signwell: (
        ((signwellRes as { data?: Array<Record<string, unknown>> })?.data ?? []) as Array<
          Record<string, unknown>
        >
      ).map((e) => ({
        id: String(e["id"]),
        eventType: String(e["event_type"] ?? ""),
        processedAt: String(e["processed_at"] ?? ""),
        documentId: typeof e["document_id"] === "string" ? e["document_id"] : null
      })),
      note: "Inspect-only. Webhook replay is not available in MA-2. SignWell signature rejects are not persisted."
    },
    errors: safeErrors,
    audit,
    degraded
  };
}
