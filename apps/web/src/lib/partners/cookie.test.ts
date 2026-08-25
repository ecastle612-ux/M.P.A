import { describe, expect, it } from "vitest";
import { firstWinsPartnerRef, partnerRefFromRequest, readPartnerRefCookie } from "./cookie";

describe("partner referral cookie", () => {
  it("reads and prefers the first cookie over a later query", () => {
    expect(readPartnerRefCookie("mpa_partner_ref=northstar-property-services; other=1")).toBe(
      "northstar-property-services"
    );
    expect(firstWinsPartnerRef("northstar-property-services", "other-company")).toBe(
      "northstar-property-services"
    );
    expect(firstWinsPartnerRef(null, "NorthStar-Property-Services")).toBe("northstar-property-services");
    expect(firstWinsPartnerRef(null, "admin")).toBe(null);
  });

  it("uses cookie then query from a request", () => {
    const withCookie = new Request("http://localhost/get-started?ref=other-company", {
      headers: { cookie: "mpa_partner_ref=northstar-property-services" }
    });
    expect(partnerRefFromRequest(withCookie)).toBe("northstar-property-services");
    const queryOnly = new Request("http://localhost/get-started?ref=northstar-property-services");
    expect(partnerRefFromRequest(queryOnly)).toBe("northstar-property-services");
  });
});
