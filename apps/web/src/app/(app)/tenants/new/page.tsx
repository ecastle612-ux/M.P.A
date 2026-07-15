import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { Breadcrumbs } from "../../../../components/shell/breadcrumbs";
import { TenantForm } from "../../../../components/tenant/tenant-form";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { getPropertiesForOrganization } from "../../../../lib/property/server";
import { getUnitsForOrganization } from "../../../../lib/unit/server";

export default async function NewTenantPage({
  searchParams
}: {
  searchParams: Promise<{ propertyId?: string; unitId?: string; from?: string }>;
}) {
  const { propertyId, unitId, from } = await searchParams;
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
  if (!evaluatePermission(authorization, "tenant:create")) {
    redirect("/unauthorized");
  }

  const [properties, units] = await Promise.all([
    getPropertiesForOrganization(organizationId),
    getUnitsForOrganization(organizationId)
  ]);
  const propertyOptions = properties.map((property) => ({ id: property.id, name: property.name }));
  const unitOptions = units.map((unit) => ({
    id: unit.id,
    propertyId: unit.propertyId,
    unitNumber: unit.unitNumber,
    unitLabel: unit.unitLabel
  }));

  return (
    <main className="mpa-page flex-1 space-y-5">
      <Breadcrumbs
        items={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/tenants", label: "Tenants" },
          { label: "Create" }
        ]}
      />
      {from === "unit-created" ? (
        <Card className="border-[var(--mpa-color-brand-primary)] bg-[var(--mpa-color-bg-surface-muted)]">
          <p className="text-sm text-[var(--mpa-color-text-primary)]">
            Unit saved. Finalize the workflow by assigning a tenant and move-in timeline.
          </p>
        </Card>
      ) : null}
      <TenantForm
        mode="create"
        properties={propertyOptions}
        units={unitOptions}
        initialPropertyId={propertyId ?? null}
        initialUnitId={unitId ?? null}
      />
    </main>
  );
}
