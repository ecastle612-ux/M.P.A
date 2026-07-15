import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Button, Card } from "@mpa/ui";
import { Breadcrumbs } from "../../../../components/shell/breadcrumbs";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { getPropertyForOrganization } from "../../../../lib/property/server";
import { toPropertyStatusLabel, toPropertyTypeLabel } from "../../../../lib/property/contracts";

export default async function PropertyDetailPage({ params }: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = await params;
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
  const canUpdateProperty = evaluatePermission(authorization, "property:update");
  const canCreateUnit = evaluatePermission(authorization, "unit:create");
  const canReadTenant = evaluatePermission(authorization, "tenant:read");
  const canCreateTenant = evaluatePermission(authorization, "tenant:create");

  const [
    { count: unitsTotal, error: unitsTotalError },
    { count: occupiedUnits, error: occupiedUnitsError },
    { count: vacancyUnits, error: vacancyUnitsError },
    { count: tenantCount, error: tenantCountError },
    { data: unitActivity, error: unitActivityError },
    { data: tenantActivity, error: tenantActivityError }
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
      : Promise.resolve({ data: [], error: null })
  ]);

  if (unitsTotalError || occupiedUnitsError || vacancyUnitsError || tenantCountError || unitActivityError || tenantActivityError) {
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
      updatedAt: item.updated_at
    }))
  ]
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, 6);

  return (
    <main className="mpa-page flex-1 space-y-5">
      <Breadcrumbs
        items={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/properties", label: "Properties" },
          { label: property.name }
        ]}
      />
      <Card className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">{property.name}</h1>
            <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
              {property.addressLine1}, {property.city}, {property.stateRegion} {property.postalCode}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={property.status === "active" ? "success" : "info"}>
              {toPropertyStatusLabel(property.status)}
            </Badge>
            <Badge variant="neutral">{toPropertyTypeLabel(property.propertyType)}</Badge>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Unit Count" value={(unitsTotal ?? 0).toString()} />
          <MetricCard label="Occupied" value={(occupiedUnits ?? 0).toString()} />
          <MetricCard label="Vacancies" value={(vacancyUnits ?? 0).toString()} />
          <MetricCard label="Tenants" value={(tenantCount ?? 0).toString()} />
          <MetricCard label="Occupancy" value={`${occupancyRate}%`} />
        </div>
        {property.description ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">{property.description}</p>
        ) : (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">No description added.</p>
        )}
        <div className="grid gap-2 text-sm text-[var(--mpa-color-text-secondary)] md:grid-cols-2">
          <p>Code: {property.code ?? "—"}</p>
          <p>Timezone: {property.timezone ?? "—"}</p>
          <p>Ownership Entity: {property.ownershipEntityName ?? "—"}</p>
          <p>Owner Contact: {property.ownerContactName ?? "—"}</p>
          <p>Email: {property.ownerContactEmail ?? "—"}</p>
          <p>Phone: {property.ownerContactPhone ?? "—"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canUpdateProperty ? (
            <Link href={`/properties/${property.id}/edit`}>
              <Button>Edit Property</Button>
            </Link>
          ) : null}
          {canCreateUnit ? (
            <Link href={`/units/new?propertyId=${property.id}`}>
              <Button variant="secondary">Create Unit</Button>
            </Link>
          ) : null}
          {canCreateTenant ? (
            <Link href={`/tenants/new?propertyId=${property.id}`}>
              <Button variant="ghost">Assign Tenant</Button>
            </Link>
          ) : null}
          <Link href="/properties">
            <Button variant="ghost">Back to Properties</Button>
          </Link>
        </div>
      </Card>
      <Card className="space-y-3">
        <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Recent activity</h2>
        {activity.length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Activity appears after unit or tenant updates for this property.
          </p>
        ) : (
          <ul className="space-y-2">
            {activity.map((item) => (
              <li key={item.id} className="rounded-md border border-[var(--mpa-color-border-default)] p-2">
                <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{item.label}</p>
                <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                  {item.detail} updated {formatDate(item.updatedAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-muted)] p-3">
      <p className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">{label}</p>
      <p className="mt-1 text-xl font-semibold text-[var(--mpa-color-text-primary)]">{value}</p>
    </div>
  );
}

function formatDate(value: string): string {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return "recently";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(parsed);
}
