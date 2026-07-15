import Link from "next/link";
import { redirect } from "next/navigation";
import { Button, Card } from "@mpa/ui";
import { Breadcrumbs } from "../../../../components/shell/breadcrumbs";
import { UnitForm } from "../../../../components/unit/unit-form";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { getPropertiesForOrganization } from "../../../../lib/property/server";

export default async function NewUnitPage({
  searchParams
}: {
  searchParams: Promise<{ propertyId?: string; from?: string }>;
}) {
  const { propertyId, from } = await searchParams;
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
  if (!evaluatePermission(authorization, "unit:create")) {
    redirect("/unauthorized");
  }
  const canCreateProperty = evaluatePermission(authorization, "property:create");

  const properties = await getPropertiesForOrganization(organizationId);
  const propertyOptions = properties.map((property) => ({ id: property.id, name: property.name }));
  if (propertyOptions.length === 0) {
    return (
      <main className="mpa-page flex-1 space-y-5">
        <Breadcrumbs
          items={[
            { href: "/dashboard", label: "Dashboard" },
            { href: "/units", label: "Units" },
            { label: "Create" }
          ]}
        />
        <Card className="space-y-3">
          <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">Create Unit</h1>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Add at least one property before creating units.
          </p>
          {canCreateProperty ? (
            <Link href="/properties/new">
              <Button>Create Property</Button>
            </Link>
          ) : null}
        </Card>
      </main>
    );
  }

  return (
    <main className="mpa-page flex-1 space-y-5">
      <Breadcrumbs
        items={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/units", label: "Units" },
          { label: "Create" }
        ]}
      />
      {from === "property-created" ? (
        <Card className="border-[var(--mpa-color-brand-primary)] bg-[var(--mpa-color-bg-surface-muted)]">
          <p className="text-sm text-[var(--mpa-color-text-primary)]">
            Property saved. Continue the workflow by adding your first unit.
          </p>
        </Card>
      ) : null}
      <UnitForm mode="create" properties={propertyOptions} initialPropertyId={propertyId ?? null} />
    </main>
  );
}
