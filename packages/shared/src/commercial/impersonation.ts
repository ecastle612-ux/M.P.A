export const IMPERSONATION_TARGET_ROLES = [
  "property_manager",
  "organization_owner",
  "facility_manager",
  "facility_technician",
  "resident"
] as const;

export type ImpersonationTargetRole = (typeof IMPERSONATION_TARGET_ROLES)[number];

export const IMPERSONATION_TARGET_ROLE_LABELS: Record<ImpersonationTargetRole, string> = {
  property_manager: "Property Manager",
  organization_owner: "Organization Owner",
  facility_manager: "Facility Manager",
  facility_technician: "Technician",
  resident: "Resident"
};

export const IMPERSONATION_HOME_BY_ROLE: Record<ImpersonationTargetRole, string> = {
  property_manager: "/pm/mission-control",
  organization_owner: "/portal/owner",
  facility_manager: "/facility/mission-control",
  facility_technician: "/facility/mission-control",
  resident: "/portal/tenant"
};

export const IMPERSONATION_COOKIE = "mpa_impersonation_session";
export const IMPERSONATION_MODE_COOKIE = "mpa_impersonation_mode";

export function isImpersonationTargetRole(value: string): value is ImpersonationTargetRole {
  return (IMPERSONATION_TARGET_ROLES as readonly string[]).includes(value);
}
