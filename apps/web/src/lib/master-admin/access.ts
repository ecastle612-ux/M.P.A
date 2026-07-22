import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { DEV_MASTER_ADMIN_APP_METADATA_FLAG, isUserRole, type UserRole } from "@mpa/shared";
import { createAuthServerClient, createAuthServerComponentClient } from "../auth/server";
import { resolveActiveOrganizationIdForUser } from "../organization/server";
import { apiError } from "../api/http";

function hasMasterAdminAppGrant(user: User): boolean {
  const metadata = user.app_metadata as Record<string, unknown> | undefined;
  return metadata?.[DEV_MASTER_ADMIN_APP_METADATA_FLAG] === true;
}

/**
 * True when the authenticated user is a platform Master Admin.
 *
 * Sources (any one is enough):
 * 1. Auth app_metadata flag set by bootstrap (`dev_master_admin`) — user-level grant
 * 2. organization_permission_overrides allow for any active membership role
 *
 * Must not depend solely on the shell active organization — customer orgs often
 * lack the override even when the operator is Master Admin on mpa-development.
 */
export async function userHasMasterAdminCapability(user: User): Promise<boolean> {
  if (hasMasterAdminAppGrant(user)) {
    return true;
  }

  const supabase = await createAuthServerComponentClient();
  const { data: memberships, error: membershipError } = await supabase
    .from("organization_memberships")
    .select("organization_id, roles")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  for (const membership of memberships ?? []) {
    const roles = ((membership.roles ?? []) as unknown[]).filter(isUserRole) as UserRole[];
    if (roles.length === 0) continue;

    const { data: overrides, error: overrideError } = await supabase
      .from("organization_permission_overrides")
      .select("effect")
      .eq("organization_id", membership.organization_id)
      .eq("capability_key", "master_admin")
      .in("role", roles);

    if (overrideError) {
      throw new Error(overrideError.message);
    }

    const denied = (overrides ?? []).some((row) => row.effect === "deny");
    if (denied) continue;
    if ((overrides ?? []).some((row) => row.effect === "allow")) {
      return true;
    }
  }

  return false;
}

export async function requireMasterAdminPageAccess(): Promise<{
  user: User;
  organizationId: string;
}> {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) redirect("/setup");

  if (!(await userHasMasterAdminCapability(user))) {
    redirect("/unauthorized");
  }

  return { user, organizationId };
}

export async function requireMasterAdminApiAccess(): Promise<
  | { ok: true; user: User; organizationId: string }
  | { ok: false; response: ReturnType<typeof apiError> }
> {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, response: apiError(401, "UNAUTHENTICATED", "Please sign in to continue.") };
  }

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) {
    return {
      ok: false,
      response: apiError(400, "NO_ORGANIZATION", "Select or create an organization first.")
    };
  }

  if (!(await userHasMasterAdminCapability(user))) {
    return {
      ok: false,
      response: apiError(403, "FORBIDDEN", "Master Admin capability required.")
    };
  }

  return { ok: true, user, organizationId };
}
