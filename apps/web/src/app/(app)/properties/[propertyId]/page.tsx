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
          <Link href="/properties">
            <Button variant="ghost">Back to Properties</Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}
