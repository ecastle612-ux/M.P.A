import { describe, expect, it } from "vitest";
import { buildDemoSession, emptyOverlay } from "@mpa/shared";
import { decodeDemoSessionState, encodeDemoSessionState } from "./durable-state";

describe("demo durable state cookie", () => {
  it("round-trips a session across encode/decode", () => {
    const session = buildDemoSession({
      product: "mpa_property_manager",
      persona: "property_manager"
    });
    const row = {
      session,
      overlay: emptyOverlay(session.id),
      analytics: [{ event: "demo.started", at: session.createdAt, meta: { product: session.product } }]
    };
    const token = encodeDemoSessionState(row);
    expect(token).toBeTruthy();
    const decoded = decodeDemoSessionState(token);
    expect(decoded?.session.id).toBe(session.id);
    expect(decoded?.session.product).toBe("mpa_property_manager");
    expect(decoded?.overlay.ops).toEqual([]);
  });

  it("rejects tampered tokens", () => {
    const session = buildDemoSession({
      product: "mpa_facility_operations",
      persona: "facility_manager"
    });
    const token = encodeDemoSessionState({
      session,
      overlay: emptyOverlay(session.id),
      analytics: []
    });
    expect(token).toBeTruthy();
    const tampered = `${token!.slice(0, -4)}xxxx`;
    expect(decodeDemoSessionState(tampered)).toBeNull();
  });
});
