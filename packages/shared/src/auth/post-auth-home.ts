import type { ProductSku } from "../commercial/skus";
import { defaultHomeForRole, primaryRole, type UserRole } from "../types/roles";

export type PostAuthHomeInput = {
  roles: readonly UserRole[];
  productSku: ProductSku | null;
  setupComplete: boolean;
  isPlatformOperator?: boolean;
};

/**
 * Canonical post-authentication workspace router.
 * Routes by active membership role — never by SKU alone when a role is present.
 */
export function resolvePostAuthHome(input: PostAuthHomeInput): string {
  const role = primaryRole(input.roles);

  // Portal / invitee roles never require Guided Setup to reach their workspace.
  const isPortalRole =
    role === "tenant" || role === "vendor" || role === "property_owner";

  if (!isPortalRole) {
    if (!input.productSku) {
      if (input.isPlatformOperator) {
        return "/admin";
      }
      return "/setup";
    }
    if (!input.setupComplete) {
      return "/setup";
    }
  }

  if (role) {
    return defaultHomeForRole(role);
  }

  if (input.isPlatformOperator) {
    return "/admin";
  }

  if (!input.productSku || !input.setupComplete) {
    return "/setup";
  }

  // Membership present but roles unrecognized — do not invent Organization Admin.
  return "/unauthorized?reason=role";
}

export function postAuthHomeForRole(role: UserRole): string {
  return defaultHomeForRole(role);
}
