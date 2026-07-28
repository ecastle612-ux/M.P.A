import { describe, expect, it } from "vitest";
import {
  resolveSettingsLandingHref,
  resolveVisibleSettingsNavItems,
  SETTINGS_NAV_ITEMS
} from "./nav";

function authz(permissions: string[]) {
  return {
    userId: "u1",
    organizationId: "o1",
    roles: [],
    permissions
  } as Parameters<typeof resolveVisibleSettingsNavItems>[0]["authorization"];
}

describe("settings nav A09", () => {
  it("exposes the V1.0 labeled set", () => {
    expect(SETTINGS_NAV_ITEMS.map((i) => i.label)).toEqual([
      "Organization",
      "Team",
      "Subscription",
      "Owner payouts",
      "Preferences",
      "Providers",
      "Document vault"
    ]);
  });

  it("hides money and vault tabs without capabilities", () => {
    const visible = resolveVisibleSettingsNavItems({
      authorization: authz(["organization:read", "membership:read"]),
      isMasterAdmin: false,
      hasActiveOrganization: true
    });
    expect(visible.map((i) => i.id)).toEqual(["organization", "team", "preferences", "providers"]);
  });

  it("shows subscription and payouts when entitled", () => {
    const visible = resolveVisibleSettingsNavItems({
      authorization: authz(["organization:read", "saas:read", "payout:manage", "document:read"]),
      isMasterAdmin: false,
      hasActiveOrganization: true
    });
    expect(visible.map((i) => i.id)).toContain("subscription");
    expect(visible.map((i) => i.id)).toContain("payouts");
    expect(visible.map((i) => i.id)).toContain("documents");
  });

  it("limits master-admin-only shell to preferences and providers", () => {
    const visible = resolveVisibleSettingsNavItems({
      authorization: authz(["master_admin"]),
      isMasterAdmin: true,
      hasActiveOrganization: false
    });
    expect(visible.map((i) => i.id)).toEqual(["preferences", "providers"]);
  });

  it("lands master-admin-only on preferences", () => {
    expect(
      resolveSettingsLandingHref({
        authorization: authz(["master_admin"]),
        isMasterAdmin: true,
        hasActiveOrganization: false,
        masterAdminOnly: true
      })
    ).toBe("/settings/preferences");
  });

  it("lands org operators on first visible tab (organization)", () => {
    expect(
      resolveSettingsLandingHref({
        authorization: authz(["organization:read", "membership:read"]),
        isMasterAdmin: false,
        hasActiveOrganization: true,
        masterAdminOnly: false
      })
    ).toBe("/settings/organization");
  });
});
