import type { UserRole } from "@mpa/shared";

export const STAFF_INVITE_ROLES: UserRole[] = [
  "organization_admin",
  "property_manager",
  "leasing_agent",
  "facility_technician",
  "property_owner"
];

export const ROLE_PERMISSION_SUMMARIES: Record<
  UserRole,
  { label: string; summary: string; capabilities: string[] }
> = {
  organization_admin: {
    label: "Organization administrator",
    summary: "Full tenant-plane administration for the purchased organization.",
    capabilities: [
      "Manage users, roles, and invitations",
      "Manage properties, units, residents, and leases",
      "Run accounting, maintenance, and communications",
      "Configure organization settings and authorization"
    ]
  },
  property_manager: {
    label: "Property manager",
    summary: "Day-to-day operations across portfolio, team, and integrations.",
    capabilities: [
      "Manage properties, units, residents, and leases",
      "Invite and deactivate team members",
      "Run accounting, maintenance, and communications",
      "Configure organization settings"
    ]
  },
  leasing_agent: {
    label: "Leasing agent",
    summary: "Leasing pipeline on assigned properties.",
    capabilities: [
      "Work applicants, leases, and residents on assigned properties",
      "Read property and unit context",
      "Communicate with prospects and residents as granted"
    ]
  },
  facility_technician: {
    label: "Facility technician",
    summary: "Maintenance execution on assigned properties.",
    capabilities: [
      "Create and update maintenance work on assigned properties",
      "Read property, unit, and vendor context as granted",
      "Upload work documentation"
    ]
  },
  property_owner: {
    label: "Property owner",
    summary: "Portfolio visibility and reporting without day-to-day staff administration.",
    capabilities: [
      "View organization membership",
      "Read portfolio and reporting surfaces as granted",
      "Update personal profile",
      "Switch between organizations they belong to"
    ]
  },
  tenant: {
    label: "Resident",
    summary: "Resident portal access for a linked tenancy.",
    capabilities: [
      "Access the resident portal",
      "Submit maintenance and view announcements",
      "Manage personal notification preferences"
    ]
  },
  vendor: {
    label: "Vendor",
    summary:
      "Legacy membership label only. Vendors are not authenticated portal users — they work via secure action links.",
    capabilities: [
      "Participate through secure invitation/action links",
      "No Vendor Portal sign-in or dashboard",
      "Managed internally via Vendor Directory and Facility Operations"
    ]
  }
};

export function formatRoleLabel(role: string): string {
  const summary = ROLE_PERMISSION_SUMMARIES[role as UserRole];
  if (summary) return summary.label;
  return role.replaceAll("_", " ");
}
