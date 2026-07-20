import type { UserRole } from "@mpa/shared";

export const STAFF_INVITE_ROLES: UserRole[] = ["property_manager", "property_owner"];

export const ROLE_PERMISSION_SUMMARIES: Record<
  UserRole,
  { label: string; summary: string; capabilities: string[] }
> = {
  property_manager: {
    label: "Property manager",
    summary: "Full day-to-day operations across portfolio, team, and integrations.",
    capabilities: [
      "Manage properties, units, residents, and leases",
      "Invite and deactivate team members",
      "Run accounting, maintenance, and communications",
      "Configure organization settings"
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
    summary: "Vendor portal access for assigned work.",
    capabilities: [
      "Access the vendor portal",
      "Update assigned maintenance work",
      "Manage personal profile"
    ]
  }
};

export function formatRoleLabel(role: string): string {
  const summary = ROLE_PERMISSION_SUMMARIES[role as UserRole];
  if (summary) return summary.label;
  return role.replaceAll("_", " ");
}
