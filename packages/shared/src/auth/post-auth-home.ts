import type { ProductSku } from "../commercial/skus";
import { SKU_SUMMARIES } from "../commercial/skus";
import { defaultHomeForRole, primaryRole, type UserRole } from "../types/roles";

export type PostAuthHomeInput = {
  roles: readonly UserRole[];
  productSku: ProductSku | null;
  setupComplete: boolean;
  isPlatformOperator?: boolean;
};

/**
 * Authoritative product workspace home for staff entry points
 * (Guided Setup finish, Billing home, post-auth manager/admin home).
 *
 * PM → Property Manager Mission Control
 * FO → Facility Mission Control
 * Complete → Workspace Launcher (one platform start-of-day; not dual-product theater)
 */
export function resolveProductWorkspaceHome(productSku: ProductSku): string {
  switch (productSku) {
    case "mpa_facility_operations":
      return "/facility/mission-control";
    case "mpa_complete_platform":
      return "/launcher";
    case "mpa_property_manager":
    default:
      return "/pm/mission-control";
  }
}

/** Alias kept for call sites that already speak in SKU-home terms. */
export function defaultHomeForSku(sku: ProductSku | null): string {
  if (!sku) {
    return "/setup";
  }
  return resolveProductWorkspaceHome(sku);
}

export function productWorkspaceHomeLabel(productSku: ProductSku): string {
  switch (productSku) {
    case "mpa_facility_operations":
      return "Facility Mission Control";
    case "mpa_complete_platform":
      return "Workspace Launcher";
    case "mpa_property_manager":
    default:
      return "Mission Control";
  }
}

export function productDisplayLabel(productSku: ProductSku | null | undefined): string {
  if (!productSku) {
    return "your plan";
  }
  return SKU_SUMMARIES[productSku].label;
}

/** First Guided Setup / Mission Control next-step language by SKU. */
export function guidedSetupNextActionCopy(productSku: ProductSku): string {
  switch (productSku) {
    case "mpa_facility_operations":
      return "add your first building in Assets (or create facility work in Operations)";
    case "mpa_complete_platform":
      return "open Mission Control from the Launcher and add your first property";
    case "mpa_property_manager":
    default:
      return "add your first property";
  }
}

function homeForStaffRole(role: UserRole, productSku: ProductSku | null): string {
  // Managers / org admins use the product workspace home (single source of truth).
  if (
    (role === "organization_admin" || role === "property_manager") &&
    productSku
  ) {
    return resolveProductWorkspaceHome(productSku);
  }

  const roleHome = defaultHomeForRole(role);
  // FO-only subscriptions do not include PM module homes — remap staff into FO.
  if (
    productSku === "mpa_facility_operations" &&
    (roleHome.startsWith("/pm/") || roleHome === "/launcher")
  ) {
    return "/facility/mission-control";
  }
  return roleHome;
}

/**
 * Canonical post-authentication workspace router.
 * Routes by active membership role, with SKU-safe remapping via
 * {@link resolveProductWorkspaceHome} for manager/admin homes.
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
    return homeForStaffRole(role, input.productSku);
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
