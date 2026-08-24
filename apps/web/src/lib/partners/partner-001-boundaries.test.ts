import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readRepo(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("PARTNER-001 hard boundaries", () => {
  it("does not add a partner service-request route or Stripe transfers", () => {
    const partnersPage = readRepo("src/app/(marketing)/partners/page.tsx");
    expect(partnersPage).toContain("PartnersPage");

    const webhook = readRepo("src/lib/saas-stripe/webhook.ts");
    expect(webhook).toContain("safeRecordPartnerCommission");
    expect(webhook).not.toContain("stripe.transfers");
    expect(webhook).not.toContain("Stripe Connect");

    const checkout = readRepo("src/lib/saas-stripe/create-checkout-session.ts");
    expect(checkout).toContain("PARTNER_REF_METADATA_KEY");
    expect(checkout).toContain("buildUnitVolumeCheckoutMetadata");

    const apply = readRepo("src/app/api/partners/apply/route.ts");
    expect(apply).toContain('class: "PUBLIC"');
    expect(apply).toContain("organization_id");

    const admin = readRepo("src/app/api/admin/partners/route.ts");
    expect(admin.indexOf("isPlatformOperatorUser")).toBeGreaterThan(0);
    expect(admin).toContain('status: 403');
  });
});
