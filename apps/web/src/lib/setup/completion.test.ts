import { describe, expect, it } from "vitest";
import {
  buildSetupStepCompletion,
  isPathAllowedDuringSetup,
  shouldServerRedirectToSetup
} from "./completion";

describe("setup Finish Setup continuity", () => {
  it("does not mark setup complete without recovery + commercial active", () => {
    const incomplete = buildSetupStepCompletion({
      profileComplete: true,
      hasOrganization: true,
      inviteComplete: true,
      propertiesCount: 1,
      unitsCount: 1,
      tenantsCount: 1,
      leasesCount: 1,
      recoveryContactReady: false,
      commerciallyActive: false
    });
    expect(incomplete.finish).toBe(false);
    expect(incomplete.complete).toBe(false);

    const portfolioOnly = buildSetupStepCompletion({
      profileComplete: true,
      hasOrganization: true,
      inviteComplete: true,
      propertiesCount: 1,
      unitsCount: 1,
      tenantsCount: 1,
      leasesCount: 1,
      recoveryContactReady: true,
      commerciallyActive: false
    });
    expect(portfolioOnly.finish).toBe(false);
    expect(portfolioOnly.complete).toBe(false);
  });

  it("marks finish and complete when recovery is ready and org is active", () => {
    const done = buildSetupStepCompletion({
      profileComplete: true,
      hasOrganization: true,
      inviteComplete: true,
      propertiesCount: 2,
      unitsCount: 3,
      tenantsCount: 1,
      leasesCount: 1,
      recoveryContactReady: true,
      commerciallyActive: true
    });
    expect(done.finish).toBe(true);
    expect(done.complete).toBe(true);
  });

  it("allows Move In and billing paths while setup is incomplete", () => {
    expect(isPathAllowedDuringSetup("/residents/move-in")).toBe(true);
    expect(isPathAllowedDuringSetup("/financials/charges/new")).toBe(true);
    expect(isPathAllowedDuringSetup("/settings/billing")).toBe(true);
    expect(isPathAllowedDuringSetup("/dashboard")).toBe(false);
    expect(isPathAllowedDuringSetup("/maintenance")).toBe(false);
  });

  it("server-redirects incomplete setup away from dashboard before paint", () => {
    expect(
      shouldServerRedirectToSetup({ isSetupComplete: false, pathname: "/dashboard" })
    ).toBe(true);
    expect(
      shouldServerRedirectToSetup({ isSetupComplete: false, pathname: "/maintenance" })
    ).toBe(true);
    expect(shouldServerRedirectToSetup({ isSetupComplete: false, pathname: "/setup" })).toBe(
      false
    );
    expect(
      shouldServerRedirectToSetup({ isSetupComplete: false, pathname: "/properties/new" })
    ).toBe(false);
    expect(
      shouldServerRedirectToSetup({ isSetupComplete: true, pathname: "/dashboard" })
    ).toBe(false);
    expect(
      shouldServerRedirectToSetup({ isSetupComplete: false, pathname: "/master-admin" })
    ).toBe(false);
  });
});
