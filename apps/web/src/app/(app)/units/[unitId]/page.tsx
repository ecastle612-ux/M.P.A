import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Button, Card, DetailHero, DetailMetric } from "@mpa/ui";
import { AppPage } from "../../../../components/presentation/app-page";
import { WorkflowSuccessBanner } from "../../../../components/workflow/workflow-success-banner";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { getPropertiesForOrganization } from "../../../../lib/property/server";
import { getUnitForOrganization } from "../../../../lib/unit/server";
import { toUnitOccupancyLabel, toUnitStatusLabel } from "../../../../lib/unit/contracts";
import { getPortfolioCounts } from "../../../../lib/workflow/server/portfolio-counts";
import { buildUnitCreatedSuccess } from "../../../../lib/workflow/shared/success-configs";

export default async function UnitDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ unitId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { unitId } = await params;
  const { from } = await searchParams;
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
  if (!evaluatePermission(authorization, "unit:read")) {
    redirect("/unauthorized");
  }

  const unit = await getUnitForOrganization(organizationId, unitId);
  if (!unit) {
    redirect("/units");
  }

  const properties = await getPropertiesForOrganization(organizationId);
  const propertyName = properties.find((property) => property.id === unit.propertyId)?.name ?? "Unknown property";
  const canUpdateUnit = evaluatePermission(authorization, "unit:update");
  const canReadTenant = evaluatePermission(authorization, "tenant:read");
  const canCreateTenant = evaluatePermission(authorization, "tenant:create");

  const { data: assignedTenant, error: assignedTenantError } = canReadTenant
    ? await supabase
        .from("tenants")
        .select("id, first_name, last_name, preferred_name, status, move_in_date, move_out_date")
        .eq("organization_id", organizationId)
        .eq("unit_id", unit.id)
        .is("deleted_at", null)
        .eq("status", "active")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null, error: null };
  if (assignedTenantError) {
    throw new Error(assignedTenantError.message);
  }
  const availability =
    unit.status !== "active"
      ? "Unavailable"
      : unit.occupancyStatus === "occupied"
        ? "Occupied"
        : unit.occupancyStatus === "vacant_ready"
          ? "Ready for move-in"
          : unit.occupancyStatus === "vacant_not_ready"
            ? "Needs turnover"
            : unit.occupancyStatus === "notice"
              ? "Notice period"
              : "Offline";

  const assignedTenantName = assignedTenant
    ? assignedTenant.preferred_name || `${assignedTenant.first_name} ${assignedTenant.last_name}`
    : "Not assigned";

  const rentLabel =
    unit.rentAmount !== null
      ? new Intl.NumberFormat("en-US", { style: "currency", currency: unit.currencyCode }).format(unit.rentAmount)
      : "—";

  const portfolioCounts = from === "unit-created" ? await getPortfolioCounts(organizationId) : null;
  const unitSuccess =
    from === "unit-created" && portfolioCounts
      ? buildUnitCreatedSuccess(
          { id: unit.id, unitNumber: unit.unitNumber, propertyId: unit.propertyId },
          propertyName,
          portfolioCounts
        )
      : null;

  return (
    <AppPage
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/units", label: "Units" },
        { label: unit.unitNumber }
      ]}
    >
      {unitSuccess ? <WorkflowSuccessBanner dismissPath={`/units/${unitId}`} {...unitSuccess} /> : null}

      <DetailHero
        title={`Unit ${unit.unitNumber}`}
        subtitle={propertyName}
        badges={
          <>
            <Badge variant={unit.occupancyStatus === "occupied" ? "success" : "warning"}>
              {toUnitOccupancyLabel(unit.occupancyStatus)}
            </Badge>
            <Badge variant={unit.status === "active" ? "success" : "info"}>{toUnitStatusLabel(unit.status)}</Badge>
          </>
        }
        metrics={
          <>
            <DetailMetric label="Availability" value={availability} />
            <DetailMetric label="Occupancy" value={toUnitOccupancyLabel(unit.occupancyStatus)} />
            <DetailMetric label="Status" value={toUnitStatusLabel(unit.status)} />
            <DetailMetric label="Assigned tenant" value={assignedTenantName} />
            <DetailMetric label="Rent" value={rentLabel} />
          </>
        }
        actions={
          <>
            {canUpdateUnit ? (
              <Link href={`/units/${unit.id}/edit`}>
                <Button>Edit Unit</Button>
              </Link>
            ) : null}
            {canCreateTenant ? (
              <Link href={`/tenants/new?propertyId=${unit.propertyId}&unitId=${unit.id}`}>
                <Button variant="secondary">Assign Tenant</Button>
              </Link>
            ) : null}
            {assignedTenant && canReadTenant ? (
              <Link href={`/tenants/${assignedTenant.id}`}>
                <Button variant="secondary">View Tenant</Button>
              </Link>
            ) : null}
            <Link href={`/properties/${unit.propertyId}`}>
              <Button variant="ghost">View Property</Button>
            </Link>
          </>
        }
      />

      <Card variant="elevated" className="space-y-4">
        <h2 className="mpa-section-title">Unit details</h2>
        <div className="grid gap-3 text-sm text-[var(--mpa-color-text-secondary)] md:grid-cols-2">
          <p>Label: {unit.unitLabel ?? "—"}</p>
          <p>Floor: {unit.floor ?? "—"}</p>
          <p>Bedrooms: {unit.bedrooms ?? "—"}</p>
          <p>Bathrooms: {unit.bathrooms ?? "—"}</p>
          <p>Square Feet: {unit.squareFeet ?? "—"}</p>
          <p>
            Deposit:{" "}
            {unit.depositAmount !== null
              ? new Intl.NumberFormat("en-US", { style: "currency", currency: unit.currencyCode }).format(
                  unit.depositAmount
                )
              : "—"}
          </p>
        </div>
        <div>
          <Link href="/units">
            <Button variant="ghost">Back to Units</Button>
          </Link>
        </div>
      </Card>
    </AppPage>
  );
}
