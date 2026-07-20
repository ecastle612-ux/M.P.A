import { USER_ROLES, isUserRole, type UserRole } from "@mpa/shared";

export const ACTIVE_ORGANIZATION_COOKIE = "mpa_active_organization_id";

export type CreateOrganizationInput = {
  name: string;
  slug?: string;
};

export type SwitchOrganizationInput = {
  organizationId: string;
};

export type InviteOrganizationMemberInput = {
  email: string;
  roles: UserRole[];
};

export type UpdateOrganizationMembershipInput = {
  membershipId: string;
  roles?: UserRole[];
  status?: "active" | "inactive";
};

export type UpdateOrganizationInput = {
  name: string;
};

export type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
  roles: UserRole[];
};

export function parseCreateOrganizationInput(payload: unknown): CreateOrganizationInput | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const value = payload as Record<string, unknown>;
  const name = typeof value["name"] === "string" ? value["name"].trim() : "";
  const slugRaw = typeof value["slug"] === "string" ? value["slug"].trim() : undefined;
  const slug =
    slugRaw && slugRaw.length >= 2 && slugRaw.length <= 80 && /^[a-z0-9-]+$/.test(slugRaw)
      ? slugRaw
      : undefined;

  if (name.length < 2 || name.length > 120) {
    return null;
  }

  if (slug) {
    return { name, slug };
  }
  return { name };
}

export function parseSwitchOrganizationInput(payload: unknown): SwitchOrganizationInput | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const value = payload as Record<string, unknown>;
  const organizationId = typeof value["organizationId"] === "string" ? value["organizationId"] : null;
  if (!organizationId || !isUuid(organizationId)) {
    return null;
  }
  return { organizationId };
}

export function parseInviteOrganizationMemberInput(payload: unknown): InviteOrganizationMemberInput | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const value = payload as Record<string, unknown>;
  const email = typeof value["email"] === "string" ? value["email"].trim().toLowerCase() : "";
  const rolesRaw = Array.isArray(value["roles"]) ? value["roles"] : [];
  const roles = rolesRaw.filter((role): role is UserRole => isUserRole(role));
  if (!isEmail(email) || roles.length === 0) {
    return null;
  }
  return { email, roles };
}

export function parseUpdateOrganizationInput(payload: unknown): UpdateOrganizationInput | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const value = payload as Record<string, unknown>;
  const name = typeof value["name"] === "string" ? value["name"].trim() : "";
  if (name.length < 2 || name.length > 120) {
    return null;
  }
  return { name };
}

export function parseUpdateOrganizationMembershipInput(payload: unknown): UpdateOrganizationMembershipInput | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const value = payload as Record<string, unknown>;
  const membershipId = typeof value["membershipId"] === "string" ? value["membershipId"] : null;
  if (!membershipId || !isUuid(membershipId)) {
    return null;
  }

  const rolesRaw = Array.isArray(value["roles"]) ? value["roles"] : undefined;
  const roles = rolesRaw?.filter((role): role is UserRole => isUserRole(role));
  const statusRaw = value["status"];
  const status = statusRaw === "active" || statusRaw === "inactive" ? statusRaw : undefined;

  if (!roles && !status) {
    return null;
  }

  const result: UpdateOrganizationMembershipInput = { membershipId };
  if (roles) {
    result.roles = roles;
  }
  if (status) {
    result.status = status;
  }
  return result;
}

export function normalizeRoles(roles: readonly string[]): UserRole[] {
  return roles.filter((role): role is UserRole => isUserRole(role));
}

export function createOrganizationSlugFromName(name: string): string {
  const normalized = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  return normalized || "organization";
}

export function isValidRole(role: string): role is UserRole {
  return USER_ROLES.includes(role as UserRole);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
