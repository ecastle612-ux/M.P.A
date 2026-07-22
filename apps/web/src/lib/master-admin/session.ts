import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";
import type { UserRole } from "@mpa/shared";
import { createAuthServerClient, createAuthServerComponentClient } from "../auth/server";
import { userHasMasterAdminCapability } from "./access";
import {
  MASTER_ADMIN_SESSION_COOKIE,
  PORTAL_ROLE_LABELS,
  portalToUserRole,
  type MasterAdminEffectiveSession,
  type MasterAdminPortal,
  type MasterAdminSessionMode
} from "./contracts";

// ADMIN-001 audit tables pending `supabase gen types` — use untyped accessor.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedDb = { from: (table: string) => any };

function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds
  };
}

function mapSessionRow(row: {
  id: string;
  mode: string;
  organization_id: string;
  portal: string | null;
  target_user_id: string | null;
  target_display_name: string | null;
  target_role_label: string | null;
  started_at: string;
}): MasterAdminEffectiveSession {
  return {
    id: row.id,
    mode: row.mode as MasterAdminSessionMode,
    organizationId: row.organization_id,
    portal: (row.portal as MasterAdminPortal | null) ?? null,
    targetUserId: row.target_user_id,
    targetDisplayName: row.target_display_name,
    targetRoleLabel: row.target_role_label,
    startedAt: row.started_at
  };
}

export async function getActiveMasterAdminSession(
  masterAdminUserId: string
): Promise<MasterAdminEffectiveSession | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(MASTER_ADMIN_SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const supabase = (await createAuthServerClient()) as unknown as UntypedDb;
  const { data, error } = await supabase
    .from("master_admin_impersonation_sessions")
    .select(
      "id, mode, organization_id, portal, target_user_id, target_display_name, target_role_label, started_at, ended_at, master_admin_user_id"
    )
    .eq("id", sessionId)
    .eq("master_admin_user_id", masterAdminUserId)
    .is("ended_at", null)
    .maybeSingle();

  if (error || !data) return null;
  return mapSessionRow(data as Parameters<typeof mapSessionRow>[0]);
}

export async function assertMasterAdminUser(user: User, _organizationId?: string | null): Promise<boolean> {
  return userHasMasterAdminCapability(user);
}

export async function endActiveMasterAdminSessions(masterAdminUserId: string): Promise<void> {
  const supabase = (await createAuthServerClient()) as unknown as UntypedDb;
  const now = new Date().toISOString();
  await supabase
    .from("master_admin_impersonation_sessions")
    .update({ ended_at: now })
    .eq("master_admin_user_id", masterAdminUserId)
    .is("ended_at", null);

  const cookieStore = await cookies();
  cookieStore.set(MASTER_ADMIN_SESSION_COOKIE, "", cookieOptions(0));
}

export async function startPortalTestSession(input: {
  user: User;
  organizationId: string;
  portal: MasterAdminPortal;
  reason?: string | null;
}): Promise<MasterAdminEffectiveSession> {
  if (!(await assertMasterAdminUser(input.user, input.organizationId))) {
    throw new Error("Master Admin capability required.");
  }

  await endActiveMasterAdminSessions(input.user.id);
  const supabase = (await createAuthServerClient()) as unknown as UntypedDb;
  const { data, error } = await supabase
    .from("master_admin_impersonation_sessions")
    .insert({
      master_admin_user_id: input.user.id,
      organization_id: input.organizationId,
      mode: "portal_test",
      portal: input.portal,
      target_display_name: `Demo ${PORTAL_ROLE_LABELS[input.portal]}`,
      target_role_label: PORTAL_ROLE_LABELS[input.portal],
      reason: input.reason ?? "portal_test"
    })
    .select(
      "id, mode, organization_id, portal, target_user_id, target_display_name, target_role_label, started_at"
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to start portal test session.");
  }

  const cookieStore = await cookies();
  cookieStore.set(MASTER_ADMIN_SESSION_COOKIE, data.id as string, cookieOptions(60 * 60 * 8));

  await recordMasterAdminEvent({
    sessionId: data.id as string,
    organizationId: input.organizationId,
    actorUserId: input.user.id,
    eventType: "note",
    detail: { action: "start_portal_test", portal: input.portal }
  });

  return mapSessionRow(data as Parameters<typeof mapSessionRow>[0]);
}

export async function startImpersonationSession(input: {
  user: User;
  organizationId: string;
  targetUserId: string;
  targetDisplayName: string;
  targetRoleLabel: string;
  reason?: string | null;
}): Promise<MasterAdminEffectiveSession> {
  if (!(await assertMasterAdminUser(input.user, input.organizationId))) {
    throw new Error("Master Admin capability required.");
  }
  if (input.targetUserId === input.user.id) {
    throw new Error("Cannot impersonate your own Master Admin account.");
  }

  const supabaseAuth = await createAuthServerClient();
  const { data: membership, error: membershipError } = await supabaseAuth
    .from("organization_memberships")
    .select("user_id, roles, status")
    .eq("organization_id", input.organizationId)
    .eq("user_id", input.targetUserId)
    .eq("status", "active")
    .maybeSingle();

  if (membershipError) throw new Error(membershipError.message);
  if (!membership) throw new Error("Target user is not an active member of this organization.");

  await endActiveMasterAdminSessions(input.user.id);

  const supabase = supabaseAuth as unknown as UntypedDb;
  const { data, error } = await supabase
    .from("master_admin_impersonation_sessions")
    .insert({
      master_admin_user_id: input.user.id,
      organization_id: input.organizationId,
      mode: "impersonate",
      target_user_id: input.targetUserId,
      target_display_name: input.targetDisplayName,
      target_role_label: input.targetRoleLabel,
      reason: input.reason ?? "impersonate"
    })
    .select(
      "id, mode, organization_id, portal, target_user_id, target_display_name, target_role_label, started_at"
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to start impersonation session.");
  }

  const cookieStore = await cookies();
  cookieStore.set(MASTER_ADMIN_SESSION_COOKIE, data.id as string, cookieOptions(60 * 60 * 8));

  await recordMasterAdminEvent({
    sessionId: data.id as string,
    organizationId: input.organizationId,
    actorUserId: input.user.id,
    eventType: "note",
    detail: { action: "start_impersonation", targetUserId: input.targetUserId }
  });

  return mapSessionRow(data as Parameters<typeof mapSessionRow>[0]);
}

export async function endMasterAdminSession(user: User): Promise<void> {
  const active = await getActiveMasterAdminSession(user.id);
  if (active) {
    await recordMasterAdminEvent({
      sessionId: active.id,
      organizationId: active.organizationId,
      actorUserId: user.id,
      eventType: "note",
      detail: { action: "end_session" }
    });
  }
  await endActiveMasterAdminSessions(user.id);
}

export async function recordMasterAdminEvent(input: {
  sessionId: string;
  organizationId: string;
  actorUserId: string;
  eventType: "page_visit" | "sensitive_action" | "note";
  pathname?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  detail?: Record<string, unknown>;
}): Promise<void> {
  const supabase = (await createAuthServerClient()) as unknown as UntypedDb;
  await supabase.from("master_admin_impersonation_events").insert({
    session_id: input.sessionId,
    organization_id: input.organizationId,
    actor_user_id: input.actorUserId,
    event_type: input.eventType,
    pathname: input.pathname ?? null,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    detail: input.detail ?? {}
  });
}

export async function getMasterAdminBannerModel(user: User): Promise<{
  session: MasterAdminEffectiveSession;
  authenticatedName: string;
} | null> {
  const session = await getActiveMasterAdminSession(user.id);
  if (!session) return null;

  const supabase = await createAuthServerComponentClient();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const authenticatedName =
    (profile?.display_name as string | null | undefined)?.trim() ||
    user.email ||
    "Master Admin";

  return { session, authenticatedName };
}

/** Roles the Master Admin should experience while an effective session is active. */
export async function resolveEffectiveRolesForSession(
  session: MasterAdminEffectiveSession
): Promise<UserRole[]> {
  if (session.mode === "portal_test" && session.portal) {
    return [portalToUserRole(session.portal)];
  }

  if (session.mode === "impersonate" && session.targetUserId) {
    const supabase = await createAuthServerClient();
    const { data } = await supabase
      .from("organization_memberships")
      .select("roles")
      .eq("organization_id", session.organizationId)
      .eq("user_id", session.targetUserId)
      .eq("status", "active")
      .maybeSingle();
    const roles = (data?.roles ?? []).filter(
      (role): role is UserRole =>
        role === "property_manager" ||
        role === "property_owner" ||
        role === "tenant" ||
        role === "vendor"
    );
    return roles.length ? roles : ["tenant"];
  }

  return [];
}

export async function canAccessPortalAsMasterAdmin(
  user: User,
  organizationId: string,
  requiredRole: UserRole
): Promise<{ allowed: boolean; session: MasterAdminEffectiveSession | null }> {
  const isMaster = await assertMasterAdminUser(user, organizationId);
  if (!isMaster) return { allowed: false, session: null };

  const session = await getActiveMasterAdminSession(user.id);
  if (!session || session.organizationId !== organizationId) {
    return { allowed: false, session: null };
  }

  const roles = await resolveEffectiveRolesForSession(session);
  return { allowed: roles.includes(requiredRole), session };
}
