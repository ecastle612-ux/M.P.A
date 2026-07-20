import { notFound } from "next/navigation";
import { AppPage } from "../../../../components/presentation/app-page";
import {
  OWNER_PORTAL_NAVIGATION,
  TENANT_PORTAL_NAVIGATION,
  VENDOR_PORTAL_NAVIGATION
} from "../../../../components/portal/navigation";
import { RolePortalFrame } from "../../../../components/portal/role-portal-frame";
import { TenantPortalHome } from "../../../../components/portal/tenant-portal-home";
import { VendorPortalHome } from "../../../../components/portal/vendor-portal-home";
import { FutureReleaseNotice } from "../../../../components/experience/future-release-notice";
import type { OrganizationSummary } from "../../../../lib/organization/contracts";

type CertificationRole = "tenant" | "owner" | "vendor";

const CERTIFICATION_ORGANIZATIONS: OrganizationSummary[] = [
  {
    id: "dev-certification-org",
    name: "M.P.A. Certification Portfolio",
    slug: "mpa-certification",
    roles: ["tenant", "property_owner", "vendor"]
  }
];

const VENDOR_WORK_ORDERS = [
  {
    id: "dev-certification-work-order",
    workOrderNumber: "WO-UX007",
    title: "Inspect lobby lighting",
    status: "in_progress",
    assignmentStatus: "accepted",
    propertyName: "Canopy Heights",
    unitNumber: "12B"
  }
] as const;

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

  if (role === "tenant") {
    return (
      <RolePortalFrame
        availableRoles={["tenant"]}
        defaultRole="tenant"
        organizations={CERTIFICATION_ORGANIZATIONS}
        defaultOrganizationId="dev-certification-org"
        title="Tenant Portal"
        subtitle="Payments, maintenance, messages, and documents for your home."
        roleBadgeLabel="Tenant"
        navigation={TENANT_PORTAL_NAVIGATION}
        showPushEnrollmentBanner={false}
        fetchProfile={false}
      >
        <AppPage breadcrumbs={[{ label: "Tenant home" }]}>
          <TenantPortalHome residentName="Avery Resident" hasLinkedTenant />
        </AppPage>
      </RolePortalFrame>
    );
  }

  if (role === "owner") {
    return (
      <RolePortalFrame
        availableRoles={["property_owner"]}
        defaultRole="property_owner"
        organizations={CERTIFICATION_ORGANIZATIONS}
        defaultOrganizationId="dev-certification-org"
        title="Property Owner Portal"
        subtitle="Owner portfolio and reporting views will open here in a later release. Use Accounting → Reports for statements today."
        roleBadgeLabel="Owner"
        navigation={OWNER_PORTAL_NAVIGATION}
        showPushEnrollmentBanner={false}
        fetchProfile={false}
      >
        <AppPage breadcrumbs={[{ href: "/portal", label: "Portals" }, { label: "Owner" }]}>
          <FutureReleaseNotice
            title="Owner Portal"
            description="The Owner Portal will become available during a future release. Property owners can use shared reporting and statements from the main workspace when granted access."
            primaryHref="/portal"
            primaryLabel="Back to Portals"
          />
        </AppPage>
      </RolePortalFrame>
    );
  }

  return (
    <RolePortalFrame
      availableRoles={["vendor"]}
      defaultRole="vendor"
      organizations={CERTIFICATION_ORGANIZATIONS}
      defaultOrganizationId="dev-certification-org"
      title="Vendor Portal"
      subtitle="Assigned maintenance work and service updates for approved providers."
      roleBadgeLabel="Vendor"
      navigation={VENDOR_PORTAL_NAVIGATION}
      showPushEnrollmentBanner={false}
      fetchProfile={false}
    >
      <AppPage breadcrumbs={[{ label: "Vendor home" }]}>
        <VendorPortalHome vendorName="Canopy Services" workOrders={[...VENDOR_WORK_ORDERS]} />
      </AppPage>
    </RolePortalFrame>
  );
}

function resolveCertificationRole(value: string | undefined): CertificationRole {
  if (value === "owner" || value === "vendor" || value === "tenant") return value;
  return "tenant";
}
