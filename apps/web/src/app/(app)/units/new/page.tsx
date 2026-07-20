import Link from "next/link";
import { redirect } from "next/navigation";
import { Button, Card } from "@mpa/ui";
import { AppPage } from "../../../../components/presentation/app-page";
import { CreatePageLayout } from "../../../../components/presentation/create-page-layout";
import { CreateFormContextRail } from "../../../../components/presentation/create-form-context-rail";
import { CreateUnitWorkspace } from "../../../../components/unit/create-unit-workspace";
import { WorkflowSuccessPanel } from "../../../../components/presentation/workflow-success-panel";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { getPropertiesForOrganization } from "../../../../lib/property/server";
import { buildPropertyCreatedOnUnitFormSuccess } from "../../../../lib/workflow/shared/success-configs";

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
  const preselectedProperty = propertyId ? properties.find((property) => property.id === propertyId) : null;
  const propertyCreatedSuccess =
    from === "property-created" ? buildPropertyCreatedOnUnitFormSuccess(preselectedProperty?.name) : null;

  if (propertyOptions.length === 0) {
    return (
      <AppPage
        breadcrumbs={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/units", label: "Units" },
          { label: "Create" }
        ]}
      >
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
      </AppPage>
    );
  }

  return (
    <CreatePageLayout
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/units", label: "Units" },
        { label: "Create" }
      ]}
      banner={
        propertyCreatedSuccess ? (
          <WorkflowSuccessPanel {...propertyCreatedSuccess} primaryAction={propertyCreatedSuccess.primaryAction} />
        ) : null
      }
      form={
        <div id="unit-form">
          <CreateUnitWorkspace properties={propertyOptions} initialPropertyId={propertyId ?? null} />
        </div>
      }
      contextRail={
        <CreateFormContextRail
          module="unit"
          setupSteps={[
            { id: "property", label: "Property selected", complete: Boolean(propertyId) },
            { id: "units", label: "Create units", complete: false },
            { id: "tenant", label: "Assign tenant", complete: false },
            { id: "lease", label: "Create lease", complete: false }
          ]}
          relatedLinks={[
            ...(preselectedProperty
              ? [{ label: preselectedProperty.name, href: `/properties/${preselectedProperty.id}` }]
              : []),
            { label: "Units list", href: "/units" }
          ]}
        />
      }
    />
  );
}
