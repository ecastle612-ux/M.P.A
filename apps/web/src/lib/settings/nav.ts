/**
 * UX-012 Amendment A09 — Settings IA navigation SoT.
 * Cite: APPROVE UX-012 AMENDMENT A09
 *
 * Implemented: capability-filtered Settings pills, Preferences composition,
 * Subscription/Providers/Document vault labels, chrome theme toggle removed.
 *
 * Client-safe: do not import auth/server or next/headers from this module.
 */
import { evaluateCapability, type PermissionCapability } from "@mpa/shared";

export type SettingsNavItemId =
  | "organization"
  | "team"
  | "subscription"
  | "payouts"
  | "preferences"
  | "providers"
  | "documents";

export type SettingsNavItem = {
  id: SettingsNavItemId;
  href: string;
  label: string;
};

/** Canonical V1.0 Settings pills (capability-filtered at render). */
export const SETTINGS_NAV_ITEMS: readonly SettingsNavItem[] = [
  { id: "organization", href: "/settings/organization", label: "Organization" },
  { id: "team", href: "/settings/team", label: "Team" },
  { id: "subscription", href: "/settings/billing", label: "Subscription" },
  { id: "payouts", href: "/settings/payouts", label: "Owner payouts" },
  { id: "preferences", href: "/settings/preferences", label: "Preferences" },
  { id: "providers", href: "/settings/integrations", label: "Providers" },
  { id: "documents", href: "/settings/documents", label: "Document vault" }
] as const;

type AuthzLike = { permissions: readonly string[] };

function can(authz: AuthzLike | null, capability: PermissionCapability): boolean {
  if (!authz) return false;
  if (authz.permissions.includes("master_admin")) return true;
  return evaluateCapability(authz.permissions, capability);
}

/**
 * Returns Settings tabs the user may open (A09 §6).
 * Unentitled tabs must not appear in the subnav.
 * Org-scoped tabs require an active organization even for Master Admin.
 */
export function resolveVisibleSettingsNavItems(input: {
  authorization: AuthzLike | null;
  isMasterAdmin: boolean;
  hasActiveOrganization: boolean;
}): SettingsNavItem[] {
  const { authorization, isMasterAdmin, hasActiveOrganization } = input;
  const authenticatedPrefs = Boolean(authorization) || isMasterAdmin;

  return SETTINGS_NAV_ITEMS.filter((item) => {
    switch (item.id) {
      case "organization":
        return hasActiveOrganization && can(authorization, "organization:read");
      case "team":
        return (
          hasActiveOrganization &&
          (can(authorization, "membership:read") || can(authorization, "invitation:read"))
        );
      case "subscription":
        return hasActiveOrganization && can(authorization, "saas:read");
      case "payouts":
        return (
          hasActiveOrganization &&
          (can(authorization, "payout:manage") ||
            can(authorization, "financial:read") ||
            can(authorization, "financial:admin"))
        );
      case "preferences":
        return authenticatedPrefs && (hasActiveOrganization || isMasterAdmin);
      case "providers":
        return (
          (hasActiveOrganization && can(authorization, "organization:read")) || isMasterAdmin
        );
      case "documents":
        return hasActiveOrganization && can(authorization, "document:read");
      default:
        return false;
    }
  });
}

/** First entitled Settings tab for `/settings` redirect. */
export function resolveSettingsLandingHref(input: {
  authorization: AuthzLike | null;
  isMasterAdmin: boolean;
  hasActiveOrganization: boolean;
  masterAdminOnly: boolean;
}): string {
  const visible = resolveVisibleSettingsNavItems(input);
  if (input.masterAdminOnly) {
    const prefs = visible.find((item) => item.id === "preferences");
    if (prefs) return prefs.href;
  }
  return visible[0]?.href ?? "/settings/preferences";
}

/** Legacy Appearance / Notifications paths → Preferences. */
export const SETTINGS_PREFERENCES_HREF = "/settings/preferences";
