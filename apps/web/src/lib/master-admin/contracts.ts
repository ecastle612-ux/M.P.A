export const MASTER_ADMIN_SESSION_COOKIE = "mpa_ma_session_id";

export type MasterAdminPortal = "resident" | "owner" | "manager";

export type MasterAdminSessionMode = "portal_test" | "impersonate";

export type MasterAdminEffectiveSession = {
  id: string;
  mode: MasterAdminSessionMode;
  organizationId: string;
  portal: MasterAdminPortal | null;
  targetUserId: string | null;
  targetDisplayName: string | null;
  targetRoleLabel: string | null;
  startedAt: string;
};

export const PORTAL_TEST_HREFS: Record<MasterAdminPortal, string> = {
  resident: "/portal/tenant",
  owner: "/portal/owner",
  manager: "/portal/manager"
};

export const PORTAL_ROLE_LABELS: Record<MasterAdminPortal, string> = {
  resident: "Resident",
  owner: "Owner",
  manager: "Property Manager"
};

export function portalToUserRole(
  portal: MasterAdminPortal
): "tenant" | "property_owner" | "property_manager" {
  switch (portal) {
    case "resident":
      return "tenant";
    case "owner":
      return "property_owner";
    case "manager":
      return "property_manager";
  }
}
