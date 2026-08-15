import type { SupabaseClient } from "@supabase/supabase-js";
import {
  membershipHasPortalRole,
  mergeRolesWithPortalRole,
  resolvePostAuthHome,
  type PortalAccessRole
} from "@mpa/shared";
import { serverEnv } from "../env/server-env";
import { createServiceRoleClient } from "../supabase/service-role";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export type PortalAccessHandoff = {
  status: "ready" | "failed";
  role: PortalAccessRole;
  email: string;
  homeHref: string;
  loginHref: string;
  firstLoginMessage: string;
  magicLink: string | null;
  createdAuthUser: boolean;
  recoveryMessage?: string;
};

export type PortalAccessProvisionResult = {
  userId: string;
  role: PortalAccessRole;
  membershipRoles: string[];
  createdAuthUser: boolean;
  linkedEntity: boolean;
  alreadyProvisioned: boolean;
  homeHref: string;
  handoff: PortalAccessHandoff;
};

function appUrl() {
  return (serverEnv.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function adminClient(): Db {
  if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Portal access could not be provisioned: SUPABASE_SERVICE_ROLE_KEY is not configured. Add the service role key, then re-run lease activation or vendor assignment. Do not send the resident/vendor to /unauthorized without a login link."
    );
  }
  return createServiceRoleClient();
}

async function buildMagicLink(admin: Db, email: string, homeHref: string): Promise<string | null> {
  try {
    const link = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `${appUrl()}${homeHref}`
      }
    });
    return link.data.properties?.action_link ?? null;
  } catch {
    return null;
  }
}

function buildHandoff(args: {
  role: PortalAccessRole;
  email: string;
  homeHref: string;
  createdAuthUser: boolean;
  magicLink: string | null;
}): PortalAccessHandoff {
  const loginHref = `/login?next=${encodeURIComponent(args.homeHref)}`;
  const roleLabel = args.role === "tenant" ? "Resident Portal" : "Vendor Portal";
  const firstLoginMessage = args.createdAuthUser
    ? `${roleLabel} access is ready for ${args.email}. Share the magic link (or ask them to sign in at ${loginHref} after setting a password from the invite email).`
    : `${roleLabel} access is ready for ${args.email}. They can sign in at ${loginHref}.`;

  return {
    status: "ready",
    role: args.role,
    email: args.email,
    homeHref: args.homeHref,
    loginHref,
    firstLoginMessage,
    magicLink: args.magicLink,
    createdAuthUser: args.createdAuthUser
  };
}

async function findAuthUserIdByEmail(admin: Db, email: string): Promise<string | null> {
  const normalized = email.trim().toLowerCase();

  const { data: profile } = await admin
    .from("user_profiles")
    .select("user_id")
    .ilike("contact_email", normalized)
    .limit(1)
    .maybeSingle();
  if (profile?.user_id) {
    return profile.user_id as string;
  }

  const url = new URL(`${serverEnv.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/auth/v1/admin/users`);
  url.searchParams.set("page", "1");
  url.searchParams.set("per_page", "200");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${serverEnv.SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: serverEnv.SUPABASE_SERVICE_ROLE_KEY ?? "",
      "Content-Type": "application/json"
    }
  });
  if (response.ok) {
    const body = (await response.json()) as { users?: Array<{ id: string; email?: string | null }> };
    const match = (body.users ?? []).find(
      (user) => (user.email ?? "").trim().toLowerCase() === normalized
    );
    if (match?.id) {
      return match.id;
    }
  }

  // Paginate a few pages via SDK as a fallback for larger auth directories.
  for (let page = 1; page <= 5; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      break;
    }
    const match = data.users.find((user) => (user.email ?? "").trim().toLowerCase() === normalized);
    if (match?.id) {
      return match.id;
    }
    if (data.users.length < 200) {
      break;
    }
  }

  return null;
}

async function resolveOrCreateAuthUser(
  admin: Db,
  email: string
): Promise<{ userId: string; createdAuthUser: boolean }> {
  const normalized = email.trim().toLowerCase();
  const existing = await findAuthUserIdByEmail(admin, normalized);
  if (existing) {
    return { userId: existing, createdAuthUser: false };
  }

  const redirectTo = `${appUrl()}/login`;
  const invite = await admin.auth.admin.inviteUserByEmail(normalized, { redirectTo });
  if (invite.data.user?.id) {
    return { userId: invite.data.user.id, createdAuthUser: true };
  }

  if (invite.error && /already|registered|exists/i.test(invite.error.message)) {
    const again = await findAuthUserIdByEmail(admin, normalized);
    if (again) {
      return { userId: again, createdAuthUser: false };
    }
  }

  const created = await admin.auth.admin.createUser({
    email: normalized,
    email_confirm: true,
    user_metadata: { portal_provisioned: true }
  });
  if (created.data.user?.id) {
    return { userId: created.data.user.id, createdAuthUser: true };
  }

  throw new Error(
    invite.error?.message ??
      created.error?.message ??
      `Could not resolve or create auth user for ${normalized}`
  );
}

async function ensureUserProfileEmail(admin: Db, userId: string, email: string) {
  const normalized = email.trim().toLowerCase();
  const { data: existing } = await admin
    .from("user_profiles")
    .select("user_id, contact_email")
    .eq("user_id", userId)
    .maybeSingle();

  if (!existing) {
    await admin.from("user_profiles").upsert({
      user_id: userId,
      contact_email: normalized,
      display_name: normalized.split("@")[0] ?? normalized
    });
    return;
  }

  if (!existing.contact_email) {
    await admin
      .from("user_profiles")
      .update({ contact_email: normalized })
      .eq("user_id", userId);
  }
}

async function ensureMembership(args: {
  admin: Db;
  organizationId: string;
  userId: string;
  role: PortalAccessRole;
  invitedBy: string | null;
}): Promise<{ roles: string[]; alreadyHadRole: boolean }> {
  const { data: existing } = await args.admin
    .from("organization_memberships")
    .select("id, roles, status")
    .eq("organization_id", args.organizationId)
    .eq("user_id", args.userId)
    .maybeSingle();

  const currentRoles = (existing?.roles as unknown[] | undefined) ?? [];
  const alreadyHadRole = membershipHasPortalRole(currentRoles, args.role);
  const roles = mergeRolesWithPortalRole(currentRoles, args.role);

  const membershipRow: {
    organization_id: string;
    user_id: string;
    roles: string[];
    status: string;
    invited_by?: string | null;
  } = {
    organization_id: args.organizationId,
    user_id: args.userId,
    roles,
    status: "active"
  };
  if (!existing) {
    membershipRow.invited_by = args.invitedBy;
  }

  const { error } = await args.admin
    .from("organization_memberships")
    .upsert(membershipRow, { onConflict: "organization_id,user_id" });
  if (error) {
    throw new Error(error.message);
  }

  return { roles, alreadyHadRole };
}

async function emitPortalAccessEvidence(args: {
  supabase: Db;
  organizationId: string;
  actorId: string | null;
  role: PortalAccessRole;
  userId: string;
  email: string;
  entityType: "pm_residents" | "vendor_vendors";
  entityId: string;
  createdAuthUser: boolean;
  alreadyHadRole: boolean;
}) {
  const eventType =
    args.role === "tenant" ? "resident.portal_access_provisioned" : "vendor.portal_access_provisioned";
  const payload = {
    role: args.role,
    userId: args.userId,
    email: args.email,
    homeHref: resolvePostAuthHome({
      roles: [args.role],
      productSku: null,
      setupComplete: false
    }),
    createdAuthUser: args.createdAuthUser,
    alreadyHadRole: args.alreadyHadRole,
    source: args.role === "tenant" ? "lease.activation" : "vendor.assignment"
  };

  const { error: eventError } = await args.supabase.from("event_domain_events").insert({
    event_type: eventType,
    aggregate_type: args.entityType,
    aggregate_id: args.entityId,
    organization_id: args.organizationId,
    actor_id: args.actorId,
    payload
  });
  if (eventError) {
    throw new Error(eventError.message);
  }

  const { error: auditError } = await args.supabase.from("audit_events").insert({
    organization_id: args.organizationId,
    actor_id: args.actorId,
    action: eventType,
    entity_type: args.entityType,
    entity_id: args.entityId,
    payload
  });
  if (auditError) {
    throw new Error(auditError.message);
  }
}

async function provisionPortalAccess(args: {
  organizationId: string;
  actorId: string | null;
  email: string;
  role: PortalAccessRole;
  entityType: "pm_residents" | "vendor_vendors";
  entityId: string;
  existingUserId?: string | null;
}): Promise<PortalAccessProvisionResult> {
  const email = args.email.trim().toLowerCase();
  if (!email.includes("@")) {
    throw new Error(`Valid email is required to provision ${args.role} portal access.`);
  }

  const admin = adminClient();
  let userId = args.existingUserId ?? null;
  let createdAuthUser = false;

  if (!userId) {
    const resolved = await resolveOrCreateAuthUser(admin, email);
    userId = resolved.userId;
    createdAuthUser = resolved.createdAuthUser;
  }

  await ensureUserProfileEmail(admin, userId, email);
  const membership = await ensureMembership({
    admin,
    organizationId: args.organizationId,
    userId,
    role: args.role,
    invitedBy: args.actorId
  });

  let linkedEntity = false;
  if (args.entityType === "pm_residents") {
    const { error } = await admin
      .from("pm_residents")
      .update({ user_id: userId, updated_at: new Date().toISOString() })
      .eq("id", args.entityId)
      .eq("organization_id", args.organizationId);
    if (error) {
      throw new Error(error.message);
    }
    linkedEntity = true;

    await admin
      .from("lease_residents")
      .update({ user_id: userId })
      .eq("organization_id", args.organizationId)
      .eq("email", email)
      .is("user_id", null);
  } else {
    const { error } = await admin
      .from("vendor_vendors")
      .update({ user_id: userId })
      .eq("id", args.entityId)
      .eq("organization_id", args.organizationId);
    if (error) {
      throw new Error(error.message);
    }
    linkedEntity = true;
  }

  const alreadyProvisioned = Boolean(args.existingUserId) && membership.alreadyHadRole;
  if (!alreadyProvisioned) {
    // Service-role writer so webhook activations and manager sessions both persist evidence.
    await emitPortalAccessEvidence({
      supabase: admin,
      organizationId: args.organizationId,
      actorId: args.actorId,
      role: args.role,
      userId,
      email,
      entityType: args.entityType,
      entityId: args.entityId,
      createdAuthUser,
      alreadyHadRole: membership.alreadyHadRole
    });
  }

  const homeHref = resolvePostAuthHome({
    roles: [args.role],
    productSku: null,
    setupComplete: false
  });
  const magicLink = await buildMagicLink(admin, email, homeHref);

  return {
    userId,
    role: args.role,
    membershipRoles: membership.roles,
    createdAuthUser,
    linkedEntity,
    alreadyProvisioned,
    homeHref,
    handoff: buildHandoff({
      role: args.role,
      email,
      homeHref,
      createdAuthUser,
      magicLink
    })
  };
}

/** Canonical resident portal provisioning — called from lease activation only. */
export async function provisionResidentPortalAccess(args: {
  supabase: Db;
  organizationId: string;
  actorId: string | null;
  residentId: string;
  email: string;
  existingUserId?: string | null;
}) {
  void args.supabase;
  return provisionPortalAccess({
    organizationId: args.organizationId,
    actorId: args.actorId,
    email: args.email,
    role: "tenant",
    entityType: "pm_residents",
    entityId: args.residentId,
    ...(args.existingUserId !== undefined ? { existingUserId: args.existingUserId } : {})
  });
}

/** Canonical vendor portal provisioning — called from vendor assignment only. */
export async function provisionVendorPortalAccess(args: {
  supabase: Db;
  organizationId: string;
  actorId: string | null;
  vendorId: string;
  email: string;
  existingUserId?: string | null;
}) {
  void args.supabase;
  return provisionPortalAccess({
    organizationId: args.organizationId,
    actorId: args.actorId,
    email: args.email,
    role: "vendor",
    entityType: "vendor_vendors",
    entityId: args.vendorId,
    ...(args.existingUserId !== undefined ? { existingUserId: args.existingUserId } : {})
  });
}
