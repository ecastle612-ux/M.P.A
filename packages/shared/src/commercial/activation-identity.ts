/**
 * Customer activation identity copy — presentation only.
 * Routes and entitlements are unchanged.
 */

import type { ProductSku } from "./skus";
import { productDisplayLabel } from "../auth/post-auth-home";
import { resolveProductWorkspaceHome } from "../auth/post-auth-home";

/** Workspace breadcrumb / settings nav naming by SKU. */
export function productWorkspaceNavLabel(productSku: ProductSku | null | undefined): string {
  switch (productSku) {
    case "mpa_facility_operations":
      return "Facility Operations Workspace";
    case "mpa_complete_platform":
      return "Organization Workspace";
    case "mpa_property_manager":
      return "Property Manager Workspace";
    default:
      return "Workspace";
  }
}

/** Href for the SKU workspace home used in breadcrumbs. */
export function productWorkspaceNavHref(productSku: ProductSku | null | undefined): string {
  if (!productSku) {
    return "/dashboard";
  }
  return resolveProductWorkspaceHome(productSku);
}

/**
 * Post-purchase destination name (claim / continue / success).
 * Aligns with productWorkspaceHomeLabel — kept explicit for activation surfaces.
 */
export function postPurchaseDestinationLabel(productSku: ProductSku | null | undefined): string {
  switch (productSku) {
    case "mpa_facility_operations":
      return "Facility Operations Mission Control";
    case "mpa_complete_platform":
      return "Complete Platform Launcher";
    case "mpa_property_manager":
      return "Property Manager Mission Control";
    default:
      return "your workspace home";
  }
}

/** One-line claim / continue next-step sentence. */
export function postPurchaseNextStepCopy(productSku: ProductSku | null | undefined): string {
  const product = productDisplayLabel(productSku);
  const destination = postPurchaseDestinationLabel(productSku);
  if (!productSku) {
    return `Next: set password → claim workspace → Guided Setup → ${destination}. Your organization is prepared automatically from checkout.`;
  }
  return `You purchased ${product}. Next: set password → claim workspace → Guided Setup → ${destination}. Your organization is prepared automatically from checkout.`;
}

/** Short ready-state continue copy after provisioning. */
export function postPurchaseReadyCopy(productSku: ProductSku | null | undefined): string {
  const product = productDisplayLabel(productSku);
  const destination = postPurchaseDestinationLabel(productSku);
  if (!productSku) {
    return `Your organization is provisioned. Next: Guided Setup, then ${destination}.`;
  }
  return `Your ${product} organization is provisioned. Next: Guided Setup, then ${destination}.`;
}
