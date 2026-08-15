import { resolvePostAuthHome, type UserRole } from "@mpa/shared";

export function toPortalPath(role: UserRole): string {
  return resolvePostAuthHome({
    roles: [role],
    productSku: null,
    setupComplete: false
  });
}
