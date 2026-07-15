import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Button, Card } from "@mpa/ui";
import { Breadcrumbs } from "../../../../components/shell/breadcrumbs";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { getPropertiesForOrganization } from "../../../../lib/property/server";
import { getUnitForOrganization } from "../../../../lib/unit/server";
import { toUnitOccupancyLabel, toUnitStatusLabel } from "../../../../lib/unit/contracts";

export default async function UnitDetailPage({ params }: { params: Promise<{ unitId: string }> }) {
  const { unitId } = await params;
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

  return (
    <main className="mpa-page flex-1 space-y-5">
      <Breadcrumbs
        items={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/units", label: "Units" },
          { label: unit.unitNumber }
        ]}
      />
      <Card className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
              Unit {unit.unitNumber}
            </h1>
            <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">{propertyName}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={unit.occupancyStatus === "occupied" ? "success" : "warning"}>
              {toUnitOccupancyLabel(unit.occupancyStatus)}
            </Badge>
            <Badge variant={unit.status === "active" ? "success" : "info"}>{toUnitStatusLabel(unit.status)}</Badge>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Availability" value={availability} />
          <MetricCard label="Occupancy" value={toUnitOccupancyLabel(unit.occupancyStatus)} />
          <MetricCard label="Status" value={toUnitStatusLabel(unit.status)} />
          <MetricCard
            label="Assigned Tenant"
            value={
              assignedTenant
                ? assignedTenant.preferred_name || `${assignedTenant.first_name} ${assignedTenant.last_name}`
                : "Not assigned"
            }
          />
        </div>
        <div className="grid gap-2 text-sm text-[var(--mpa-color-text-secondary)] md:grid-cols-2">
          <p>Label: {unit.unitLabel ?? "—"}</p>
          <p>Floor: {unit.floor ?? "—"}</p>
          <p>Bedrooms: {unit.bedrooms ?? "—"}</p>
          <p>Bathrooms: {unit.bathrooms ?? "—"}</p>
          <p>Square Feet: {unit.squareFeet ?? "—"}</p>
          <p>
            Rent:{" "}
            {unit.rentAmount !== null
              ? new Intl.NumberFormat("en-US", { style: "currency", currency: unit.currencyCode }).format(unit.rentAmount)
              : "—"}
          </p>
          <p>
            Deposit:{" "}
            {unit.depositAmount !== null
              ? new Intl.NumberFormat("en-US", { style: "currency", currency: unit.currencyCode }).format(
                  unit.depositAmount
                )
              : "—"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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
            <Button variant="secondary">View Property</Button>
          </Link>
          <Link href="/units">
            <Button variant="ghost">Back to Units</Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-muted)] p-3">
      <p className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--mpa-color-text-primary)]">{value}</p>
    </div>
  );
}
