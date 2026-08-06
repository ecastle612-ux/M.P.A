import { evaluateCapability, type PermissionCapability } from "../auth/permissions";

export const MAINTENANCE_CAPABILITIES = [
  "pm.maintenance:read",
  "pm.maintenance:write",
  "pm.maintenance:assign"
] as const;

export type MaintenanceCapability = (typeof MAINTENANCE_CAPABILITIES)[number];

export const MAINTENANCE_CAPABILITY_DESCRIPTIONS: Record<MaintenanceCapability, string> = {
  "pm.maintenance:read": "Read maintenance work orders and Maintenance Command Center",
  "pm.maintenance:write": "Update work-order progress, notes, and completion",
  "pm.maintenance:assign": "Prioritize and assign technicians or vendors"
};

export function hasMaintenanceCapability(
  grantedCapabilities: readonly string[],
  required: MaintenanceCapability
): boolean {
  return evaluateCapability(grantedCapabilities, required as PermissionCapability);
}
