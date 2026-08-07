import { cookies } from "next/headers";
import { primaryRole, type UserRole } from "@mpa/shared";
import type { User } from "@supabase/supabase-js";
import { ACTIVE_ORGANIZATION_COOKIE } from "../organization/contracts";
import { getOrganizationsForUser } from "../organization/server";
import { buildAuthorizationContext } from "./session";

export type AuthenticatedShellContext = {
  user: User;
  availableRoles: UserRole[];
  /** Primary membership role — null when membership has no recognized roles. Never invent a staff role. */
  defaultRole: UserRole | null;
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

  const availableRoles = context.roles;
  const defaultRole = context.activeRole ?? primaryRole(availableRoles);

  return {
    user,
    availableRoles,
    defaultRole,
    organizations,
    defaultOrganizationId
  };
}
