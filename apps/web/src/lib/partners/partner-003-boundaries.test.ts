import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readRepo(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("PARTNER-003 hard boundaries", () => {
  it("is tracking-only and does not add payout or a second auth system", () => {
    const earnings = readRepo("src/components/partners/partner-earnings-page.tsx");
    expect(earnings).toContain("Partner Earnings");
    expect(earnings).toContain("PARTNER_EARNINGS_TRACKING_EXPLAINER");
    expect(earnings).not.toContain("Available Balance");
    expect(earnings).not.toContain("Withdraw");
    expect(earnings).not.toContain("Cash Out");
    expect(earnings).not.toContain("Connect Bank");
    expect(earnings).not.toContain("Stripe Connect");
    expect(earnings).not.toContain("ACH");

    const service = readRepo("src/lib/partners/command-center-service.ts");
    expect(service).toContain("getPartnerByOrganization");
    expect(service).not.toContain("stripe.transfers");
    expect(service).not.toContain("createCheckoutSession");

    const authz = readRepo("src/lib/partners/authz.ts");
    expect(authz).toContain("resolveAuthorizationContext");
    expect(authz).toContain("evaluatePermission");
    expect(authz).toContain("platform.partner_services");
    expect(authz).not.toContain("partner_password");
    expect(authz).not.toContain("createUser");

    const dashboard = readRepo("src/app/api/partners/dashboard/route.ts");
    expect(dashboard).toContain("requirePartnerServicesRead");
    expect(dashboard).toContain("partner_id is not an authorization parameter");

    const profile = readRepo("src/lib/partners/service.ts");
    expect(profile).toContain("updatePartnerPublicProfile");
    expect(profile).toContain("parsePartnerPublicProfileInput");
  });

  it("preserves Master Admin, PARTNER-001/002 tables, MEDIA, and freeze boundaries", () => {
    const admin = readRepo("src/app/api/admin/partners/route.ts");
    expect(admin).toContain("isPlatformOperatorUser");
    expect(admin).toContain("mark_paid");

    const migration = readFileSync(
      resolve(process.cwd(), "../../supabase/migrations/20260824230000_docs_237_partner_003_command_center.sql"),
      "utf8"
    );
    expect(migration).toContain("logo_media_id");
    expect(migration).toContain("partner_branding");
    expect(migration).toContain("Do not apply this file to Production from the implement package");
    expect(migration).not.toContain("drop table public.platform_partners");
    expect(migration).not.toContain("drop table public.platform_partner_service_requests");
    expect(migration).not.toContain("create table public.platform_partners");

    const logo = readRepo("src/app/api/partners/profile/logo/route.ts");
    expect(logo).toContain('relatedEntityType: "partner_branding"');
    expect(logo).toContain('attachmentCategory: "partner_branding"');
    expect(logo).not.toContain('attachmentCategory: "receipt"');

    expect(readRepo("src/lib/partners/command-center-service.ts")).not.toContain("signwell");
    expect(readRepo("src/components/partners/partner-command-center-page.tsx")).not.toContain("signwell");
  });
});
