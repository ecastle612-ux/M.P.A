import { evaluateCapability, type PermissionCapability } from "@mpa/shared";

/**
 * Expected capability posture by product role (PT-001 security audit).
 * This is the product contract — DB role_permission_grants must match.
 */
export const ROLE_CAPABILITY_EXPECTATIONS: Record<
  string,
  {
    mustAllow: PermissionCapability[];
    mustDeny: PermissionCapability[];
  }
> = {
  administrator: {
    mustAllow: ["authorization:manage", "organization:read", "financial:admin", "migration:rollback"],
    mustDeny: []
  },
  property_manager: {
    mustAllow: ["property:read", "tenant:read", "lease:read", "maintenance:read", "financial:read", "dashboard:read"],
    mustDeny: ["authorization:manage"]
  },
  leasing_agent: {
    mustAllow: ["applicant:read", "applicant:create", "lease:read", "tenant:read"],
    mustDeny: ["financial:admin", "migration:rollback", "authorization:manage"]
  },
  maintenance: {
    mustAllow: ["maintenance:read", "maintenance:update", "vendor:read"],
    mustDeny: ["financial:admin", "financial:create", "migration:create", "authorization:manage"]
  },
  vendor: {
    mustAllow: ["maintenance:read"],
    mustDeny: ["financial:admin", "tenant:delete", "property:delete", "authorization:manage", "migration:create"]
  },
  tenant: {
    mustAllow: ["profile:read", "notification:read"],
    mustDeny: [
      "financial:admin",
      "property:create",
      "tenant:delete",
      "migration:create",
      "authorization:manage",
      "screening:admin"
    ]
  },
  owner: {
    mustAllow: ["property:read", "financial:read"],
    mustDeny: ["authorization:manage", "migration:rollback", "tenant:delete"]
  }
};

/**
 * Evaluate a grant list against the role contract.
 * Returns violations (missing allows or unexpected allows that should be denied).
 */
export function auditRoleGrants(
  role: string,
  grantedCapabilities: readonly string[]
): { ok: boolean; violations: string[] } {
  const expectations = ROLE_CAPABILITY_EXPECTATIONS[role];
  if (!expectations) {
    return { ok: false, violations: [`Unknown role: ${role}`] };
  }

  const violations: string[] = [];
  for (const capability of expectations.mustAllow) {
    if (!evaluateCapability(grantedCapabilities, capability)) {
      violations.push(`${role} missing required capability ${capability}`);
    }
  }
  for (const capability of expectations.mustDeny) {
    if (evaluateCapability(grantedCapabilities, capability)) {
      violations.push(`${role} must not have capability ${capability}`);
    }
  }

  return { ok: violations.length === 0, violations };
}

/** Minimal grant sets used for unit regression of the product matrix (not DB dump). */
export const FIXTURE_ROLE_GRANTS: Record<string, string[]> = {
  administrator: ["authorization:manage", "organization:read", "financial:admin", "migration:rollback", "dashboard:read"],
  property_manager: [
    "property:read",
    "tenant:read",
    "lease:read",
    "maintenance:read",
    "financial:read",
    "dashboard:read"
  ],
  leasing_agent: ["applicant:read", "applicant:create", "lease:read", "tenant:read"],
  maintenance: ["maintenance:read", "maintenance:update", "vendor:read"],
  vendor: ["maintenance:read"],
  tenant: ["profile:read", "notification:read"],
  owner: ["property:read", "financial:read"]
};
