import { describe, expect, it } from "vitest";
import { COM_002_FLAGS } from "../commercial/commerce-flags";
import {
  DEMO_ANALYTICS_EVENTS,
  DEMO_ISOLATION,
  DEMO_RESTRICTIONS,
  assertDemoBoundary,
  assertSnapshotIntegrity,
  buildDemoSession,
  canResetDemoSession,
  defaultPersonaForProduct,
  demoConversionHref,
  demoNavFor,
  getDemoSnapshot,
  isDemoSessionExpired,
  personasForDemoProduct,
  primaryDemoConversionCta,
  resetOverlay
} from "./index";

describe("COM-002 Slice B demo foundation", () => {
  it("enables slice B flag with FO and Complete self-serve authorized", () => {
    expect(COM_002_FLAGS.sliceB_demoPlatform).toBe(true);
    expect(COM_002_FLAGS.foReady).toBe(true);
    expect(COM_002_FLAGS.completeReady).toBe(true);
    expect(COM_002_FLAGS.sliceC_stripeCheckout).toBe(true);
  });

  it("builds isolated sessions with overlay refs", () => {
    const session = buildDemoSession({
      product: "mpa_property_manager",
      persona: "property_manager"
    });
    expect(session.id.startsWith("demo_")).toBe(true);
    expect(session.writeOverlayRef).toBe(`overlay:${session.id}`);
    expect(isDemoSessionExpired(session)).toBe(false);
    expect(DEMO_ISOLATION.productionDbAccess).toBe(false);
    expect(DEMO_ISOLATION.tenancyModel).toBe("shared_snapshot_plus_session_overlay");
  });

  it("provides three product snapshots with integrity", () => {
    for (const product of [
      "mpa_property_manager",
      "mpa_facility_operations",
      "mpa_complete_platform"
    ] as const) {
      const bundle = getDemoSnapshot(product);
      expect(assertSnapshotIntegrity(bundle)).toEqual([]);
      expect(bundle.watermark).toContain("SYNTHETIC");
    }
  });

  it("supports role personas per product without auth", () => {
    expect(personasForDemoProduct("mpa_property_manager")).toContain("resident");
    expect(personasForDemoProduct("mpa_facility_operations")).toContain("facility_manager");
    expect(defaultPersonaForProduct("mpa_complete_platform")).toBe("executive");
    expect(demoNavFor("mpa_property_manager", "resident")[0]?.group).toBe("portal");
  });

  it("blocks boundary-leaving actions", () => {
    expect(DEMO_RESTRICTIONS.sendEmail).toBe(false);
    expect(DEMO_RESTRICTIONS.processPayments).toBe(false);
    expect(assertDemoBoundary("payment").allowed).toBe(false);
    expect(assertDemoBoundary("provision").allowed).toBe(false);
    expect(assertDemoBoundary("export").allowed).toBe(false);
  });

  it("routes conversion to Get Started — not checkout or modules", () => {
    expect(primaryDemoConversionCta("mpa_property_manager")).toBe("start_subscription");
    expect(primaryDemoConversionCta("mpa_facility_operations")).toBe("start_subscription");
    const pmHref = demoConversionHref("mpa_property_manager", "start_subscription", "demo_x");
    expect(pmHref).toContain("/get-started");
    expect(pmHref).toContain("intent=mpa_property_manager");
    expect(pmHref).not.toContain("/checkout");
    expect(pmHref).not.toContain("/modules");
    expect(demoConversionHref("mpa_facility_operations", "start_subscription")).toContain(
      "/get-started?intent=mpa_facility_operations"
    );
    expect(demoConversionHref("mpa_complete_platform", "request_enterprise")).toContain(
      "/enterprise?intent=mpa_complete_platform"
    );
  });

  it("resets overlay and enforces reset cooldown helper", () => {
    const session = buildDemoSession({
      product: "mpa_property_manager",
      persona: "property_manager"
    });
    expect(canResetDemoSession(session)).toBe(true);
    const overlay = resetOverlay(session.id);
    expect(overlay.ops).toEqual([]);
    expect(DEMO_ANALYTICS_EVENTS.demo_started).toBe("demo.started");
  });
});
