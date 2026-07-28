/**
 * AUTH-001 Slice D — certification support for deferred roles (H-06…H-08).
 * Provides deterministic checks used by unit tests / QA fixtures. No Slice E.
 */
import {
  assignedSurfaceHome,
  canAccessOperationsPath,
  canAccessOperationsShell,
  hasOperationsShellRole
} from "../ops-shell-access";
import { SLICE_D_CERTIFICATION_ROLES } from "./templates";
import { assertRoleAssignmentAllowed } from "./assignment";
import type { UserRole } from "@mpa/shared";

export type RoleCertificationCheck = {
  id: string;
  role: UserRole;
  description: string;
  pass: boolean;
};

export function buildSliceDRoleCertificationChecks(): RoleCertificationCheck[] {
  const checks: RoleCertificationCheck[] = [];

  for (const role of SLICE_D_CERTIFICATION_ROLES) {
    const roles = [role];
    checks.push({
      id: `${role}.shell_access`,
      role,
      description: `${role} may enter Operations shell`,
      pass: hasOperationsShellRole(roles) && canAccessOperationsShell(roles, false)
    });
  }

  checks.push({
    id: "organization_admin.home_manager",
    role: "organization_admin",
    description: "Org Admin (PM company) lands on Manager Ops dashboard",
    pass: assignedSurfaceHome(["organization_admin"], false, { organizationType: "property_manager" }) === "/dashboard"
  });

  checks.push({
    id: "organization_admin.home_owner",
    role: "organization_admin",
    description: "Org Admin (owner org) lands on Owner portal",
    pass:
      assignedSurfaceHome(["organization_admin"], false, { organizationType: "property_owner" }) ===
      "/portal/owner"
  });

  checks.push({
    id: "leasing_agent.home",
    role: "leasing_agent",
    description: "Leasing Agent lands on /leases",
    pass: assignedSurfaceHome(["leasing_agent"], false) === "/leases"
  });

  checks.push({
    id: "facility_technician.home",
    role: "facility_technician",
    description: "Facility Technician lands on /maintenance",
    pass: assignedSurfaceHome(["facility_technician"], false) === "/maintenance"
  });

  checks.push({
    id: "leasing_agent.path_allow",
    role: "leasing_agent",
    description: "Leasing Agent may open /leases",
    pass: canAccessOperationsPath("/leases", ["leasing_agent"], false)
  });

  checks.push({
    id: "leasing_agent.path_deny_financials",
    role: "leasing_agent",
    description: "Leasing Agent cannot open /financials",
    pass: !canAccessOperationsPath("/financials", ["leasing_agent"], false)
  });

  checks.push({
    id: "facility_technician.path_allow",
    role: "facility_technician",
    description: "Facility Technician may open /maintenance",
    pass: canAccessOperationsPath("/maintenance", ["facility_technician"], false)
  });

  checks.push({
    id: "facility_technician.path_deny_leases",
    role: "facility_technician",
    description: "Facility Technician cannot open /leases",
    pass: !canAccessOperationsPath("/leases", ["facility_technician"], false)
  });

  checks.push({
    id: "elevation.ban_self_org_admin",
    role: "organization_admin",
    description: "Self-elevate to organization_admin is banned",
    pass: (() => {
      try {
        assertRoleAssignmentAllowed({
          actorUserId: "user-a",
          targetUserId: "user-a",
          actorRoles: ["property_manager"],
          actorIsOwner: false,
          actorIsMasterAdmin: false,
          nextRoles: ["organization_admin"]
        });
        return false;
      } catch {
        return true;
      }
    })()
  });

  checks.push({
    id: "portal_roles.no_ops",
    role: "tenant",
    description: "Tenant cannot enter Ops shell",
    pass: !canAccessOperationsShell(["tenant"], false)
  });

  return checks;
}

export function sliceDCertificationSummary(): {
  total: number;
  passed: number;
  failed: RoleCertificationCheck[];
} {
  const checks = buildSliceDRoleCertificationChecks();
  const failed = checks.filter((check) => !check.pass);
  return { total: checks.length, passed: checks.length - failed.length, failed };
}
