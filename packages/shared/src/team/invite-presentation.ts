/**
 * SKU-aware invite presentation — defaults, ordering, and labels only.
 * Does not change RBAC permissions or role keys.
 */

import type { ProductSku } from "../commercial/skus";
import {
  LAUNCH_INVITE_ROLES,
  toRoleDescription,
  toRoleLabel,
  type LaunchInviteRole
} from "../types/roles";

/** Default invite role for Organization Admins by SKU. */
export function defaultLaunchInviteRoleForSku(sku: ProductSku | null | undefined): LaunchInviteRole {
  if (sku === "mpa_facility_operations") {
    return "maintenance_technician";
  }
  return "property_manager";
}

/**
 * Invite role order for the select. FO prioritizes technician → facility manager → vendor.
 * All existing launch roles remain available.
 */
export function launchInviteRolesForSku(sku: ProductSku | null | undefined): LaunchInviteRole[] {
  if (sku === "mpa_facility_operations") {
    const foPriority: LaunchInviteRole[] = [
      "maintenance_technician",
      "property_manager",
      "vendor",
      "organization_admin",
      "leasing_agent",
      "property_owner"
    ];
    const remaining = LAUNCH_INVITE_ROLES.filter((role) => !foPriority.includes(role));
    return [...foPriority, ...remaining];
  }
  return [...LAUNCH_INVITE_ROLES];
}

/** Invite select label — FO uses Facility Technician / Facility Manager wording. */
export function toInviteRoleLabel(
  role: LaunchInviteRole,
  sku: ProductSku | null | undefined
): string {
  if (sku === "mpa_facility_operations") {
    switch (role) {
      case "maintenance_technician":
        return "Facility Technician";
      case "property_manager":
        return "Facility Manager";
      default:
        break;
    }
  }
  return toRoleLabel(role);
}

/** Invite explanation — FO-tuned copy; permissions unchanged. */
export function toInviteRoleDescription(
  role: LaunchInviteRole,
  sku: ProductSku | null | undefined
): string {
  if (sku === "mpa_facility_operations") {
    switch (role) {
      case "maintenance_technician":
        return "Executes facility work — assigned work orders through completion.";
      case "property_manager":
        return "Coordinates facility operations — buildings, work orders, and team follow-through.";
      case "vendor":
        return "External service provider — progresses assigned facility work in the vendor portal.";
      case "organization_admin":
        return "Full organization management — sites, team access, and Facility Operations setup.";
      default:
        break;
    }
  }
  return toRoleDescription(role);
}
