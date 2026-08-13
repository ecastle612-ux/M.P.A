import { describe, expect, it } from "vitest";
import { resolveProductWorkspaceHome } from "../auth/post-auth-home";
import {
  postPurchaseDestinationLabel,
  postPurchaseNextStepCopy,
  postPurchaseReadyCopy,
  productWorkspaceNavHref,
  productWorkspaceNavLabel
} from "./activation-identity";
import { demoHonestyBanner } from "../demo/products";
import { ownerDay1ChecklistForSku } from "./owner-day1";
import { completeWorkspaceLabels, navigationGroupTitleForSku } from "./complete-launcher";

describe("activation identity (Wave D)", () => {
  it("names SKU workspaces for breadcrumbs without changing routes", () => {
    expect(productWorkspaceNavLabel("mpa_property_manager")).toBe("Property Manager Workspace");
    expect(productWorkspaceNavLabel("mpa_facility_operations")).toBe(
      "Facility Operations Workspace"
    );
    expect(productWorkspaceNavLabel("mpa_complete_platform")).toBe("Organization Workspace");
    expect(productWorkspaceNavHref("mpa_property_manager")).toBe(
      resolveProductWorkspaceHome("mpa_property_manager")
    );
    expect(productWorkspaceNavHref("mpa_facility_operations")).toBe(
      "/facility/mission-control"
    );
    expect(productWorkspaceNavHref("mpa_complete_platform")).toBe("/launcher");
  });

  it("exposes SKU-aware post-purchase destinations", () => {
    expect(postPurchaseDestinationLabel("mpa_property_manager")).toBe(
      "Property Manager Mission Control"
    );
    expect(postPurchaseDestinationLabel("mpa_facility_operations")).toBe(
      "Facility Operations Mission Control"
    );
    expect(postPurchaseDestinationLabel("mpa_complete_platform")).toBe(
      "Complete Platform Launcher"
    );
    expect(postPurchaseNextStepCopy("mpa_facility_operations")).toMatch(/Facility Operations/);
    expect(postPurchaseNextStepCopy("mpa_facility_operations")).not.toMatch(
      /→ Mission Control\./
    );
    expect(postPurchaseReadyCopy("mpa_complete_platform")).toMatch(/Complete Platform Launcher/);
  });

  it("keeps Complete identity as one organization with two capabilities", () => {
    const labels = completeWorkspaceLabels();
    expect(labels.productTagline).toMatch(/One organization/i);
    expect(labels.productTagline).toMatch(/not two separate apps/i);
    expect(navigationGroupTitleForSku("home", "mpa_complete_platform")).toBe("Complete Platform");
    expect(navigationGroupTitleForSku("shared", "mpa_complete_platform")).toMatch(/Shared/i);
  });

  it("aligns FO demo honesty with self-serve FO (no Enterprise readiness framing)", () => {
    const fo = demoHonestyBanner("mpa_facility_operations");
    expect(fo).toMatch(/Synthetic|demonstration/i);
    expect(fo).not.toMatch(/Enterprise \/ FO readiness/i);
    expect(demoHonestyBanner("mpa_complete_platform")).toMatch(/one organization/i);
  });

  it("clarifies PM Day-1 units guidance", () => {
    const units = ownerDay1ChecklistForSku("mpa_property_manager").items.find(
      (item) => item.id === "pm_units"
    );
    expect(units?.href).toBe("/pm/properties");
    expect(units?.detail).toMatch(/created with your property/i);
  });
});
