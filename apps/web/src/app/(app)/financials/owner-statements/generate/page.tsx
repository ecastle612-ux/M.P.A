import { redirect } from "next/navigation";
import { Breadcrumbs } from "../../../../../components/shell/breadcrumbs";
import { GenerateStatementForm } from "../../../../../components/financial/generate-statement-form";
import { createAuthServerComponentClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { fetchAuthedApi } from "../../../../../lib/financial/server-fetch";

export default async function GenerateOwnerStatementPage({
  searchParams
}: {
  searchParams: Promise<{ propertyId?: string }>;
}) {
  const { propertyId } = await searchParams;
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
  if (!evaluatePermission(authorization, "financial:create")) {
    redirect("/unauthorized");
  }

  const propertiesResult = await fetchAuthedApi<{ items: Array<{ id: string; name: string }> }>("/api/properties");
  const properties = propertiesResult.ok ? propertiesResult.data.items : [];

  return (
    <main className="mpa-page flex-1 space-y-5">
      <Breadcrumbs
        items={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/financials", label: "Financials" },
          { href: "/financials/owner-statements", label: "Owner Statements" },
          { label: "Generate" }
        ]}
      />
      <GenerateStatementForm
        properties={properties.map((property) => ({ id: property.id, name: property.name }))}
        initialPropertyId={propertyId ?? null}
      />
    </main>
  );
}
