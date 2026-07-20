import { redirect } from "next/navigation";
import { CreatePageLayout } from "../../../../components/presentation/create-page-layout";
import { CreateFormContextRail } from "../../../../components/presentation/create-form-context-rail";
import { LeaseForm } from "../../../../components/lease/lease-form";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { getPropertiesForOrganization } from "../../../../lib/property/server";
import { getUnitsForOrganization } from "../../../../lib/unit/server";
import { getApplicantForOrganization } from "../../../../lib/applicant/server";
import { getTenantsForOrganization } from "../../../../lib/tenant/server";

export default async function NewLeasePage({
  searchParams
}: {
  searchParams: Promise<{ propertyId?: string; unitId?: string; tenantId?: string; applicantId?: string; screeningCaseId?: string }>;
}) {
  const params = await searchParams;
  const { screeningCaseId, applicantId } = params;
  let { propertyId, unitId, tenantId } = params;
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
  if (!evaluatePermission(authorization, "lease:create")) {
    redirect("/unauthorized");
  }

  if (applicantId && (!propertyId || !unitId || !tenantId)) {
    const applicant = await getApplicantForOrganization(organizationId, applicantId, supabase);
    if (applicant) {
      propertyId = propertyId ?? applicant.propertyId ?? undefined;
      unitId = unitId ?? applicant.unitId ?? undefined;
      tenantId = tenantId ?? applicant.tenantId ?? undefined;
    }
  }

  const [properties, units, tenants] = await Promise.all([
    getPropertiesForOrganization(organizationId),
    getUnitsForOrganization(organizationId),
    getTenantsForOrganization(organizationId)
  ]);

  const selectedTenant = tenantId ? tenants.find((tenant) => tenant.id === tenantId) : null;

  return (
    <CreatePageLayout
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/leases", label: "Leases" },
        { label: "Advanced" }
      ]}
      banner={
        <div className="rounded-lg border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-muted)] px-4 py-3 text-sm text-[var(--mpa-color-text-secondary)]">
          <p className="font-medium text-[var(--mpa-color-text-primary)]">Advanced / exceptional path</p>
          <p className="mt-1">
            Recommended onboarding uses{" "}
            <a className="font-semibold text-[var(--mpa-color-brand-primary)] underline" href="/residents/move-in">
              guided Move in
            </a>
            . Use this form only when you need a standalone lease record.
          </p>
        </div>
      }
      form={
        <LeaseForm
          mode="create"
          properties={properties.map((property) => ({ id: property.id, name: property.name }))}
          units={units.map((unit) => ({
            id: unit.id,
            propertyId: unit.propertyId,
            unitNumber: unit.unitNumber,
            unitLabel: unit.unitLabel
          }))}
          tenants={tenants.map((tenant) => ({
            id: tenant.id,
            propertyId: tenant.propertyId,
            unitId: tenant.unitId,
            name: tenant.preferredName || `${tenant.firstName} ${tenant.lastName}`
          }))}
          initialPropertyId={propertyId ?? null}
          initialUnitId={unitId ?? null}
          initialTenantId={tenantId ?? null}
          screeningCaseId={screeningCaseId ?? null}
        />
      }
      contextRail={
        <CreateFormContextRail
          module="lease"
          setupSteps={[
            { id: "property", label: "Property linked", complete: Boolean(propertyId) },
            { id: "units", label: "Unit linked", complete: Boolean(unitId) },
            { id: "tenant", label: "Tenant linked", complete: Boolean(tenantId) },
            { id: "lease", label: "Create lease", complete: false }
          ]}
          relatedLinks={[
            ...(selectedTenant
              ? [
                  {
                    label: selectedTenant.preferredName || `${selectedTenant.firstName} ${selectedTenant.lastName}`,
                    href: `/tenants/${selectedTenant.id}`
                  }
                ]
              : []),
            ...(applicantId
              ? [{ label: "Applicant record", href: `/applicants/${applicantId}` }]
              : []),
            { label: "Leases list", href: "/leases" }
          ]}
        />
      }
    />
  );
}
