import {
  MASTER_ADMIN_GRANT_AUDIT_EVENTS,
  isComplimentaryGrantPastExpiration,
  isEntitlementActiveComplimentaryGrant,
  isProductSku,
  type MasterAdminGrantStatus,
  type ProductSku
} from "@mpa/shared";
import { createAuthServerClient } from "../auth/server";
import { createOrganizationSlugFromName } from "../organization/contracts";
import { serverEnv } from "../env/server-env";
import { createAndSendInvitation, buildAcceptUrl } from "../team/invitation-service";
import { writeSupportAudit } from "./impersonation-service";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- additive ops table
type LooseClient = { from: (table: string) => any; auth: { admin: any } };

export type MasterAdminAccessGrant = {
  id: string;
  organization_id: string;
  invited_email: string;
  granted_by_user_id: string;
  invitation_id: string | null;
  plan_granted: ProductSku;
  status: MasterAdminGrantStatus;
  start_date: string;
  expiration_date: string | null;
  reason: string;
  notes: string | null;
  activated_at: string | null;
  created_at: string;
  updated_at: string;
  revoked_at: string | null;
  revoked_by_user_id: string | null;
  organization_name?: string | null;
  organization_slug?: string | null;
  accept_url?: string | null;
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
    invited_email: String(row["invited_email"]),
    granted_by_user_id: String(row["granted_by_user_id"]),
    invitation_id: (row["invitation_id"] as string | null) ?? null,
    plan_granted: row["plan_granted"] as ProductSku,
    status: row["status"] as MasterAdminGrantStatus,
    start_date: String(row["start_date"]),
    expiration_date: (row["expiration_date"] as string | null) ?? null,
    reason: String(row["reason"]),
    notes: (row["notes"] as string | null) ?? null,
    activated_at: (row["activated_at"] as string | null) ?? null,
    created_at: String(row["created_at"]),
    updated_at: String(row["updated_at"]),
    revoked_at: (row["revoked_at"] as string | null) ?? null,
    revoked_by_user_id: (row["revoked_by_user_id"] as string | null) ?? null
  };
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
    .update({ status: "EXPIRED", updated_at: nowIso })
    .eq("id", input.grantId)
    .in("status", ["INVITED", "ACTIVE"]);

  await writeSupportAudit({
    operatorUserId: input.actorUserId,
    organizationId: input.organizationId,
    action: MASTER_ADMIN_GRANT_AUDIT_EVENTS.EXPIRED,
    entityType: "master_admin_access_grant",
    entityId: input.grantId,
    payload: { plan: input.planGranted, automatic: true }
  }).catch(() => undefined);
}

/** Returns grant only when lifecycle is ACTIVE and in window (for entitlement). */
export async function loadEntitlementActiveGrantForOrganization(
  organizationId: string,
  now: Date = new Date()
): Promise<MasterAdminAccessGrant | null> {
  const client = await dbClient();
  const { data, error } = await client
    .from("master_admin_access_grants")
    .select("*")
    .eq("organization_id", organizationId)
    .in("status", ["INVITED", "ACTIVE"])
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

  if (!isEntitlementActiveComplimentaryGrant(grant, now)) return null;
  return grant;
}

/** Open grant for org (INVITED or ACTIVE), for activation / admin views. */
export async function loadOpenGrantForOrganization(
  organizationId: string
): Promise<MasterAdminAccessGrant | null> {
  const client = await dbClient();
  const { data, error } = await client
    .from("master_admin_access_grants")
    .select("*")
    .eq("organization_id", organizationId)
    .in("status", ["INVITED", "ACTIVE"])
    .maybeSingle();
  if (error || !data) return null;
  return mapGrant(data as Record<string, unknown>);
}

export async function listComplimentaryGrants(filter?: {
  status?: MasterAdminGrantStatus | "all";
}): Promise<MasterAdminAccessGrant[]> {
  const client = await dbClient();
  const status = filter?.status ?? "all";
  let query = client
    .from("master_admin_access_grants")
    .select("*, organizations(name, slug)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const now = new Date();
  const mapped: MasterAdminAccessGrant[] = [];
  for (const row of (data ?? []) as Array<Record<string, unknown>>) {
    const grant = mapGrant(row);
    const org = row["organizations"] as { name?: string; slug?: string } | null;
    grant.organization_name = org?.name ?? null;
    grant.organization_slug = org?.slug ?? null;
    if (isComplimentaryGrantPastExpiration(grant, now)) {
      await markGrantExpired({
        grantId: grant.id,
        organizationId: grant.organization_id,
        planGranted: grant.plan_granted,
        actorUserId: grant.granted_by_user_id
      });
      grant.status = "EXPIRED";
      grant.updated_at = now.toISOString();
    }
    mapped.push(grant);
  }
  return mapped;
}

async function createTesterOrganization(input: {
  operatorUserId: string;
  email: string;
}): Promise<{ organizationId: string; organizationName: string } | { error: string }> {
  const client = await dbClient();
  const local = input.email.split("@")[0] || "tester";
  const name = `${local} (beta)`;
  const slug = `${createOrganizationSlugFromName(name)}-${Date.now().toString(36)}`;
  const { data, error } = await client
    .from("organizations")
    .insert({
      name,
      slug,
      created_by: input.operatorUserId
    })
    .select("id, name")
    .single();
  if (error || !data) {
    return { error: error?.message ?? "Failed to create tester organization." };
  }
  return { organizationId: data.id as string, organizationName: data.name as string };
}

/**
 * Preselect granted plan for Guided Setup without completing setup.
 * Does NOT set completed_at — tester must finish Guided Setup.
 */
async function prepareGuidedSetupProduct(organizationId: string, plan: ProductSku): Promise<void> {
  const client = await dbClient();
  await client.from("organization_setup_state").upsert(
    {
      organization_id: organizationId,
      product_confirmed: true,
      completed_at: null,
      checklist: {
        product_selected: true
      }
    },
    { onConflict: "organization_id" }
  );
  void plan;
}

export async function createComplimentaryTesterInvitation(input: {
  operatorUserId: string;
  email: string;
  planGranted: ProductSku;
  reason: string;
  notes?: string | null;
  expirationDate: string | null;
  allowNoExpiration: boolean;
  organizationId?: string | null;
}): Promise<
  | { grant: MasterAdminAccessGrant; acceptUrl: string | null }
  | { error: string; status?: number }
> {
  if (!isProductSku(input.planGranted)) {
    return { error: "Invalid plan.", status: 400 };
  }
  const reason = input.reason.trim();
  if (!reason) return { error: "Reason is required.", status: 400 };

  const invitedEmail = input.email.trim().toLowerCase();
  if (!invitedEmail || !invitedEmail.includes("@")) {
    return { error: "Valid tester email is required.", status: 400 };
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

  const client = await dbClient();
  let organizationId = input.organizationId ?? null;
  let organizationName = "M.P.A. workspace";

  if (organizationId) {
    const { data: org } = await client
      .from("organizations")
      .select("id, name")
      .eq("id", organizationId)
      .maybeSingle();
    if (!org) return { error: "Organization not found.", status: 404 };
    organizationName = (org.name as string) ?? organizationName;
  } else {
    const created = await createTesterOrganization({
      operatorUserId: input.operatorUserId,
      email: invitedEmail
    });
    if ("error" in created) return { error: created.error, status: 400 };
    organizationId = created.organizationId;
    organizationName = created.organizationName;
  }

  const { data: existingOpen } = await client
    .from("master_admin_access_grants")
    .select("id")
    .eq("organization_id", organizationId)
    .in("status", ["INVITED", "ACTIVE"])
    .maybeSingle();
  if (existingOpen) {
    return {
      error: "Organization already has an open complimentary grant. Extend or revoke it first.",
      status: 409
    };
  }

  // Customer-style invitation — do not silently create auth users.
  let invitationId: string | null = null;
  let acceptUrl: string | null = null;
  try {
    const invited = await createAndSendInvitation({
      supabase: client as never,
      organizationId,
      actorId: input.operatorUserId,
      email: invitedEmail,
      roles: ["organization_admin", "property_manager"],
      organizationName,
      inviterLabel: "M.P.A. Beta Program"
    });
    invitationId = invited.invitation.id as string;
    acceptUrl = invited.acceptUrl;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create invitation.",
      status: 400
    };
  }

  // Preselect plan for Guided Setup; never mark setup complete here.
  await prepareGuidedSetupProduct(organizationId, input.planGranted);

  const nowIso = new Date().toISOString();
  const { data, error } = await client
    .from("master_admin_access_grants")
    .insert({
      organization_id: organizationId,
      invited_email: invitedEmail,
      granted_by_user_id: input.operatorUserId,
      invitation_id: invitationId,
      plan_granted: input.planGranted,
      status: "INVITED",
      start_date: nowIso,
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

  const grant = mapGrant(data as Record<string, unknown>);
  grant.accept_url = acceptUrl;
  await writeSupportAudit({
    operatorUserId: input.operatorUserId,
    organizationId,
    action: MASTER_ADMIN_GRANT_AUDIT_EVENTS.CREATED,
    entityType: "master_admin_access_grant",
    entityId: grant.id,
    payload: {
      plan: grant.plan_granted,
      reason: grant.reason,
      expiration_date: grant.expiration_date,
      invited_email: invitedEmail,
      invitation_id: invitationId,
      status: "INVITED"
    }
  });

  return { grant, acceptUrl };
}

export async function activateComplimentaryGrantForOrganization(input: {
  organizationId: string;
  actorUserId?: string | null;
}): Promise<{ grant: MasterAdminAccessGrant } | { error: string }> {
  const open = await loadOpenGrantForOrganization(input.organizationId);
  if (!open) return { error: "No open complimentary grant." };
  if (open.status === "ACTIVE") return { grant: open };
  if (open.status !== "INVITED") return { error: "Grant cannot be activated." };

  if (isComplimentaryGrantPastExpiration(open)) {
    await markGrantExpired({
      grantId: open.id,
      organizationId: open.organization_id,
      planGranted: open.plan_granted,
      actorUserId: open.granted_by_user_id
    });
    return { error: "Grant expired before activation." };
  }

  const client = await dbClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await client
    .from("master_admin_access_grants")
    .update({
      status: "ACTIVE",
      activated_at: nowIso,
      updated_at: nowIso
    })
    .eq("id", open.id)
    .eq("status", "INVITED")
    .select("*")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to activate grant." };
  }

  const grant = mapGrant(data as Record<string, unknown>);
  await writeSupportAudit({
    operatorUserId: input.actorUserId ?? grant.granted_by_user_id,
    organizationId: grant.organization_id,
    action: MASTER_ADMIN_GRANT_AUDIT_EVENTS.ACTIVATED,
    entityType: "master_admin_access_grant",
    entityId: grant.id,
    payload: { plan: grant.plan_granted, invited_email: grant.invited_email }
  });

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
  if (current.status !== "ACTIVE" && current.status !== "INVITED") {
    return { error: "Only INVITED or ACTIVE grants can be extended.", status: 400 };
  }

  const previousExpiration = current.expiration_date;
  const nowIso = new Date().toISOString();
  const { data, error } = await client
    .from("master_admin_access_grants")
    .update({ expiration_date: input.expirationDate, updated_at: nowIso })
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
  if (current.status !== "ACTIVE" && current.status !== "INVITED") {
    return { error: "Only INVITED or ACTIVE grants can be revoked.", status: 400 };
  }

  const nowIso = new Date().toISOString();
  const { data, error } = await client
    .from("master_admin_access_grants")
    .update({
      status: "REVOKED",
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
    payload: { plan: grant.plan_granted, invited_email: grant.invited_email }
  });
  return { grant };
}

export async function resendComplimentaryInvitation(input: {
  operatorUserId: string;
  grantId: string;
}): Promise<{ acceptUrl: string | null } | { error: string; status?: number }> {
  const client = await dbClient();
  const { data: existing } = await client
    .from("master_admin_access_grants")
    .select("*")
    .eq("id", input.grantId)
    .maybeSingle();
  if (!existing) return { error: "Grant not found.", status: 404 };
  const grant = mapGrant(existing as Record<string, unknown>);
  if (grant.status !== "INVITED") {
    return { error: "Only INVITED grants can resend invitations.", status: 400 };
  }

  const { data: org } = await client
    .from("organizations")
    .select("name")
    .eq("id", grant.organization_id)
    .maybeSingle();

  try {
    const invited = await createAndSendInvitation({
      supabase: client as never,
      organizationId: grant.organization_id,
      actorId: input.operatorUserId,
      email: grant.invited_email,
      roles: ["organization_admin", "property_manager"],
      organizationName: (org?.name as string) ?? "M.P.A. workspace",
      inviterLabel: "M.P.A. Beta Program"
    });
    await client
      .from("master_admin_access_grants")
      .update({
        invitation_id: invited.invitation.id,
        updated_at: new Date().toISOString()
      })
      .eq("id", grant.id);

    await writeSupportAudit({
      operatorUserId: input.operatorUserId,
      organizationId: grant.organization_id,
      action: "MASTER_ADMIN_GRANT_INVITATION_RESENT",
      entityType: "master_admin_access_grant",
      entityId: grant.id,
      payload: { invitation_id: invited.invitation.id, invited_email: grant.invited_email }
    });

    return { acceptUrl: invited.acceptUrl ?? buildAcceptUrl(String(invited.invitation.token)) };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to resend invitation.",
      status: 400
    };
  }
}
