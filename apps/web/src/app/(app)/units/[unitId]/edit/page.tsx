import { redirect } from "next/navigation";
import { Breadcrumbs } from "../../../../../components/shell/breadcrumbs";
import { UnitForm } from "../../../../../components/unit/unit-form";
import { createAuthServerComponentClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { getPropertiesForOrganization } from "../../../../../lib/property/server";
import { getUnitForOrganization } from "../../../../../lib/unit/server";

export default async function EditUnitPage({ params }: { params: Promise<{ unitId: string }> }) {
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
  if (!evaluatePermission(authorization, "unit:update")) {
    redirect("/unauthorized");
  }

  const [unit, properties] = await Promise.all([
    getUnitForOrganization(organizationId, unitId),
    getPropertiesForOrganization(organizationId)
  ]);
  if (!unit) {
    redirect("/units");
  }

  const propertyOptions = properties.map((property) => ({ id: property.id, name: property.name }));
  return (
    <main className="mpa-page flex-1 space-y-5">
      <Breadcrumbs
        items={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/units", label: "Units" },
          { href: `/units/${unit.id}`, label: unit.unitNumber },
          { label: "Edit" }
        ]}
      />
      <UnitForm mode="edit" unit={unit} properties={propertyOptions} />
    </main>
  );
}
