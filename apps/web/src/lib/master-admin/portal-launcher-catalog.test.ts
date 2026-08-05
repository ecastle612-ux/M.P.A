import { describe, expect, it } from "vitest";
import {
  PORTAL_LAUNCHER_GROUPS,
  countPortalLauncherCards,
  listPortalLauncherCards
} from "./portal-launcher-catalog";

const REQUIRED_GROUPS = [
  "Operations",
  "Maintenance",
  "Leasing",
  "Residents",
  "Owners",
  "Accounting",
  "Executive",
  "Support",
  "Internal"
] as const;

const REQUIRED_TITLES = [
  "Organization Admin",
  "Property Manager",
  "Regional Manager",
  "Maintenance Manager",
  "Maintenance Technician",
  "Vendor",
  "Leasing Manager",
  "Leasing Agent",
  "Applicant",
  "Resident",
  "Owner",
  "Accounting Manager",
  "Accounts Payable",
  "Accounts Receivable",
  "Executive Dashboard",
  "Portfolio Dashboard",
  "Support Dashboard",
  "Customer Success",
  "Mission Control",
  "Platform Health",
  "Feature Flags",
  "Integrations"
] as const;

describe("portal-launcher-catalog (UX-016 Slice B)", () => {
  it("includes every required group in order", () => {
    expect(PORTAL_LAUNCHER_GROUPS.map((group) => group.label)).toEqual([...REQUIRED_GROUPS]);
  });

  it("includes every required role/surface card", () => {
    const titles = listPortalLauncherCards().map((card) => card.title);
    for (const title of REQUIRED_TITLES) {
      expect(titles).toContain(title);
    }
    expect(countPortalLauncherCards()).toBe(REQUIRED_TITLES.length);
  });

  it("gives every card Open Portal, View As, and Test Mode wiring", () => {
    for (const card of listPortalLauncherCards()) {
      expect(card.openHref.startsWith("/")).toBe(true);
      expect(card.viewAsHref).toBe("/master-admin/impersonation");
      expect(card.testModeFallbackLabel.length).toBeGreaterThan(0);
      if (card.testModePortal) {
        expect(["resident", "owner", "manager"]).toContain(card.testModePortal);
      }
    }
  });

  it("maps Resident, Owner, and Property Manager to existing portal-test portals", () => {
    const cards = listPortalLauncherCards();
    expect(cards.find((card) => card.id === "resident")?.testModePortal).toBe("resident");
    expect(cards.find((card) => card.id === "owner")?.testModePortal).toBe("owner");
    expect(cards.find((card) => card.id === "property-manager")?.testModePortal).toBe("manager");
  });

  it("keeps launcher honest — no unfinished Audit Explorer or Mission Control alias", () => {
    const titles = listPortalLauncherCards().map((card) => card.title);
    expect(titles).not.toContain("Audit Explorer");
    expect(titles).not.toContain("Platform Operations");
    expect(listPortalLauncherCards().find((card) => card.id === "applicant")?.openHref).toBe(
      "/applicants"
    );
  });
});
