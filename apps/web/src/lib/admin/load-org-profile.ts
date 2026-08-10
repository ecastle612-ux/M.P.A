import { toSkuLabel, type ProductSku } from "@mpa/shared";
import { createAuthServerClient } from "../auth/server";
import { serverEnv } from "../env/server-env";
import { listProvisioningJobsFromDb } from "../saas-provisioning/jobs-store";
import type { HealthTone } from "./command-center-metrics";
import { classifyOrganizationBucket } from "./command-center-metrics";

type AnyClient = {
  from: (table: string) => any;
};

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

export type OrgProfileSnapshot = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  statusBucket: string;
  health: HealthTone;
  subscription: {
    status: string | null;
    sku: ProductSku | null;
    skuLabel: string | null;
    billingCycle: string | null;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
  };
  setupComplete: boolean;
  modules: string[];
  properties: Array<{ id: string; name: string; status: string | null }>;
  users: Array<{
    membershipId: string;
    userId: string;
    roles: string[];
    status: string;
    updatedAt: string;
  }>;
  invitations: Array<{ id: string; email: string; status: string; roles: string[]; createdAt: string }>;
  provisioning: Array<{ id: string; status: string; updatedAt: string }>;
  documentsCount: number;
  residentsCount: number;
  applicationsCount: number;
  recentEvents: Array<{ id: string; type: string; at: string; detail: string }>;
  supportAudit: Array<{ id: string; action: string; at: string; entityType: string }>;
};

export async function loadOrganizationProfile(orgId: string): Promise<OrgProfileSnapshot | null> {
  const service = await tryServiceRole();
  const client = (service ?? ((await createAuthServerClient()) as unknown as AnyClient)) as AnyClient;

  const { data: org, error } = await client
    .from("organizations")
    .select("id, name, slug, created_at")
    .eq("id", orgId)
    .maybeSingle();
  if (error || !org) return null;

  const [
    subRes,
    setupRes,
    membersRes,
    invitesRes,
    propsRes,
    docsCountRes,
    residentsCountRes,
    appsCountRes,
    eventsRes,
    auditRes,
    jobs
  ] = await Promise.all([
    client
      .from("organization_subscriptions")
      .select("status, sku_code, billing_cycle, stripe_customer_id, stripe_subscription_id")
      .eq("organization_id", orgId)
      .maybeSingle(),
    client
      .from("organization_setup_state")
      .select("completed_at, product_confirmed")
      .eq("organization_id", orgId)
      .maybeSingle(),
    client
      .from("organization_memberships")
      .select("id, user_id, roles, status, updated_at")
      .eq("organization_id", orgId)
      .order("updated_at", { ascending: false })
      .limit(50),
    client
      .from("organization_invitations")
      .select("id, email, status, roles, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(30),
    client
      .from("property_properties")
      .select("id, name, status")
      .eq("organization_id", orgId)
      .order("name")
      .limit(50),
    client
      .from("document_documents")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId),
    client
      .from("pm_residents")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId),
    client
      .from("lease_applications")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId),
    client
      .from("event_domain_events")
      .select("id, event_type, created_at, payload")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(20),
    client
      .from("platform_support_audit_events")
      .select("id, action, created_at, entity_type")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(20),
    listProvisioningJobsFromDb().catch(() => [])
  ]);

  const sub = (subRes?.data ?? null) as {
    status?: string | null;
    sku_code?: string | null;
    billing_cycle?: string | null;
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
  } | null;
  const setupComplete = Boolean(setupRes?.data?.completed_at);
  const sku = (sub?.sku_code as ProductSku | null) ?? null;
  const orgJobs = (jobs ?? []).filter((j) => j.organizationId === orgId).slice(0, 10);
  const statusBucket = classifyOrganizationBucket({
    subscriptionStatus: sub?.status ?? null,
    setupComplete,
    provisioningStatuses: orgJobs.map((j) => j.checkpoint)
  });

  return {
    id: org.id as string,
    name: org.name as string,
    slug: org.slug as string,
    createdAt: org.created_at as string,
    statusBucket,
    health:
      statusBucket === "active"
        ? "ok"
        : statusBucket === "pending_provisioning" || statusBucket === "suspended"
          ? "warn"
          : "info",
    subscription: {
      status: sub?.status ?? null,
      sku,
      skuLabel: sku ? toSkuLabel(sku) : null,
      billingCycle: sub?.billing_cycle ?? null,
      stripeCustomerId: sub?.stripe_customer_id ?? null,
      stripeSubscriptionId: sub?.stripe_subscription_id ?? null
    },
    setupComplete,
    modules: sku ? [toSkuLabel(sku)] : [],
    properties: ((propsRes?.data ?? []) as Array<{ id: string; name: string; status: string | null }>).map(
      (p) => ({
        id: p.id,
        name: p.name,
        status: p.status ?? null
      })
    ),
    users: ((membersRes?.data ?? []) as Array<{
      id: string;
      user_id: string;
      roles: string[] | null;
      status: string;
      updated_at: string;
    }>).map((m) => ({
      membershipId: m.id,
      userId: m.user_id,
      roles: m.roles ?? [],
      status: m.status,
      updatedAt: m.updated_at
    })),
    invitations: ((invitesRes?.data ?? []) as Array<{
      id: string;
      email: string;
      status: string;
      roles: string[] | null;
      created_at: string;
    }>).map((i) => ({
      id: i.id,
      email: i.email,
      status: i.status,
      roles: i.roles ?? [],
      createdAt: i.created_at
    })),
    provisioning: orgJobs.map((j) => ({
      id: j.checkoutSessionId,
      status: j.checkpoint,
      updatedAt: j.updatedAt
    })),
    documentsCount: (docsCountRes?.count as number | null) ?? 0,
    residentsCount: (residentsCountRes?.count as number | null) ?? 0,
    applicationsCount: (appsCountRes?.count as number | null) ?? 0,
    recentEvents: ((eventsRes?.data ?? []) as Array<{
      id: string;
      event_type: string;
      created_at: string;
      payload: { title?: string } | null;
    }>).map((e) => ({
      id: e.id,
      type: e.event_type,
      at: e.created_at,
      detail: typeof e.payload?.title === "string" ? e.payload.title : "Event"
    })),
    supportAudit: ((auditRes?.data ?? []) as Array<{
      id: string;
      action: string;
      created_at: string;
      entity_type: string;
    }>).map((a) => ({
      id: a.id,
      action: a.action,
      at: a.created_at,
      entityType: a.entity_type
    }))
  };
}
