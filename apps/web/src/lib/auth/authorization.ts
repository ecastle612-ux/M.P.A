import {
  evaluateCapability,
  isUserRole,
  type PermissionCapability,
  type UserRole
} from "@mpa/shared";
import type { User } from "@supabase/supabase-js";
import { userHasMasterAdminCapability } from "../master-admin/access";
import { createAuthServerClient } from "./server";
import { buildAuthorizationContext } from "./session";

type PermissionEffect = "allow" | "deny";

type ResolvedAuthorizationContext = ReturnType<typeof buildAuthorizationContext> & {
  permissions: string[];
};

function toUserRoles(roles: readonly string[]): UserRole[] {
  return roles.filter((role): role is UserRole => isUserRole(role));
}

async function resolvePermissionsForRoles(organizationId: string | null, roles: readonly UserRole[]) {
  if (roles.length === 0) {
    return [];
  }

  const supabase = await createAuthServerClient();
  const { data: grants, error: grantsError } = await supabase
    .from("role_permission_grants")
    .select("capability_key")
    .in("role", [...roles] as never);

  if (grantsError) {
    throw new Error(grantsError.message);
  }

  const permissionSet = new Set((grants ?? []).map((grant) => grant.capability_key));

  if (organizationId) {
    const { data: overrides, error: overridesError } = await supabase
      .from("organization_permission_overrides")
      .select("capability_key, effect")
      .eq("organization_id", organizationId)
      .in("role", [...roles] as never);

    if (overridesError) {
      throw new Error(overridesError.message);
    }

    (overrides ?? []).forEach((override) => {
      if ((override.effect as PermissionEffect) === "allow") {
        permissionSet.add(override.capability_key);
      }
      if ((override.effect as PermissionEffect) === "deny") {
        permissionSet.delete(override.capability_key);
      }
    });
  }

  return [...permissionSet];
}

export async function resolveAuthorizationContext(
  user: User,
  organizationId: string | null
): Promise<ResolvedAuthorizationContext> {
  const supabase = await createAuthServerClient();

  let roles: UserRole[] = [];
  if (organizationId) {
    const { data: membership, error: membershipError } = await supabase
      .from("organization_memberships")
      .select("roles")
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (membershipError) {
      throw new Error(membershipError.message);
    }
    roles = toUserRoles(membership?.roles ?? []);
  }

  const baseContext = buildAuthorizationContext(user, null, {
    organizationId,
    roles
  });
  const permissions = await resolvePermissionsForRoles(organizationId, roles);

  // Master Admin is platform-scoped (app_metadata / override), not a PM role grant.
  // Include the capability so HQ workspaces (e.g. Migration) authorize correctly.
  if (!permissions.includes("master_admin") && (await userHasMasterAdminCapability(user))) {
    permissions.push("master_admin");
  }

  return {
    ...baseContext,
    permissions
  };
}

export function evaluatePermission(
  context: ResolvedAuthorizationContext,
  capability: PermissionCapability
): boolean {
  /**
   * MAC-002 Hybrid C — Platform Operator Mode (breakglass).
   * `master_admin` is app_metadata-only (never org-granted). Short-circuit applies to
   * HQ / active-org operator tools. Customer portal surfaces still require an explicit
   * View As or Test Mode session (`canAccessPortalAsMasterAdmin`).
   */
  if (context.permissions.includes("master_admin")) {
    return true;
  }
  return evaluateCapability(context.permissions, capability);
}

export function assertAuthorized(
  context: ResolvedAuthorizationContext,
  capability: PermissionCapability
): void {
  if (!evaluatePermission(context, capability)) {
    throw new Error("FORBIDDEN");
  }
}
