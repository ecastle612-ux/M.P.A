import { cookies } from "next/headers";
import { USER_ROLES, type UserRole } from "@mpa/shared";
import type { User } from "@supabase/supabase-js";
import { ACTIVE_ORGANIZATION_COOKIE } from "../organization/contracts";
import { getOrganizationsForUser } from "../organization/server";
import { buildAuthorizationContext } from "./session";

export type AuthenticatedShellContext = {
  user: User;
  availableRoles: UserRole[];
  defaultRole: UserRole;
  defaultOrganizationId: string | null;
  organizations: Awaited<ReturnType<typeof getOrganizationsForUser>>;
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

  const context = buildAuthorizationContext(
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

  const fallbackRole = USER_ROLES[0] ?? "property_manager";
  const availableRoles = context.roles.length ? context.roles : [fallbackRole];
  const defaultRole = context.activeRole ?? availableRoles[0] ?? fallbackRole;

  return {
    user,
    availableRoles,
    defaultRole,
    organizations,
    defaultOrganizationId
  };
}
