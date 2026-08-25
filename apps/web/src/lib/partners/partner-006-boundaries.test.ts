import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readRepo(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("PARTNER-006 hard boundaries", () => {
  it("does not add bidding, ratings, service payments, or commission on jobs", () => {
    const service = readRepo("src/lib/partners/opportunity-service.ts");
    expect(service).toContain("parsePartnerOpportunityCreateInput");
    expect(service).toContain("derivePartnerOnboarding");
    expect(service).toContain("partnerEligibleForOpportunityRouting");
    expect(service).not.toContain("stripe.transfers");
    expect(service).not.toContain("Stripe Connect");
    expect(service).not.toContain("quoteAmount");
    expect(service).not.toContain("lowest-price");
    expect(service).not.toContain("starRating");
    expect(service).not.toContain("shouldCreateCommission");

    const migration = readRepo("../../supabase/migrations/20260825200000_docs_246_partner_006_opportunities.sql");
    expect(migration).toContain("platform_partner_service_opportunities");
    expect(migration).toContain("platform_partner_opportunity_routes");
    expect(migration).toContain("platform_partner_unmet_demand");
    expect(migration).toContain("Do not apply this file to Production");
    expect(migration).not.toContain("commission_cents");
    expect(migration).not.toContain("bid_amount");

    const ui = readRepo("src/components/partners/service-network-page.tsx");
    expect(ui).toContain("Find a Service Partner");
    expect(ui).not.toContain("Place bid");
    expect(ui).not.toContain("Pay now");
  });

  it("keeps partner inbound requests and opportunity routing as separate models", () => {
    const service = readRepo("src/lib/partners/opportunity-service.ts");
    expect(service).not.toContain("platform_partner_service_requests");
    expect(service).not.toContain("parsePartnerServiceRequestInput");
    const requestStore = readRepo("src/lib/partners/request-supabase.ts");
    expect(requestStore).toContain("platform_partner_service_requests");
    expect(requestStore).not.toContain("platform_partner_service_opportunities");
  });

  it("does not change SignWell, July, M5, or deferred SEC-001 Auth", () => {
    const service = readRepo("src/lib/partners/opportunity-service.ts");
    expect(service).not.toContain("signwell");
    expect(service).not.toContain("HIBP");
    expect(service).not.toContain("operator TOTP");
    expect(service).not.toContain("JULY");
  });
});
