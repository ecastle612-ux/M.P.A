import { z } from "zod";
import { USER_ROLES, isUserRole, type UserRole } from "../types/roles";

const roleArraySchema = z.array(z.enum(USER_ROLES)).default([]);

export type AuthorizationContext = {
  userId: string;
  organizationId: string | null;
  roles: UserRole[];
  activeRole: UserRole | null;
};

export function extractRolesFromMetadata(metadata: unknown): UserRole[] {
  const metadataObject =
    metadata && typeof metadata === "object" ? (metadata as Record<string, unknown>) : null;
  const parsed = roleArraySchema.safeParse(metadataObject?.["roles"]);
  return parsed.success ? parsed.data : [];
}

export function resolveActiveRole(
  roles: UserRole[],
  preferredRole: unknown,
): UserRole | null {
  if (isUserRole(preferredRole) && roles.includes(preferredRole)) {
    return preferredRole;
  }
  return roles[0] ?? null;
}

export function canAccessRole(
  context: AuthorizationContext,
  required: UserRole | UserRole[],
): boolean {
  const requiredRoles = Array.isArray(required) ? required : [required];
  return requiredRoles.some((role) => context.roles.includes(role));
}
