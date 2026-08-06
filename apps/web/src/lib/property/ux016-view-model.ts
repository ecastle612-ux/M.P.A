/**
 * CORE-004 Phase 1 — Property Command Center on Universal Dashboard Framework.
 * Authoritative home for a single property workspace.
 */

import type { PropertyListItem, PropertyRecord } from "./contracts";
import {
  PROPERTY_LIFECYCLE_DEFINITIONS,
  PROPERTY_LIFECYCLE_TRANSITIONS,
  primaryNextStage,
  toLifecycleStageLabel,
  type PropertyLifecycleStage
} from "./lifecycle";
import type {
  UniversalActivityItem,
  UniversalAttentionItem,
  UniversalDashboardViewModel,
  UniversalInsightItem,
  UniversalMissionItem,
  UniversalQuickAction
} from "../dashboard/ux016-view-model";
import type { AssistantWaitingItem } from "../dashboard/ux016-assistant";
import {
  assembleUniversalHome,
  dateLabelFromNow,
  timeGreetingFromNow
} from "../std001/assemble-universal-home";

export type PropertyCommandCenterInput = {
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
  /** CORE-004 Phase 2 — open maintenance count for property integration */
  openMaintenanceCount?: number;
  /** CORE-004 Phase 3 — active leasing pipeline count (non-terminal workflow stages) */
  activeLeasingCount?: number;
  /** CORE-004 Phase 4 — active residents on this property */
  activeResidentCount?: number;
  userName?: string | null;
  organizationName?: string | null;
};

export function buildPropertyCommandCenterViewModel(
  input: PropertyCommandCenterInput
): UniversalDashboardViewModel {
  const { property } = input;
  const base = `/properties/${property.id}`;
  const stageDef = PROPERTY_LIFECYCLE_DEFINITIONS[property.lifecycleStage];
  const next = primaryNextStage(property.lifecycleStage);
  const allowed = PROPERTY_LIFECYCLE_TRANSITIONS[property.lifecycleStage];

  const attention: UniversalAttentionItem[] = [];
  const waitingOnMe: AssistantWaitingItem[] = [];
  const waitingOnOthers: AssistantWaitingItem[] = [];

  if (
    property.lifecycleStage !== "operational" &&
    property.lifecycleStage !== "occupancy" &&
    property.lifecycleStage !== "archived"
  ) {
    attention.push({
      id: "lifecycle-advance",
      title: `${stageDef.label} in progress`,
      reason: stageDef.exitCriteria[0] ?? "Advance the property lifecycle",
      href: base,
      actionLabel: next ? `Advance to ${toLifecycleStageLabel(next)}` : "Review",
      severity:
        property.lifecycleStage === "disposition" || property.lifecycleStage === "activation"
          ? "critical"
          : "high"
    });
    waitingOnMe.push({
      id: "wait-lifecycle",
      label: `Complete ${stageDef.label}`,
      detail: stageDef.assistantRecommendations[0] ?? stageDef.exitCriteria[0] ?? "Advance lifecycle",
      href: base
    });
  }

  if (input.unitCount === 0 && property.lifecycleStage !== "archived") {
    attention.push({
      id: "no-units",
      title: "No units configured",
      reason: "Activation requires at least one unit",
      href: `/units/new?propertyId=${encodeURIComponent(property.id)}`,
      actionLabel: "Add unit",
      severity: "critical"
    });
    waitingOnMe.push({
      id: "wait-units",
      label: "Add units",
      detail: "Configuration gate for activation",
      href: `/units/new?propertyId=${encodeURIComponent(property.id)}`
    });
  }

  if (input.vacancyUnits > 0 && property.lifecycleStage === "occupancy") {
    attention.push({
      id: "vacancies",
      title: "Vacancies need attention",
      reason: `${input.vacancyUnits} vacant unit${input.vacancyUnits === 1 ? "" : "s"}`,
      href: `/units?propertyId=${encodeURIComponent(property.id)}`,
      actionLabel: "Review units",
      severity: "high"
    });
  }

  if (property.lifecycleStage === "turnover") {
    waitingOnMe.push({
      id: "wait-turnover",
      label: "Complete turnover checklist",
      detail: "Make-ready before leasing",
      href: base
    });
  }

  if (property.lifecycleStage === "disposition") {
    waitingOnOthers.push({
      id: "wait-disposition-approval",
      label: "Disposition confirmation",
      detail: "Archive when exit is complete",
      href: base
    });
  }

  if ((input.openMaintenanceCount ?? 0) > 0) {
    attention.push({
      id: "property-maintenance",
      title: "Open maintenance work",
      reason: `${input.openMaintenanceCount} open work order${input.openMaintenanceCount === 1 ? "" : "s"}`,
      href: `/maintenance?propertyId=${encodeURIComponent(property.id)}`,
      actionLabel: "Open maintenance",
      severity: "high"
    });
    waitingOnMe.push({
      id: "wait-property-maintenance",
      label: "Property maintenance queue",
      detail: "Canonical workflow work orders for this property",
      href: `/maintenance?propertyId=${encodeURIComponent(property.id)}`
    });
  }

  if ((input.activeLeasingCount ?? 0) > 0) {
    attention.push({
      id: "property-leasing",
      title: "Active leasing pipeline",
      reason: `${input.activeLeasingCount} lease${input.activeLeasingCount === 1 ? "" : "s"} in workflow`,
      href: `/leases?propertyId=${encodeURIComponent(property.id)}`,
      actionLabel: "Open leasing",
      severity: "high"
    });
    waitingOnMe.push({
      id: "wait-property-leasing",
      label: "Property leasing queue",
      detail: "Canonical leasing lifecycle for this property",
      href: `/leases?propertyId=${encodeURIComponent(property.id)}`
    });
  }

  if ((input.activeResidentCount ?? 0) > 0) {
    attention.push({
      id: "property-residents",
      title: "Active residents",
      reason: `${input.activeResidentCount} resident${input.activeResidentCount === 1 ? "" : "s"} on this property`,
      href: `/tenants?propertyId=${encodeURIComponent(property.id)}`,
      actionLabel: "Open residents",
      severity: "normal"
    });
  }

  const mission: UniversalMissionItem[] = [
    {
      id: "mission-lifecycle",
      label: `lifecycle · ${stageDef.label.toLowerCase()}`,
      count: 1,
      href: base
    }
  ];
  if (input.vacancyUnits > 0) {
    mission.push({
      id: "mission-vacant",
      label: "vacant units",
      count: input.vacancyUnits,
      href: `/units?propertyId=${encodeURIComponent(property.id)}`
    });
  }
  if (input.tenantCount > 0) {
    mission.push({
      id: "mission-residents",
      label: "residents",
      count: input.tenantCount,
      href: `/tenants?propertyId=${encodeURIComponent(property.id)}`
    });
  }

  const quickActions: UniversalQuickAction[] = [];
  if (input.canUpdate && next && allowed.includes(next)) {
    quickActions.push({
      id: "qa-advance",
      label: `Advance to ${toLifecycleStageLabel(next)}`,
      href: `${base}?lifecycleAction=advance`
    });
  }
  if (input.canCreateUnit) {
    quickActions.push({
      id: "qa-unit",
      label: "Add unit",
      href: `/units/new?propertyId=${encodeURIComponent(property.id)}`
    });
  }
  if (input.canCreateMaintenance) {
    quickActions.push({
      id: "qa-wo",
      label: "New work order",
      href: `/maintenance/new?propertyId=${encodeURIComponent(property.id)}`
    });
  }
  quickActions.push({
    id: "qa-maint-queue",
    label: "Property maintenance",
    href: `/maintenance?propertyId=${encodeURIComponent(property.id)}`
  });
  quickActions.push(
    {
      id: "qa-residents",
      label: "Residents",
      href: `/tenants?propertyId=${encodeURIComponent(property.id)}`
    },
    {
      id: "qa-leases",
      label: "Leasing",
      href: "/leases"
    },
    {
      id: "qa-edit",
      label: "Settings",
      href: `/properties/${property.id}/edit`
    }
  );

  const recentActivity: UniversalActivityItem[] = input.recentLifecycle.slice(0, 8).map((event) => ({
    id: event.id,
    summary: event.fromStage
      ? `${toLifecycleStageLabel(event.fromStage)} → ${toLifecycleStageLabel(event.toStage)}`
      : `Entered ${toLifecycleStageLabel(event.toStage)}`,
    meta: event.reason ?? "Lifecycle transition",
    href: base
  }));

  const occupancyRate =
    input.unitCount > 0 ? Math.round((input.occupiedUnits / input.unitCount) * 100) : 0;

  const insights: UniversalInsightItem[] = [
    {
      id: "insight-stage",
      label: "Lifecycle",
      value: stageDef.label,
      href: base
    },
    {
      id: "insight-units",
      label: "Units",
      value: String(input.unitCount),
      href: `/units?propertyId=${encodeURIComponent(property.id)}`
    },
    {
      id: "insight-occupancy",
      label: "Occupancy",
      value: `${occupancyRate}%`,
      href: `/units?propertyId=${encodeURIComponent(property.id)}`
    },
    {
      id: "insight-residents",
      label: "Residents",
      value: String(input.tenantCount),
      href: `/tenants?propertyId=${encodeURIComponent(property.id)}`
    }
  ];

  return assembleUniversalHome({
    surfaceLabel: "Property Command Center",
    timeGreeting: timeGreetingFromNow(),
    userName: input.userName ?? null,
    organizationName: input.organizationName ?? null,
    placeLabel: property.name,
    dateLabel: dateLabelFromNow(),
    supportingLine: `${property.addressLine1}, ${property.city} · ${stageDef.label}`,
    attention,
    mission,
    quickActions,
    recentActivity,
    insights,
    waitingOnMe,
    waitingOnOthers
  });
}

export function buildPortfolioPropertiesViewModel(input: {
  items: PropertyListItem[];
  canCreate: boolean;
  userName?: string | null;
  organizationName?: string | null;
}): UniversalDashboardViewModel {
  const active = input.items.filter(
    (item) =>
      item.lifecycleStage === "operational" ||
      item.lifecycleStage === "occupancy" ||
      item.lifecycleStage === "turnover"
  );
  const pipeline = input.items.filter(
    (item) =>
      item.lifecycleStage !== "operational" &&
      item.lifecycleStage !== "occupancy" &&
      item.lifecycleStage !== "turnover" &&
      item.lifecycleStage !== "archived"
  );
  const attention: UniversalAttentionItem[] = [];
  if (pipeline.length > 0) {
    attention.push({
      id: "portfolio-pipeline",
      title: "Properties in lifecycle pipeline",
      reason: `${pipeline.length} not yet fully operational`,
      href: "/properties",
      actionLabel: "Review",
      severity: "high"
    });
  }
  const withoutUnits = input.items.filter((item) => item.unitCount === 0 && item.lifecycleStage !== "archived");
  if (withoutUnits.length > 0) {
    attention.push({
      id: "portfolio-no-units",
      title: "Properties without units",
      reason: `${withoutUnits.length} blocked from activation`,
      href: `/properties/${withoutUnits[0]!.id}`,
      actionLabel: "Open",
      severity: "critical"
    });
  }

  const waitingOnMe: AssistantWaitingItem[] = pipeline.slice(0, 5).map((item) => ({
    id: `wait-${item.id}`,
    label: item.name,
    detail: `${toLifecycleStageLabel(item.lifecycleStage)} — ${PROPERTY_LIFECYCLE_DEFINITIONS[item.lifecycleStage].assistantRecommendations[0] ?? "Advance lifecycle"}`,
    href: `/properties/${item.id}`
  }));

  const mission: UniversalMissionItem[] = [
    { id: "m-active", label: "operational properties", count: active.length, href: "/properties" },
    { id: "m-pipeline", label: "in pipeline", count: pipeline.length, href: "/properties" }
  ];

  const quickActions: UniversalQuickAction[] = [];
  if (input.canCreate) {
    quickActions.push({ id: "qa-new", label: "New property prospect", href: "/properties/new" });
  }
  quickActions.push(
    { id: "qa-units", label: "Units", href: "/units" },
    { id: "qa-dashboard", label: "Operations home", href: "/dashboard" }
  );

  const recentActivity: UniversalActivityItem[] = input.items.slice(0, 8).map((item) => ({
    id: item.id,
    summary: item.name,
    meta: toLifecycleStageLabel(item.lifecycleStage),
    href: `/properties/${item.id}`
  }));

  const insights: UniversalInsightItem[] = [
    { id: "i-total", label: "Properties", value: String(input.items.length), href: "/properties" },
    { id: "i-active", label: "Operational", value: String(active.length), href: "/properties" },
    { id: "i-pipeline", label: "Pipeline", value: String(pipeline.length), href: "/properties" }
  ];

  return assembleUniversalHome({
    surfaceLabel: "Property Operations",
    timeGreeting: timeGreetingFromNow(),
    userName: input.userName ?? null,
    organizationName: input.organizationName ?? null,
    placeLabel: "Portfolio",
    dateLabel: dateLabelFromNow(),
    supportingLine: "Property Lifecycle · portfolio command view",
    attention,
    mission,
    quickActions,
    recentActivity,
    insights,
    waitingOnMe,
    waitingOnOthers: []
  });
}
