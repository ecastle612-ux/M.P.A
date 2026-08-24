import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readRepo(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("PARTNER-002 hard boundaries", () => {
  it("keeps intake separate from work orders and money movement", () => {
    const service = readRepo("src/lib/partners/request-service.ts");
    expect(service).toContain('input.action === "convert"');
    expect(service).not.toContain("recordPartnerCommissionFromPaidInvoice");
    expect(service).not.toContain("stripe.transfers");

    const publicRoute = readRepo("src/app/api/public/partners/[slug]/route.ts");
    expect(publicRoute).toContain('class: "PUBLIC"');
    expect(publicRoute).toContain("PARTNER_REQUEST_MAX_BYTES");

    const media = readRepo("src/app/api/public/partners/[slug]/media/route.ts");
    expect(media).toContain('relatedEntityType: "partner_service_request"');
    expect(media).toContain("createUploadIntent");
    expect(media).not.toContain("attachmentCategory: \"receipt\"");

    const webhook = readRepo("src/lib/saas-stripe/webhook.ts");
    expect(webhook).not.toContain("stripe.transfers");
    expect(webhook).not.toContain("submitPartnerServiceRequest");

    const marketing = readRepo("src/components/marketing/partners-page.tsx");
    expect(marketing).toContain("Planned — not Production-live");
    expect(marketing).toContain("Give your customers a dedicated service-request link and QR code powered by M.P.A.");

    const migration = readFileSync(
      resolve(process.cwd(), "../../supabase/migrations/20260824220000_docs_234_partner_002_service_portals.sql"),
      "utf8"
    );
    expect(migration).toContain("platform_partner_service_requests");
    expect(migration).toContain("partner_service_request");
    expect(migration).toContain("revoke all on public.platform_partner_service_requests from public, anon");
    expect(migration).not.toContain("drop table public.platform_partners");
  });
});
