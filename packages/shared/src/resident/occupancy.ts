export const OCCUPANCY_STATUSES = ["scheduled", "occupying", "moved_out"] as const;
export type OccupancyStatus = (typeof OCCUPANCY_STATUSES)[number];

export const TENANT_ACCESS_MODES = ["invited", "future", "active", "moved_out"] as const;
export type TenantAccessMode = (typeof TENANT_ACCESS_MODES)[number];

export type OccupancyWindow = {
  occupancyStatus: OccupancyStatus;
  occupyFrom: string;
  occupyTo: string | null;
};

export function utcToday(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function compareIsoDate(left: string, right: string): number {
  return left.localeCompare(right);
}

export function deriveOccupancyAccess(
  occupancy: OccupancyWindow,
  today: string = utcToday()
): TenantAccessMode {
  if (compareIsoDate(occupancy.occupyFrom, today) > 0) {
    return "future";
  }
  if (occupancy.occupyTo && compareIsoDate(today, occupancy.occupyTo) > 0) {
    return "moved_out";
  }
  if (occupancy.occupancyStatus === "moved_out" && occupancy.occupyTo) {
    return "moved_out";
  }
  return "active";
}

export function occupancyIsCurrent(occupancy: OccupancyWindow, today: string = utcToday()): boolean {
  return deriveOccupancyAccess(occupancy, today) === "active";
}

export function occupancyIsHistorical(occupancy: OccupancyWindow, today: string = utcToday()): boolean {
  return deriveOccupancyAccess(occupancy, today) === "moved_out";
}

export function occupancyIsFuture(occupancy: OccupancyWindow, today: string = utcToday()): boolean {
  return deriveOccupancyAccess(occupancy, today) === "future";
}

export function resolveFinanceChargeDate(input: {
  periodStart?: string | null;
  dueAt?: string | null;
  createdAt?: string | null;
}): string | null {
  if (input.periodStart) return input.periodStart;
  if (input.dueAt) return input.dueAt;
  if (input.createdAt) return input.createdAt.slice(0, 10);
  return null;
}

export function financeChargeVisibleToOccupancy(
  occupancy: OccupancyWindow,
  chargeDate: string | null,
  today: string = utcToday()
): boolean {
  const mode = deriveOccupancyAccess(occupancy, today);
  if (mode === "future") {
    return false;
  }
  if (mode === "active") {
    return true;
  }
  if (!chargeDate) {
    return false;
  }
  if (compareIsoDate(chargeDate, occupancy.occupyFrom) < 0) {
    return false;
  }
  if (occupancy.occupyTo && compareIsoDate(chargeDate, occupancy.occupyTo) > 0) {
    return false;
  }
  return true;
}

export function tenantAccessLabel(mode: TenantAccessMode): string {
  switch (mode) {
    case "invited":
      return "Invited";
    case "future":
      return "Future";
    case "active":
      return "Active";
    case "moved_out":
      return "Moved out";
    default:
      return mode;
  }
}

export function isOccupancyStatus(value: string): value is OccupancyStatus {
  return (OCCUPANCY_STATUSES as readonly string[]).includes(value);
}
