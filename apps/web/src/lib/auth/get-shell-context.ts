import { cookies } from "next/headers";
import { USER_ROLES, type UserRole } from "@mpa/shared";
import type { User } from "@supabase/supabase-js";
import { ACTIVE_ORGANIZATION_COOKIE } from "../organization/contracts";
import { getOrganizationsForUser } from "../organization/server";
import { userHasMasterAdminCapability } from "../master-admin/access";
import { getEntitlementSnapshot } from "./entitlements";
import { resolveAuthorizationContext } from "./authorization";
import { buildAuthorizationContext } from "./session";
import { entitledModuleKeys } from "../saas/entitlement-gate";

export type AuthenticatedShellContext = {
  user: User;
  availableRoles: UserRole[];
  defaultRole: UserRole;
  defaultOrganizationId: string | null;
  organizations: Awaited<ReturnType<typeof getOrganizationsForUser>>;
  /** DPX-002: seed sidebar permissions so SSR nav matches first client paint. */
  permissions: string[];
  /** BILL-001 Phase C — plan modules/features for nav entitlement filtering. Null = unknown (do not hide). */
  entitledModules: string[] | null;
};

export async function resolveAuthenticatedShellContext(user: User): Promise<AuthenticatedShellContext> {
  const organizations = await getOrganizationsForUser(user.id);
  const cookieStore = await cookies();
  const activeOrganizationIdFromCookie = cookieStore.get(ACTIVE_ORGANIZATION_COOKIE)?.value ?? null;
  const defaultOrganization =
    organizations.find((organization) => organization.id === activeOrganizationIdFromCookie) ??
    organizations[0] ??
    null;
  const defaultOrganizationId = defaultOrganization?.id ?? null;

  const roleContext = buildAuthorizationContext(
    user,
    null,
    defaultOrganization?.roles
      ? {
          organizationId: defaultOrganizationId,
          roles: defaultOrganization.roles
        }
      : {
          organizationId: defaultOrganizationId
        }
  );
  const authz = await resolveAuthorizationContext(user, defaultOrganizationId);
  const permissions = [...authz.permissions];
  const isMasterAdmin = await userHasMasterAdminCapability(user);
  if (!permissions.includes("master_admin") && isMasterAdmin) {
    permissions.push("master_admin");
  }

  // Never invent property_manager for empty memberships (REG-ACL-001).
  // Master Admin–only accounts have no portal/PM roles.
  const availableRoles = roleContext.roles.length ? roleContext.roles : [];
  const defaultRole =
    roleContext.activeRole ?? availableRoles[0] ?? (USER_ROLES[0] ?? "property_manager");

  let entitledModules: string[] | null = null;
  if (defaultOrganizationId) {
    try {
      const snapshot = await getEntitlementSnapshot(defaultOrganizationId);
      entitledModules = snapshot ? entitledModuleKeys(snapshot) : null;
    } catch {
      entitledModules = null;
    }
  }

  return {
    user,
    availableRoles,
    defaultRole,
    organizations,
    defaultOrganizationId,
    permissions,
    entitledModules
  };
}
