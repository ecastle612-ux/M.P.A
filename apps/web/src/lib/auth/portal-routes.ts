import { defaultHomeForRole, type UserRole } from "@mpa/shared";

export function toPortalPath(role: UserRole): string {
  return defaultHomeForRole(role);
}
