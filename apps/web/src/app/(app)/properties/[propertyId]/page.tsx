import { redirect } from "next/navigation";
import { Badge, Card, DetailHero, DetailMetric } from "@mpa/ui";
import { AiPageContextBridge, buildAiPageContext } from "../../../../components/ai/ai-page-context";
import { DetailPageLayout } from "../../../../components/presentation/detail-page-layout";
import { DiscloseSection } from "../../../../components/presentation/disclose-section";
import { EntityActionToolbelt } from "../../../../components/presentation/entity-action-toolbelt";
import { EntityRelationshipChain } from "../../../../components/presentation/entity-relationship-chain";
import { PropertyContextRail } from "../../../../components/presentation/context-rails/property-context-rail";
import { WorkflowSuccessBanner } from "../../../../components/workflow/workflow-success-banner";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { getPropertyForOrganization } from "../../../../lib/property/server";
import { getBuildingQrForProperty } from "../../../../lib/communication/server";
import { PropertyQrPanel } from "../../../../components/communication/property-qr-panel";
import { PropertyFinancialPanel } from "../../../../components/financial/property-financial-panel";
import { RepairHistoryPanel } from "../../../../components/facility/repair-history-panel";
import { PropertyTimeline } from "../../../../components/facility/property-timeline";
import { PropertyOverviewPanels } from "../../../../components/facility/property-overview-panels";
import { RepairHistoryFilters } from "../../../../components/facility/repair-history-filters";
import { AssetsPanel } from "../../../../components/facility/assets-panel";
import { toPropertyStatusLabel, toPropertyTypeLabel } from "../../../../lib/property/contracts";
import { getPropertyFinancialSummary } from "../../../../lib/financial/server";
import { isTimelineFilter } from "../../../../lib/facility/contracts";
import { listFacilityAssets } from "../../../../lib/facility/asset-server";
import { listFacilityRecords } from "../../../../lib/facility/server";
import { listFacilityTimelineEvents } from "../../../../lib/facility/timeline";
import { getVaultDocumentsForEntity } from "../../../../lib/vault/server";
import { getPortfolioCounts } from "../../../../lib/workflow/server/portfolio-counts";
import { buildPropertyCreatedSuccess } from "../../../../lib/workflow/shared/success-configs";

export default async function PropertyDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ propertyId: string }>;
  searchParams: Promise<{
    from?: string;
    q?: string;
    vendorId?: string;
    unitId?: string;
    tlFilter?: string;
    tlQ?: string;
  }>;
}) {
  const { propertyId } = await params;
  const { from, q, vendorId, unitId, tlFilter, tlQ } = await searchParams;
  const timelineFilter = isTimelineFilter(tlFilter) ? tlFilter : "all";
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) {
    redirect("/dashboard");
  }
  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "property:read")) {
    redirect("/unauthorized");
  }

  const property = await getPropertyForOrganization(organizationId, propertyId);
  if (!property) {
    redirect("/properties");
  }
  const qrCode =
    evaluatePermission(authorization, "communication:read")
      ? await getBuildingQrForProperty(organizationId, propertyId, supabase)
      : null;
  const canUpdateProperty = evaluatePermission(authorization, "property:update");
  const canCreateUnit = evaluatePermission(authorization, "unit:create");
  const canReadTenant = evaluatePermission(authorization, "tenant:read");
  const canCreateTenant = evaluatePermission(authorization, "tenant:create");
  const canReadFinancials = evaluatePermission(authorization, "financial:read");
  const canReadMaintenance = evaluatePermission(authorization, "maintenance:read");
  const canCreateMaintenance = evaluatePermission(authorization, "maintenance:create");
  const propertyFinancialSummary = canReadFinancials
    ? await getPropertyFinancialSummary(organizationId, propertyId, supabase)
    : null;
  const [repairHistory, propertyTimeline, propertyAssets, propertyUnits, vendorFilterRows, propertyDocuments] =
    canReadMaintenance
      ? await Promise.all([
          listFacilityRecords(
            organizationId,
            {
              propertyId,
              search: q,
              vendorId,
              unitId,
              limit: 50
            },
            supabase
          ),
          listFacilityTimelineEvents(
            organizationId,
            {
              propertyId,
              filter: timelineFilter,
              search: tlQ,
              limit: 40
            },
            supabase
          ),
          listFacilityAssets(organizationId, { propertyId, limit: 100 }, supabase),
          supabase
            .from("units")
            .select("id, unit_number")
            .eq("organization_id", organizationId)
            .eq("property_id", propertyId)
            .is("deleted_at", null)
            .order("unit_number", { ascending: true }),
          supabase
            .from("facility_records")
            .select("legacy_vendor_id, service_provider_display_name")
            .eq("organization_id", organizationId)
            .eq("property_id", propertyId)
            .eq("status", "active")
            .not("legacy_vendor_id", "is", null),
          getVaultDocumentsForEntity(organizationId, "property", propertyId, supabase)
        ])
      : [
          [],
          [],
          [],
          { data: [] as Array<{ id: string; unit_number: string }> },
          {
            data: [] as Array<{
              legacy_vendor_id: string | null;
              service_provider_display_name: string | null;
            }>
          },
          []
        ];
  const unitOptions = ((propertyUnits.data ?? []) as Array<{ id: string; unit_number: string }>).map(
    (unit) => ({ id: unit.id, label: `Unit ${unit.unit_number}` })
  );
  const vendorOptions = Array.from(
    new Map(
      (
        (vendorFilterRows.data ?? []) as Array<{
          legacy_vendor_id: string | null;
          service_provider_display_name: string | null;
        }>
      )
        .filter((row) => row.legacy_vendor_id)
        .map((row) => [
          row.legacy_vendor_id as string,
          {
            id: row.legacy_vendor_id as string,
            label: row.service_provider_display_name ?? "Vendor"
          }
        ])
    ).values()
  );
  const portfolioCounts = from === "property-created" ? await getPortfolioCounts(organizationId) : null;
  const propertySuccess =
    from === "property-created" && portfolioCounts
      ? buildPropertyCreatedSuccess({ id: property.id, name: property.name }, portfolioCounts)
      : null;

  const [
    { count: unitsTotal, error: unitsTotalError },
    { count: occupiedUnits, error: occupiedUnitsError },
    { count: vacancyUnits, error: vacancyUnitsError },
    { count: tenantCount, error: tenantCountError },
    { data: unitActivity, error: unitActivityError },
    { data: tenantActivity, error: tenantActivityError },
    { data: activeLeaseRows, error: activeLeasesError },
    { data: openMaintenanceRows, error: openMaintenanceError },
    { data: vendorWorkOrders, error: vendorWorkOrdersError }
  ] = await Promise.all([
    supabase
      .from("units")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("property_id", property.id)
      .is("deleted_at", null),
    supabase
      .from("units")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("property_id", property.id)
      .is("deleted_at", null)
      .eq("status", "active")
      .eq("occupancy_status", "occupied"),
    supabase
      .from("units")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("property_id", property.id)
      .is("deleted_at", null)
      .eq("status", "active")
      .in("occupancy_status", ["vacant_ready", "vacant_not_ready"]),
    canReadTenant
      ? supabase
          .from("tenants")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organizationId)
          .eq("property_id", property.id)
          .is("deleted_at", null)
          .neq("status", "archived")
      : Promise.resolve({ count: 0, error: null }),
    supabase
      .from("units")
      .select("id, unit_number, status, occupancy_status, updated_at")
      .eq("organization_id", organizationId)
      .eq("property_id", property.id)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(5),
    canReadTenant
      ? supabase
          .from("tenants")
          .select("id, first_name, last_name, preferred_name, status, updated_at")
          .eq("organization_id", organizationId)
          .eq("property_id", property.id)
          .is("deleted_at", null)
          .order("updated_at", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("leases")
      .select("id, lease_number, tenants:primary_tenant_id(first_name, last_name, preferred_name)")
      .eq("organization_id", organizationId)
      .eq("property_id", property.id)
      .eq("status", "active")
      .is("deleted_at", null)
      .order("end_date", { ascending: true })
      .limit(5),
    supabase
      .from("maintenance_work_orders")
      .select("id, work_order_number, title, priority")
      .eq("organization_id", organizationId)
      .eq("property_id", property.id)
      .is("deleted_at", null)
      .not("status", "in", '("completed","cancelled")')
      .order("due_date", { ascending: true })
      .limit(5),
    supabase
      .from("maintenance_work_orders")
      .select("vendor_id")
      .eq("organization_id", organizationId)
      .eq("property_id", property.id)
      .is("deleted_at", null)
      .not("vendor_id", "is", null)
  ]);

  if (
    unitsTotalError ||
    occupiedUnitsError ||
    vacancyUnitsError ||
    tenantCountError ||
    unitActivityError ||
    tenantActivityError ||
    activeLeasesError ||
    openMaintenanceError ||
    vendorWorkOrdersError
  ) {
    throw new Error("Unable to load property operational snapshot.");
  }
  const occupancyRate = (unitsTotal ?? 0) === 0 ? 0 : Math.round(((occupiedUnits ?? 0) / (unitsTotal ?? 0)) * 100);

  const activity = [
    ...((unitActivity ?? []) as Array<{
      id: string;
      unit_number: string;
      status: string;
      occupancy_status: string;
      updated_at: string;
    }>).map((item) => ({
      id: `unit:${item.id}`,
      label: `Unit ${item.unit_number}`,
      detail: `${item.status} • ${item.occupancy_status.replaceAll("_", " ")}`,
      href: `/units/${item.id}`,
      updatedAt: item.updated_at
    })),
    ...((tenantActivity ?? []) as Array<{
      id: string;
      first_name: string;
      last_name: string;
      preferred_name: string | null;
      status: string;
      updated_at: string;
    }>).map((item) => ({
      id: `tenant:${item.id}`,
      label: item.preferred_name || `${item.first_name} ${item.last_name}`,
      detail: `Tenant • ${item.status}`,
      href: `/tenants/${item.id}`,
      updatedAt: item.updated_at
    }))
  ]
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, 6);

  const activeLeases = (
    (activeLeaseRows ?? []) as Array<{
      id: string;
      lease_number: string;
      tenants: { first_name: string; last_name: string; preferred_name: string | null } | null;
    }>
  ).map((row) => ({
    id: row.id,
    leaseNumber: row.lease_number,
    tenantName: row.tenants
      ? row.tenants.preferred_name || `${row.tenants.first_name} ${row.tenants.last_name}`
      : null
  }));

  const openMaintenance = (
    (openMaintenanceRows ?? []) as Array<{
      id: string;
      work_order_number: string;
      title: string;
      priority: string;
    }>
  ).map((row) => ({
    id: row.id,
    workOrderNumber: row.work_order_number,
    title: row.title,
    priority: row.priority
  }));

  const vendorCount = new Set(
    ((vendorWorkOrders ?? []) as Array<{ vendor_id: string | null }>)
      .map((row) => row.vendor_id)
      .filter(Boolean)
  ).size;

  const propertyAttention =
    openMaintenance.length > 0
      ? `${openMaintenance.length} open work order${openMaintenance.length === 1 ? "" : "s"}`
      : (vacancyUnits ?? 0) > 0
        ? `${vacancyUnits} vacant unit${vacancyUnits === 1 ? "" : "s"}`
        : "Portfolio looks steady — use actions below for the next task.";

  const toolbeltPrimary = [
    canCreateUnit
      ? {
          id: "add-unit",
          label: "Add Unit",
          href: `/units/new?propertyId=${property.id}`,
          variant: "primary" as const
        }
      : null,
    canCreateTenant
      ? {
          id: "add-resident",
          label: "Add Resident",
          href: `/residents/move-in?propertyId=${encodeURIComponent(property.id)}`,
          variant: "secondary" as const
        }
      : null,
    canCreateMaintenance
      ? {
          id: "inspection-wo",
          label: "Work Order",
          href: `/maintenance/new?propertyId=${encodeURIComponent(property.id)}`,
          variant: "secondary" as const
        }
      : null,
    canReadFinancials
      ? {
          id: "report",
          label: "Report",
          href: `/financials/reports?propertyId=${encodeURIComponent(property.id)}`,
          variant: "secondary" as const
        }
      : null
  ].filter(Boolean) as Array<{
    id: string;
    label: string;
    href: string;
    variant: "primary" | "secondary" | "ghost";
  }>;

  const toolbeltMore = [
    canUpdateProperty
      ? { id: "edit", label: "Edit property", href: `/properties/${property.id}/edit` }
      : null,
    canReadMaintenance
      ? { id: "maintenance-list", label: "View maintenance", href: `/maintenance?propertyId=${property.id}` }
      : null,
    { id: "back", label: "Back to properties", href: "/properties" }
  ].filter(Boolean) as Array<{ id: string; label: string; href: string }>;

  return (
    <>
      <AiPageContextBridge
        {...buildAiPageContext({
          entityType: "property",
          entityId: property.id,
          entityLabel: property.name
        })}
      />
      <DetailPageLayout
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/properties", label: "Properties" },
        { label: property.name }
      ]}
      banner={
        propertySuccess ? (
          <WorkflowSuccessBanner dismissPath={`/properties/${propertyId}`} {...propertySuccess} />
        ) : null
      }
      relationshipChain={
        <EntityRelationshipChain
          links={[
            { href: "/properties", label: "Properties" },
            { label: property.name },
            { label: `${unitsTotal ?? 0} units` }
          ]}
        />
      }
      hero={
        <DetailHero
          title={property.name}
          subtitle={`${property.addressLine1}, ${property.city}, ${property.stateRegion} ${property.postalCode}`}
          attention={propertyAttention}
          badges={
            <>
              <Badge showDot variant={property.status === "active" ? "success" : "info"}>
                {toPropertyStatusLabel(property.status)}
              </Badge>
              <Badge variant="neutral">{toPropertyTypeLabel(property.propertyType)}</Badge>
            </>
          }
          metrics={
            <>
              <DetailMetric label="Unit count" value={(unitsTotal ?? 0).toString()} />
              <DetailMetric label="Occupied" value={(occupiedUnits ?? 0).toString()} />
              <DetailMetric label="Vacancies" value={(vacancyUnits ?? 0).toString()} />
              <DetailMetric label="Tenants" value={(tenantCount ?? 0).toString()} />
              <DetailMetric label="Occupancy" value={`${occupancyRate}%`} />
            </>
          }
        />
      }
      toolbelt={<EntityActionToolbelt actions={toolbeltPrimary} moreActions={toolbeltMore} />}
      main={
        <>
          <Card variant="elevated" className="space-y-3">
            {property.description ? (
              <p className="text-sm leading-snug text-[var(--mpa-color-text-secondary)]">{property.description}</p>
            ) : (
              <p className="text-sm text-[var(--mpa-color-text-muted)]">No description added.</p>
            )}
            <div className="grid gap-x-4 gap-y-1.5 text-sm text-[var(--mpa-color-text-secondary)] md:grid-cols-2 lg:grid-cols-3">
              <p>Code: {property.code ?? "—"}</p>
              <p>Timezone: {property.timezone ?? "—"}</p>
              <p>Ownership entity: {property.ownershipEntityName ?? "—"}</p>
              <p>Owner contact: {property.ownerContactName ?? "—"}</p>
              <p>Email: {property.ownerContactEmail ?? "—"}</p>
              <p>Phone: {property.ownerContactPhone ?? "—"}</p>
            </div>
          </Card>

          <PropertyFinancialPanel
            summary={propertyFinancialSummary}
            canReadFinancials={canReadFinancials}
            propertyId={property.id}
          />

          {canReadMaintenance ? (
            <>
              <PropertyOverviewPanels
                recentRepairs={repairHistory}
                recentTimeline={propertyTimeline}
                recentDocuments={propertyDocuments}
                propertyId={property.id}
              />
              <DiscloseSection
                id="repair-history"
                title="Repair history & filters"
                description="Full facility records — expand when you need history, not every visit."
              >
                <RepairHistoryFilters
                  vendorOptions={vendorOptions}
                  unitOptions={unitOptions}
                  initialSearch={q ?? ""}
                  initialVendorId={vendorId ?? ""}
                  initialUnitId={unitId ?? ""}
                />
                <RepairHistoryPanel
                  title="Repair history"
                  description="Permanent facility records for this property, newest first."
                  records={repairHistory}
                  emptyLabel="No completed repairs yet. Completing a work order creates permanent history here."
                />
              </DiscloseSection>
              <DiscloseSection
                title="Assets"
                description="Building systems and equipment linked to this property."
              >
                <AssetsPanel
                  propertyId={property.id}
                  assets={propertyAssets}
                  units={((propertyUnits.data ?? []) as Array<{ id: string; unit_number: string }>).map(
                    (unit) => ({ id: unit.id, unitNumber: unit.unit_number })
                  )}
                  canCreate={evaluatePermission(authorization, "maintenance:update")}
                />
              </DiscloseSection>
              <DiscloseSection
                title="Property timeline"
                description="Activity across units, residents, and maintenance."
              >
                <PropertyTimeline
                  events={propertyTimeline}
                  propertyName={property.name}
                  initialFilter={timelineFilter}
                  initialSearch={tlQ ?? ""}
                />
              </DiscloseSection>
            </>
          ) : null}

          {qrCode ? (
            <DiscloseSection title="Building QR" description="Enrollment and posting tools for this property.">
              <PropertyQrPanel propertyId={property.id} propertyName={property.name} qrCode={qrCode} />
            </DiscloseSection>
          ) : null}
        </>
      }
      contextRail={
        <PropertyContextRail
          occupancyRate={occupancyRate}
          unitsTotal={unitsTotal ?? 0}
          occupiedUnits={occupiedUnits ?? 0}
          vacancyUnits={vacancyUnits ?? 0}
          tenantCount={tenantCount ?? 0}
          activeLeases={activeLeases}
          openMaintenance={openMaintenance}
          vendorCount={vendorCount}
          activity={activity.map(({ id, label, detail, href }) => ({ id, label, detail, href }))}
          financialSummary={propertyFinancialSummary}
          canReadFinancials={canReadFinancials}
        />
      }
    />
    </>
  );
}
