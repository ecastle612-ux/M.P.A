import {
  MASTER_ADMIN_GRANT_AUDIT_EVENTS,
  isActiveComplimentaryGrant,
  isComplimentaryGrantPastExpiration,
  isProductSku,
  type ProductSku
} from "@mpa/shared";
import { createAuthServerClient } from "../auth/server";
import { createOrganizationSlugFromName } from "../organization/contracts";
import { serverEnv } from "../env/server-env";
import { writeSupportAudit } from "./impersonation-service";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- additive ops table
type LooseClient = { from: (table: string) => any; auth: { admin: any } };

export type MasterAdminAccessGrant = {
  id: string;
  organization_id: string;
  granted_by_user_id: string;
  plan_granted: ProductSku;
  grant_status: "active" | "revoked" | "expired";
  start_date: string;
  expiration_date: string | null;
  reason: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  revoked_at: string | null;
  revoked_by_user_id: string | null;
  organization_name?: string | null;
  organization_slug?: string | null;
  tester_email?: string | null;
};

async function tryServiceRole(): Promise<LooseClient | null> {
  try {
    if (process.env["VITEST"]) return null;
    if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) return null;
    const { createServiceRoleClient } = await import("../supabase/service-role");
    return createServiceRoleClient() as unknown as LooseClient;
  } catch {
    return null;
  }
}

async function dbClient(): Promise<LooseClient> {
  const service = await tryServiceRole();
  if (service) return service;
  return (await createAuthServerClient()) as unknown as LooseClient;
}

function mapGrant(row: Record<string, unknown>): MasterAdminAccessGrant {
  return {
    id: String(row["id"]),
    organization_id: String(row["organization_id"]),
    granted_by_user_id: String(row["granted_by_user_id"]),
    plan_granted: row["plan_granted"] as ProductSku,
    grant_status: row["grant_status"] as MasterAdminAccessGrant["grant_status"],
    start_date: String(row["start_date"]),
    expiration_date: (row["expiration_date"] as string | null) ?? null,
    reason: String(row["reason"]),
    notes: (row["notes"] as string | null) ?? null,
    created_at: String(row["created_at"]),
    updated_at: String(row["updated_at"]),
    revoked_at: (row["revoked_at"] as string | null) ?? null,
    revoked_by_user_id: (row["revoked_by_user_id"] as string | null) ?? null
  };
}

export async function loadActiveGrantForOrganization(
  organizationId: string,
  now: Date = new Date()
): Promise<MasterAdminAccessGrant | null> {
  const client = await dbClient();
  const { data, error } = await client
    .from("master_admin_access_grants")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("grant_status", "active")
    .maybeSingle();

  if (error || !data) return null;
  const grant = mapGrant(data as Record<string, unknown>);

  if (isComplimentaryGrantPastExpiration(grant, now)) {
    await markGrantExpired({
      grantId: grant.id,
      organizationId,
      planGranted: grant.plan_granted,
      actorUserId: grant.granted_by_user_id
    });
    return null;
  }

  if (!isActiveComplimentaryGrant(grant, now)) return null;
  return grant;
}

async function markGrantExpired(input: {
  grantId: string;
  organizationId: string;
  planGranted: ProductSku;
  actorUserId: string;
}): Promise<void> {
  const client = await dbClient();
  const nowIso = new Date().toISOString();
  await client
    .from("master_admin_access_grants")
    .update({ grant_status: "expired", updated_at: nowIso })
    .eq("id", input.grantId)
    .eq("grant_status", "active");

  await writeSupportAudit({
    operatorUserId: input.actorUserId,
    organizationId: input.organizationId,
    action: MASTER_ADMIN_GRANT_AUDIT_EVENTS.EXPIRED,
    entityType: "master_admin_access_grant",
    entityId: input.grantId,
    payload: { plan: input.planGranted, automatic: true }
  }).catch(() => undefined);
}

export async function listComplimentaryGrants(filter?: {
  status?: "active" | "revoked" | "expired" | "all";
}): Promise<MasterAdminAccessGrant[]> {
  const client = await dbClient();
  const status = filter?.status ?? "all";
  let query = client
    .from("master_admin_access_grants")
    .select(
      "*, organizations(name, slug)"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (status !== "all") {
    query = query.eq("grant_status", status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const now = new Date();
  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const mapped: MasterAdminAccessGrant[] = [];

  for (const row of rows) {
    const grant = mapGrant(row);
    const org = row["organizations"] as { name?: string; slug?: string } | null;
    grant.organization_name = org?.name ?? null;
    grant.organization_slug = org?.slug ?? null;

    if (grant.grant_status === "active" && isComplimentaryGrantPastExpiration(grant, now)) {
      await markGrantExpired({
        grantId: grant.id,
        organizationId: grant.organization_id,
        planGranted: grant.plan_granted,
        actorUserId: grant.granted_by_user_id
      });
      grant.grant_status = "expired";
      grant.updated_at = now.toISOString();
    }
    mapped.push(grant);
  }

  return mapped;
}

async function ensureAuthUser(
  email: string
): Promise<{ userId: string; created: boolean } | { error: string }> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) {
    return { error: "Valid tester email is required." };
  }

  const supabase = await tryServiceRole();
  if (!supabase) {
    return { error: "Service role required to provision tester identity." };
  }

  const listed = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  const existing = listed.data.users.find((u: { email?: string }) => u.email?.toLowerCase() === normalized);
  if (existing) {
    return { userId: existing.id, created: false };
  }

  const created = await supabase.auth.admin.createUser({
    email: normalized,
    email_confirm: false,
    user_metadata: { mpa_complimentary_tester: true }
  });
  if (created.error || !created.data.user) {
    return { error: created.error?.message ?? "Failed to create tester user." };
  }
  return { userId: created.data.user.id, created: true };
}

async function resolveOrCreateTesterOrganization(input: {
  userId: string;
  email: string;
  organizationId?: string | null;
}): Promise<{ organizationId: string } | { error: string }> {
  const client = await dbClient();

  if (input.organizationId) {
    const { data: org } = await client
      .from("organizations")
      .select("id")
      .eq("id", input.organizationId)
      .maybeSingle();
    if (!org) return { error: "Organization not found." };
    return { organizationId: org.id as string };
  }

  const { data: memberships } = await client
    .from("organization_memberships")
    .select("organization_id")
    .eq("user_id", input.userId)
    .eq("status", "active");

  const orgIds = (memberships ?? []).map((m: { organization_id: string }) => m.organization_id);
  if (orgIds.length === 1) {
    return { organizationId: orgIds[0]! };
  }
  if (orgIds.length > 1) {
    return {
      error:
        "Tester belongs to multiple organizations. Pass organizationId to target a specific org."
    };
  }

  const local = input.email.split("@")[0] || "tester";
  const name = `${local} (tester)`;
  const slug = `${createOrganizationSlugFromName(name)}-${Date.now().toString(36)}`;
  const { data, error } = await client
    .from("organizations")
    .insert({
      name,
      slug,
      created_by: input.userId
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to create tester organization." };
  }

  await client.from("organization_memberships").upsert(
    {
      organization_id: data.id,
      user_id: input.userId,
      roles: ["organization_admin", "property_manager"],
      status: "active"
    },
    { onConflict: "organization_id,user_id" }
  );

  return { organizationId: data.id as string };
}

async function confirmProductSetup(organizationId: string): Promise<void> {
  const client = await dbClient();
  await client.from("organization_setup_state").upsert(
    {
      organization_id: organizationId,
      product_confirmed: true,
      checklist: {
        product_selected: true
      }
    },
    { onConflict: "organization_id" }
  );
}

export async function createComplimentaryGrant(input: {
  operatorUserId: string;
  email: string;
  planGranted: ProductSku;
  reason: string;
  notes?: string | null;
  expirationDate: string | null;
  allowNoExpiration: boolean;
  organizationId?: string | null;
  startDate?: string;
}): Promise<{ grant: MasterAdminAccessGrant } | { error: string; status?: number }> {
  if (!isProductSku(input.planGranted)) {
    return { error: "Invalid plan.", status: 400 };
  }
  const reason = input.reason.trim();
  if (!reason) {
    return { error: "Reason is required.", status: 400 };
  }
  if (input.expirationDate == null && !input.allowNoExpiration) {
    return { error: "No-expiration grants require explicit confirmation.", status: 400 };
  }
  if (input.expirationDate) {
    const exp = Date.parse(input.expirationDate);
    if (Number.isNaN(exp) || exp <= Date.now()) {
      return { error: "expirationDate must be a future timestamp.", status: 400 };
    }
  }

  const identity = await ensureAuthUser(input.email);
  if ("error" in identity) {
    return { error: identity.error, status: 400 };
  }

  const org = await resolveOrCreateTesterOrganization({
    userId: identity.userId,
    email: input.email.trim().toLowerCase(),
    organizationId: input.organizationId ?? null
  });
  if ("error" in org) {
    return { error: org.error, status: 400 };
  }

  const client = await dbClient();
  const { data: existingActive } = await client
    .from("master_admin_access_grants")
    .select("id")
    .eq("organization_id", org.organizationId)
    .eq("grant_status", "active")
    .maybeSingle();

  if (existingActive) {
    return {
      error: "Organization already has an active complimentary grant. Extend or revoke it first.",
      status: 409
    };
  }

  const startDate = input.startDate ?? new Date().toISOString();
  const nowIso = new Date().toISOString();
  const { data, error } = await client
    .from("master_admin_access_grants")
    .insert({
      organization_id: org.organizationId,
      granted_by_user_id: input.operatorUserId,
      plan_granted: input.planGranted,
      grant_status: "active",
      start_date: startDate,
      expiration_date: input.expirationDate,
      reason,
      notes: input.notes?.trim() ? input.notes.trim() : null,
      created_at: nowIso,
      updated_at: nowIso
    })
    .select("*")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to create grant.", status: 400 };
  }

  await confirmProductSetup(org.organizationId);

  const grant = mapGrant(data as Record<string, unknown>);
  await writeSupportAudit({
    operatorUserId: input.operatorUserId,
    organizationId: org.organizationId,
    action: MASTER_ADMIN_GRANT_AUDIT_EVENTS.CREATED,
    entityType: "master_admin_access_grant",
    entityId: grant.id,
    payload: {
      plan: grant.plan_granted,
      reason: grant.reason,
      expiration_date: grant.expiration_date,
      tester_email: input.email.trim().toLowerCase()
    }
  });

  grant.tester_email = input.email.trim().toLowerCase();
  return { grant };
}

export async function extendComplimentaryGrant(input: {
  operatorUserId: string;
  grantId: string;
  expirationDate: string | null;
  allowNoExpiration: boolean;
}): Promise<{ grant: MasterAdminAccessGrant } | { error: string; status?: number }> {
  if (input.expirationDate == null && !input.allowNoExpiration) {
    return { error: "No-expiration extensions require explicit confirmation.", status: 400 };
  }
  if (input.expirationDate) {
    const exp = Date.parse(input.expirationDate);
    if (Number.isNaN(exp) || exp <= Date.now()) {
      return { error: "expirationDate must be a future timestamp.", status: 400 };
    }
  }

  const client = await dbClient();
  const { data: existing, error: loadError } = await client
    .from("master_admin_access_grants")
    .select("*")
    .eq("id", input.grantId)
    .maybeSingle();

  if (loadError) return { error: loadError.message, status: 400 };
  if (!existing) return { error: "Grant not found.", status: 404 };

  const current = mapGrant(existing as Record<string, unknown>);
  if (current.grant_status !== "active") {
    return { error: "Only active grants can be extended.", status: 400 };
  }

  const previousExpiration = current.expiration_date;
  const nowIso = new Date().toISOString();
  const { data, error } = await client
    .from("master_admin_access_grants")
    .update({
      expiration_date: input.expirationDate,
      updated_at: nowIso,
      grant_status: "active"
    })
    .eq("id", input.grantId)
    .select("*")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to extend grant.", status: 400 };
  }

  const grant = mapGrant(data as Record<string, unknown>);
  await writeSupportAudit({
    operatorUserId: input.operatorUserId,
    organizationId: grant.organization_id,
    action: MASTER_ADMIN_GRANT_AUDIT_EVENTS.EXTENDED,
    entityType: "master_admin_access_grant",
    entityId: grant.id,
    payload: {
      plan: grant.plan_granted,
      previous_expiration_date: previousExpiration,
      expiration_date: grant.expiration_date
    }
  });

  return { grant };
}

export async function revokeComplimentaryGrant(input: {
  operatorUserId: string;
  grantId: string;
}): Promise<{ grant: MasterAdminAccessGrant } | { error: string; status?: number }> {
  const client = await dbClient();
  const { data: existing, error: loadError } = await client
    .from("master_admin_access_grants")
    .select("*")
    .eq("id", input.grantId)
    .maybeSingle();

  if (loadError) return { error: loadError.message, status: 400 };
  if (!existing) return { error: "Grant not found.", status: 404 };

  const current = mapGrant(existing as Record<string, unknown>);
  if (current.grant_status !== "active") {
    return { error: "Only active grants can be revoked.", status: 400 };
  }

  const nowIso = new Date().toISOString();
  const { data, error } = await client
    .from("master_admin_access_grants")
    .update({
      grant_status: "revoked",
      revoked_at: nowIso,
      revoked_by_user_id: input.operatorUserId,
      updated_at: nowIso
    })
    .eq("id", input.grantId)
    .select("*")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to revoke grant.", status: 400 };
  }

  const grant = mapGrant(data as Record<string, unknown>);
  await writeSupportAudit({
    operatorUserId: input.operatorUserId,
    organizationId: grant.organization_id,
    action: MASTER_ADMIN_GRANT_AUDIT_EVENTS.REVOKED,
    entityType: "master_admin_access_grant",
    entityId: grant.id,
    payload: { plan: grant.plan_granted }
  });

  return { grant };
}
