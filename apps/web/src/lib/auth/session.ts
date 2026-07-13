import { extractRolesFromMetadata, resolveActiveRole, type AuthorizationContext } from "@mpa/shared";
import type { User } from "@supabase/supabase-js";

export function buildAuthorizationContext(
  user: User,
  preferredRole: unknown,
): AuthorizationContext {
  const roles = extractRolesFromMetadata(user.app_metadata);
  const activeRole = resolveActiveRole(roles, preferredRole);
  return {
    userId: user.id,
    roles,
    activeRole
  };
}
