import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readRepo(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("PARTNER-005 hard boundaries", () => {
  it("does not add Connect, payouts, SignWell, July, or complimentary merge", () => {
    const service = readRepo("src/lib/partners/invitation-service.ts");
    expect(service).toContain("partnerInviteEmailsMatch");
    expect(service).not.toContain("stripe.transfers");
    expect(service).not.toContain("Stripe Connect");
    expect(service).not.toContain("claimComplimentaryAccess");
    expect(service).not.toContain("MASTER_ADMIN_GRANT");

    const migration = readRepo("../../supabase/migrations/20260825010000_docs_243_partner_005_onboarding.sql");
    expect(migration).toContain("platform_partner_invitations");
    expect(migration).toContain("token_hash");
    expect(migration).toContain("Do not apply this file to Production");
    expect(migration).not.toContain("platform_partners_new");

    const entitlements = readRepo("../../packages/shared/src/commercial/route-entitlements.ts");
    expect(entitlements).toContain('path.startsWith("/partner/invite")');
    expect(entitlements).toContain('path.startsWith("/api/partners/invite")');

    const authz = readRepo("src/lib/partners/authz.ts");
    expect(authz).toContain("partner.services:read");
    expect(authz).toContain("pm.maintenance:read");
    expect(authz).not.toContain("authorization:manage");
  });

  it("keeps complimentary claim and partner invite as separate routes", () => {
    const complimentary = readRepo("src/app/api/complimentary/claim/route.ts");
    expect(complimentary).toContain("claimComplimentaryAccess");
    expect(complimentary).not.toContain("acceptPartnerInvitation");
    const invite = readRepo("src/app/api/partners/invite/[token]/route.ts");
    expect(invite).toContain("acceptPartnerInvitation");
    expect(invite).toContain('class: "PUBLIC"');
    expect(invite).toContain('class: "AUTH"');
    expect(invite).not.toContain("claimComplimentaryAccess");
  });
});
