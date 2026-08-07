import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildMaintenanceReadyAssistantCopy,
  buildPropertyReadyAssistantCopy,
  buildRentReadyAssistantCopy
} from "@mpa/shared";
import { getPortfolioProperty, listPropertyTimeline } from "./property-catalog";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

/**
 * Property Command Center composition.
 * Depends on catalog + resident/maintenance leaves — not Mission Control or owner portfolio.
 */
export async function getPropertyCommandCenter(
  supabase: Db,
  organizationId: string,
  propertyId: string
) {
  const property = await getPortfolioProperty(supabase, organizationId, propertyId);
  if (!property) {
    return null;
  }

  const timeline = await listPropertyTimeline(supabase, organizationId, propertyId);
  const units = property.property_units ?? [];
  const { listResidentsForProperty } = await import("../resident/resident-service");
  const residents = await listResidentsForProperty(supabase, organizationId, propertyId);
  const assignedUnitIds = new Set(residents.map((row) => row.unit_id as string));

  const { data: activeLeases } = await supabase
    .from("lease_agreements")
    .select(
      "id, status, rent_amount, currency, rent_day_of_month, unit_id, resident_id, pm_residents(display_name, portal_status), property_units(unit_label)"
    )
    .eq("organization_id", organizationId)
    .eq("property_id", propertyId)
    .eq("status", "active")
    .order("activated_at", { ascending: false });

  const leaseRows = activeLeases ?? [];
  const scheduleIds = leaseRows.map((row) => row.id as string);
  const { data: schedules } =
    scheduleIds.length > 0
      ? await supabase
          .from("financial_charge_schedules")
          .select("lease_id, next_run_on, amount, active")
          .eq("organization_id", organizationId)
          .in("lease_id", scheduleIds)
          .eq("charge_type", "rent")
          .eq("active", true)
      : { data: [] as Array<{ lease_id: string; next_run_on: string; amount: number }> };

  const hasResidents = residents.length > 0;
  const hasActiveLease = leaseRows.length > 0;
  const { count: propertyPaymentCount } = await supabase
    .from("financial_payments")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("property_id", propertyId)
    .eq("status", "succeeded");
  const hasCollectedRent = (propertyPaymentCount ?? 0) > 0;
  const { getPropertyMaintenanceSummary, getMaintenanceReadiness } = await import(
    "../maintenance/maintenance-service"
  );
  const maintenanceSummary = await getPropertyMaintenanceSummary(
    supabase,
    organizationId,
    propertyId
  );
  const orgMaintenance = await getMaintenanceReadiness(supabase, organizationId);
  const propertyClosedMaintenance = maintenanceSummary.history.some(
    (row) => row.status === "closed"
  );

  return {
    property: {
      id: property.id,
      name: property.name,
      status: property.status,
      addressLine1: property.address_line1,
      city: property.city,
      createdAt: property.created_at,
      unitCount: units.length,
      unitsAvailable: units.filter((unit) => unit.status === "available").length,
      unitsOccupied: units.filter((unit) => unit.status === "occupied").length,
      residentsAssigned: residents.length,
      unitsAssigned: assignedUnitIds.size
    },
    units: units.map((unit) => ({
      ...unit,
      assignedResident:
        residents.find((resident) => resident.unit_id === unit.id)?.display_name ?? null
    })),
    residents: residents.map((resident) => ({
      id: resident.id as string,
      displayName: resident.display_name as string,
      email: resident.email as string,
      status: resident.status as string,
      portalStatus: resident.portal_status as string,
      unitId: resident.unit_id as string,
      unitLabel:
        (Array.isArray(resident.property_units)
          ? resident.property_units[0]?.unit_label
          : (resident.property_units as { unit_label?: string } | null)?.unit_label) ?? "—"
    })),
    activeLeases: leaseRows.map((lease) => {
      const schedule = (schedules ?? []).find((row) => row.lease_id === lease.id);
      const resident = Array.isArray(lease.pm_residents)
        ? lease.pm_residents[0]
        : lease.pm_residents;
      const unit = Array.isArray(lease.property_units)
        ? lease.property_units[0]
        : lease.property_units;
      return {
        id: lease.id as string,
        status: lease.status as string,
        residentName: (resident as { display_name?: string } | null)?.display_name ?? "Resident",
        portalStatus: (resident as { portal_status?: string } | null)?.portal_status ?? null,
        unitLabel: (unit as { unit_label?: string } | null)?.unit_label ?? "—",
        rentAmount: Number(lease.rent_amount),
        currency: lease.currency as string,
        nextRentDate: (schedule?.next_run_on as string | undefined) ?? null,
        financialStatus: "current"
      };
    }),
    timeline: timeline.map((event) => ({
      id: event.id as string,
      title:
        event.event_type === "property.created"
          ? "Property created"
          : event.event_type === "property.activated"
            ? "Property activated"
            : event.event_type === "resident.property_assigned"
              ? "Resident assigned"
              : event.event_type === "lease.activated"
                ? "Lease activated"
                : event.event_type === "finance.payment.succeeded"
                  ? "Rent collected"
                  : event.event_type === "work_order.created"
                    ? "Maintenance request"
                    : event.event_type === "work_order.closed"
                      ? "Maintenance closed"
                      : event.event_type === "vendor.assigned" ||
                          event.event_type === "work_order.assigned"
                        ? "Maintenance assigned"
                        : String(event.event_type),
      detail:
        event.event_type === "finance.payment.succeeded" &&
        typeof (event.payload as { amount?: number } | null)?.amount === "number"
          ? `Payment of ${Number((event.payload as { amount: number }).amount).toFixed(2)} recorded.`
          : event.event_type === "work_order.created" &&
              typeof (event.payload as { title?: string } | null)?.title === "string"
            ? `${(event.payload as { title: string }).title} submitted.`
            : event.event_type === "resident.property_assigned" &&
                typeof (event.payload as { displayName?: string } | null)?.displayName === "string"
              ? `${(event.payload as { displayName: string }).displayName} appears on this property.`
              : event.event_type === "lease.activated" &&
                  typeof (event.payload as { displayName?: string } | null)?.displayName === "string"
                ? `${(event.payload as { displayName: string }).displayName} is fully onboarded.`
                : typeof (event.payload as { name?: string } | null)?.name === "string"
                  ? `${(event.payload as { name: string }).name} is ready for operations.`
                  : "Property lifecycle event",
      occurredAt: event.created_at as string,
      kind: event.event_type as string
    })),
    maintenance: {
      openCount: maintenanceSummary.openWorkOrders.length,
      emergencyCount: maintenanceSummary.emergencyRequests.length,
      openWorkOrders: maintenanceSummary.openWorkOrders.slice(0, 8).map((row) => ({
        id: row.id as string,
        title: row.title as string,
        status: row.status as string,
        priority: row.priority as string,
        assigneeType: row.assignee_type as string,
        vendorName:
          (Array.isArray(row.vendor_vendors)
            ? row.vendor_vendors[0]?.name
            : (row.vendor_vendors as { name?: string } | null)?.name) ?? null
      })),
      recentlyCompleted: maintenanceSummary.recentlyCompleted.slice(0, 5).map((row) => ({
        id: row.id as string,
        title: row.title as string,
        status: row.status as string
      }))
    },
    assistantRecommendation: propertyClosedMaintenance || orgMaintenance.maintenanceReady
      ? buildMaintenanceReadyAssistantCopy()
      : hasCollectedRent
        ? buildRentReadyAssistantCopy()
        : hasActiveLease
          ? "Collect your first rent."
          : hasResidents
            ? "Create your first lease."
            : buildPropertyReadyAssistantCopy(property.name),
    readyMessage: propertyClosedMaintenance || orgMaintenance.maintenanceReady
      ? "My maintenance operation is working."
      : hasCollectedRent
        ? "My first rent has been collected."
        : hasActiveLease
          ? "My resident is fully onboarded."
          : hasResidents
            ? "My first resident has been added."
            : "My property is ready.",
    nextJourney:
      propertyClosedMaintenance || orgMaintenance.maintenanceReady
        ? {
            title: "Review today's operations.",
            href: "/pm/mission-control",
            detail: "Maintenance is working — review today's operations."
          }
        : hasCollectedRent
          ? {
              title: "Review your maintenance queue",
              href: "/pm/maintenance",
              detail: "Open Maintenance to triage resident requests from the portal."
            }
          : hasActiveLease
            ? {
                title: "Collect your first rent",
                href: "/pm/financial-operations#collect",
                detail: "Financial Operations is ready for the first collection."
              }
            : hasResidents
              ? {
                  title: "Create your first lease",
                  href: "/pm/leasing?new=1",
                  detail: "Continue the resident lifecycle with a lease."
                }
              : {
                  title: "Add your first resident",
                  href: "/pm/residents?new=1",
                  detail: "Assign a resident to a unit on this property."
                }
  };
}
