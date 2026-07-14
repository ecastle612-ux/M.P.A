import {
  extractRolesFromMetadata,
  isUserRole,
  resolveActiveRole,
  type AuthorizationContext,
  type UserRole
} from "@mpa/shared";
import type { User } from "@supabase/supabase-js";

export function buildAuthorizationContext(
  user: User,
  preferredRole: unknown,
  options?: {
    organizationId?: string | null;
    roles?: readonly string[];
  }
): AuthorizationContext {
  const roles =
    options?.roles?.filter((role): role is UserRole => isUserRole(role)) ??
    extractRolesFromMetadata(user.app_metadata);
  const activeRole = resolveActiveRole(roles, preferredRole);
  return {
    userId: user.id,
    organizationId: options?.organizationId ?? null,
    roles,
    activeRole
  };
}
