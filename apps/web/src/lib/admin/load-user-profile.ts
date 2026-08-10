import { createAuthServerClient } from "../auth/server";
import { serverEnv } from "../env/server-env";

type AnyClient = { from: (table: string) => any; auth?: any };

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

export type UserProfileSnapshot = {
  userId: string;
  email: string | null;
  displayName: string | null;
  phone: string | null;
  authLastSignInAt: string | null;
  authEmailConfirmedAt: string | null;
  memberships: Array<{
    id: string;
    organizationId: string;
    organizationName: string;
    roles: string[];
    status: string;
    updatedAt: string;
  }>;
  invitations: Array<{
    id: string;
    email: string;
    organizationId: string;
    organizationName: string;
    status: string;
    createdAt: string;
  }>;
  documents: Array<{ id: string; title: string; status: string; createdAt: string }>;
  applications: Array<{ id: string; status: string; organizationId: string; createdAt: string }>;
  residentRecords: Array<{
    id: string;
    displayName: string;
    status: string;
    organizationId: string;
  }>;
  recentAudit: Array<{ id: string; action: string; at: string; organizationId: string | null }>;
};

export async function loadUserProfile(userId: string): Promise<UserProfileSnapshot | null> {
  const service = await tryServiceRole();
  const client = (service ?? ((await createAuthServerClient()) as unknown as AnyClient)) as AnyClient;

  const [profileRes, membersRes, residentsRes, auditRes] = await Promise.all([
    client
      .from("user_profiles")
      .select("user_id, display_name, contact_email, phone")
      .eq("user_id", userId)
      .maybeSingle(),
    client
      .from("organization_memberships")
      .select("id, organization_id, roles, status, updated_at, organizations(name)")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    client
      .from("pm_residents")
      .select("id, display_name, status, organization_id, email")
      .eq("user_id", userId)
      .limit(20),
    client
      .from("platform_support_audit_events")
      .select("id, action, created_at, organization_id")
      .contains("payload", { targetUserId: userId })
      .order("created_at", { ascending: false })
      .limit(20)
  ]);

  const memberships = (membersRes?.data ?? []) as Array<{
    id: string;
    organization_id: string;
    roles: string[] | null;
    status: string;
    updated_at: string;
    organizations: { name?: string } | Array<{ name?: string }> | null;
  }>;
  const residents = (residentsRes?.data ?? []) as Array<{
    id: string;
    display_name: string;
    status: string;
    organization_id: string;
    email?: string | null;
  }>;
  const profile = (profileRes?.data ?? null) as {
    contact_email?: string | null;
    display_name?: string | null;
    phone?: string | null;
  } | null;

  const email = profile?.contact_email ?? residents[0]?.email ?? null;

  let invitations: UserProfileSnapshot["invitations"] = [];
  if (email) {
    const invitesRes = await client
      .from("organization_invitations")
      .select("id, email, organization_id, status, created_at, organizations(name)")
      .or(`email.eq.${email},accepted_by.eq.${userId},provisioned_user_id.eq.${userId}`)
      .limit(20);
    invitations = ((invitesRes?.data ?? []) as Array<{
      id: string;
      email: string;
      organization_id: string;
      status: string;
      created_at: string;
      organizations: { name?: string } | Array<{ name?: string }> | null;
    }>).map((i) => {
      const org = Array.isArray(i.organizations) ? i.organizations[0] : i.organizations;
      return {
        id: i.id,
        email: i.email,
        organizationId: i.organization_id,
        organizationName: org?.name ?? "Organization",
        status: i.status,
        createdAt: i.created_at
      };
    });
  }

  const orgIds = memberships.map((m) => m.organization_id);
  let documents: UserProfileSnapshot["documents"] = [];
  let applications: UserProfileSnapshot["applications"] = [];
  if (orgIds.length) {
    const [docsRes, appsRes] = await Promise.all([
      client
        .from("document_documents")
        .select("id, title, status, created_at")
        .in("organization_id", orgIds)
        .order("created_at", { ascending: false })
        .limit(10),
      client
        .from("lease_applications")
        .select("id, status, organization_id, created_at")
        .in("organization_id", orgIds)
        .order("created_at", { ascending: false })
        .limit(10)
    ]);
    documents = ((docsRes?.data ?? []) as Array<{
      id: string;
      title: string | null;
      status: string | null;
      created_at: string;
    }>).map((d) => ({
      id: d.id,
      title: d.title ?? "Document",
      status: d.status ?? "unknown",
      createdAt: d.created_at
    }));
    applications = ((appsRes?.data ?? []) as Array<{
      id: string;
      status: string;
      organization_id: string;
      created_at: string;
    }>).map((a) => ({
      id: a.id,
      status: a.status,
      organizationId: a.organization_id,
      createdAt: a.created_at
    }));
  }

  let authLastSignInAt: string | null = null;
  let authEmailConfirmedAt: string | null = null;
  try {
    if (service?.auth?.admin?.getUserById) {
      const { data } = await service.auth.admin.getUserById(userId);
      authLastSignInAt = data.user?.last_sign_in_at ?? null;
      authEmailConfirmedAt = data.user?.email_confirmed_at ?? null;
    }
  } catch {
    // best-effort
  }

  return {
    userId,
    email,
    displayName: profile?.display_name ?? null,
    phone: profile?.phone ?? null,
    authLastSignInAt,
    authEmailConfirmedAt,
    memberships: memberships.map((m) => {
      const org = Array.isArray(m.organizations) ? m.organizations[0] : m.organizations;
      return {
        id: m.id,
        organizationId: m.organization_id,
        organizationName: org?.name ?? "Organization",
        roles: m.roles ?? [],
        status: m.status,
        updatedAt: m.updated_at
      };
    }),
    invitations,
    documents,
    applications,
    residentRecords: residents.map((r) => ({
      id: r.id,
      displayName: r.display_name,
      status: r.status,
      organizationId: r.organization_id
    })),
    recentAudit: ((auditRes?.data ?? []) as Array<{
      id: string;
      action: string;
      created_at: string;
      organization_id: string | null;
    }>).map((a) => ({
      id: a.id,
      action: a.action,
      at: a.created_at,
      organizationId: a.organization_id
    }))
  };
}
