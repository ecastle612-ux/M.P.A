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
