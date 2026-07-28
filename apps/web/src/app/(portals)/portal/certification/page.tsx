import { notFound } from "next/navigation";
import { AppPage } from "../../../../components/presentation/app-page";
import {
  OWNER_PORTAL_NAVIGATION,
  TENANT_PORTAL_MOBILE_BOTTOM_NAVIGATION,
  TENANT_PORTAL_NAVIGATION
} from "../../../../components/portal/navigation";
import { RolePortalFrame } from "../../../../components/portal/role-portal-frame";
import { TenantPortalHome } from "../../../../components/portal/tenant-portal-home";
import type { OrganizationSummary } from "../../../../lib/organization/contracts";

type CertificationRole = "tenant" | "owner";

const CERTIFICATION_ORGANIZATIONS: OrganizationSummary[] = [
  {
    id: "dev-certification-org",
    name: "M.P.A. Certification Portfolio",
    slug: "mpa-certification",
    roles: ["tenant", "property_owner"]
  }
];

export default async function PortalCertificationPage({
  searchParams
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const { role: roleParam } = await searchParams;
  const role = resolveCertificationRole(roleParam);

  if (role === "owner") {
    return (
      <RolePortalFrame
        availableRoles={["property_owner"]}
        defaultRole="property_owner"
        organizations={CERTIFICATION_ORGANIZATIONS}
        defaultOrganizationId="dev-certification-org"
        title="Property Owner Portal"
        subtitle="Portfolio performance, documents, and updates."
        roleBadgeLabel="Owner"
        navigation={OWNER_PORTAL_NAVIGATION}
        showPushEnrollmentBanner={false}
        fetchProfile={false}
      >
        <AppPage breadcrumbs={[{ href: "/portal", label: "Portals" }, { label: "Owner" }]}>
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
              Owner Portal (certification shell)
            </h1>
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              OWNER-001 Phase 1 navigation and layout shell for visual certification. Live owner data loads on
              `/portal/owner` with authenticated owner access.
            </p>
          </div>
        </AppPage>
      </RolePortalFrame>
    );
  }

  return (
    <RolePortalFrame
      availableRoles={["tenant"]}
      defaultRole="tenant"
      organizations={CERTIFICATION_ORGANIZATIONS}
      defaultOrganizationId="dev-certification-org"
      title="Home"
      subtitle=""
      roleBadgeLabel="Tenant"
      navigation={TENANT_PORTAL_NAVIGATION}
      consumerChrome
      mobileBottomNavigation={TENANT_PORTAL_MOBILE_BOTTOM_NAVIGATION}
      showPushEnrollmentBanner={false}
      fetchProfile={false}
    >
      <AppPage>
        <TenantPortalHome
          firstName="Avery"
          propertyName="Certification Residences"
          unitNumber="12B"
          hasLinkedTenant
          attentionItems={[]}
          todayCards={[]}
        />
      </AppPage>
    </RolePortalFrame>
  );
}

function resolveCertificationRole(value: string | undefined): CertificationRole {
  if (value === "owner" || value === "tenant") return value;
  return "tenant";
}
