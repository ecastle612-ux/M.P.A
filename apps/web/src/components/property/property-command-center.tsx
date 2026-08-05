import { UniversalDashboard } from "../dashboard-framework";
import { PropertyLifecyclePanel } from "./property-lifecycle-panel";
import { buildPropertyCommandCenterViewModel } from "../../lib/property/ux016-view-model";
import type { PropertyRecord } from "../../lib/property/contracts";
import type { PropertyLifecycleStage } from "../../lib/property/lifecycle";

/**
 * CORE-004 Phase 1 — Property Command Center (STD-001 UDF).
 * Authoritative operational home for a single property.
 */
export function PropertyCommandCenter({
  property,
  unitCount,
  occupiedUnits,
  vacancyUnits,
  tenantCount,
  canUpdate,
  canCreateUnit,
  canCreateMaintenance,
  recentLifecycle,
  openMaintenanceCount = 0,
  userName,
  organizationName
}: {
  property: PropertyRecord;
  unitCount: number;
  occupiedUnits: number;
  vacancyUnits: number;
  tenantCount: number;
  canUpdate: boolean;
  canCreateUnit: boolean;
  canCreateMaintenance: boolean;
  recentLifecycle: Array<{
    id: string;
    fromStage: PropertyLifecycleStage | null;
    toStage: PropertyLifecycleStage;
    createdAt: string;
    reason: string | null;
  }>;
  openMaintenanceCount?: number;
  userName: string | null;
  organizationName: string | null;
}) {
  const model = buildPropertyCommandCenterViewModel({
    property,
    unitCount,
    occupiedUnits,
    vacancyUnits,
    tenantCount,
    canUpdate,
    canCreateUnit,
    canCreateMaintenance,
    recentLifecycle,
    openMaintenanceCount,
    userName,
    organizationName
  });

  return (
    <div className="space-y-8" data-core004="property-command-center" data-std001="property-home">
      <UniversalDashboard model={model} />
      <PropertyLifecyclePanel
        propertyId={property.id}
        currentStage={property.lifecycleStage}
        canUpdate={canUpdate}
      />
    </div>
  );
}
