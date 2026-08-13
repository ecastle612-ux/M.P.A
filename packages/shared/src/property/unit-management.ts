/**
 * Pure unit-management safety helpers — presentation + guardrails only.
 * Uses existing property_units.status values (available | occupied | offline).
 */

export type UnitRelationshipSnapshot = {
  status: string;
  hasResident: boolean;
  hasActiveLease: boolean;
  openMaintenanceCount?: number;
};

/** Why archive (status → offline) must be refused. */
export function unitArchiveBlockReason(unit: UnitRelationshipSnapshot): string | null {
  if (unit.status === "offline") {
    return "This unit is already archived (offline).";
  }
  if (unit.status === "occupied" || unit.hasResident || unit.hasActiveLease) {
    return "Move or end the resident/lease on this unit before archiving it.";
  }
  return null;
}

/** Why a customer status edit must be refused. */
export function unitStatusEditBlockReason(
  currentStatus: string,
  nextStatus: string,
  relationships: Pick<UnitRelationshipSnapshot, "hasResident" | "hasActiveLease">
): string | null {
  if (nextStatus === currentStatus) {
    return null;
  }
  if (nextStatus === "occupied") {
    return "Occupied status is set by leasing and residents — not manually.";
  }
  if (currentStatus === "occupied" || relationships.hasResident || relationships.hasActiveLease) {
    return "Clear the resident and active lease before changing this unit’s status.";
  }
  if (nextStatus !== "available" && nextStatus !== "offline") {
    return "Unit status must be available or offline.";
  }
  return null;
}

export function unitImpactCopy(): {
  residents: string;
  leasing: string;
  maintenance: string;
  capacity: string;
} {
  return {
    residents: "Residents must be assigned to an available unit.",
    leasing: "Leases and applications attach to a unit.",
    maintenance: "Residential maintenance can reference a unit when relevant.",
    capacity:
      "Archived (offline) units stay on your plan capacity count — they are hidden from day-to-day assignment, not deleted from billing."
  };
}
