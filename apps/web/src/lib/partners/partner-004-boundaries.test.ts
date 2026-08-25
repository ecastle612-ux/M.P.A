import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readRepo(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("PARTNER-004 hard boundaries", () => {
  it("adds a junction to canonical properties without cloning or money movement", () => {
    const migration = readFileSync(
      resolve(process.cwd(), "../../supabase/migrations/20260824240000_docs_240_partner_004_property_portals.sql"),
      "utf8"
    );
    expect(migration).toContain("platform_partner_property_portals");
    expect(migration).toContain("references public.property_properties");
    expect(migration).toContain("Do not apply this file to Production from the implement package");
    expect(migration).toContain("intake_source");
    expect(migration).not.toContain("drop table public.property_properties");
    expect(migration).not.toContain("drop table public.platform_partners");
    expect(migration).not.toContain("create table public.property_properties");

    const service = readRepo("src/lib/partners/property-portal-service.ts");
    expect(service).toContain("getPartnerByOrganization");
    expect(service).not.toContain("recordPartnerCommissionFromPaidInvoice");
    expect(service).not.toContain("stripe.transfers");
    expect(service).not.toContain("createCheckoutSession");

    const request = readRepo("src/lib/partners/request-service.ts");
    expect(request).toContain('intakeSource: "property_portal"');
    expect(request).toContain("submitPartnerPropertyServiceRequest");
    expect(request).not.toContain("tenant_id");
    expect(request).not.toContain("auto-link");

    const parse = readFileSync(resolve(process.cwd(), "../../packages/shared/src/partners/request.ts"), "utf8");
    expect(parse).toContain('"property_id" in body');
    expect(parse).toContain('"propertyId" in body');
  });

  it("preserves generic portal, MEDIA parent auth, and freeze boundaries", () => {
    const publicPage = readRepo("src/app/request/[token]/page.tsx");
    expect(publicPage).toContain("resolveLivePartnerPortal");
    expect(publicPage).toContain("PublicPartnerRequestPortal");

    const propertyPage = readRepo("src/app/request/[token]/[propertySlug]/page.tsx");
    expect(propertyPage).toContain("resolveLivePropertyPortal");
    expect(propertyPage).toContain("This request link is not available.");

    const media = readRepo("src/app/api/public/partners/[slug]/media/route.ts");
    expect(media).toContain('relatedEntityType: "partner_service_request"');
    expect(media).not.toContain("attachmentCategory: \"receipt\"");

    const propertiesApi = readRepo("src/app/api/partners/properties/route.ts");
    expect(propertiesApi).toContain("region");
    expect(propertiesApi).not.toContain(".select(\"id, name, address_line1, city, state\")");

    expect(readRepo("src/lib/partners/property-portal-service.ts")).not.toContain("signwell");
    expect(readRepo("src/components/partners/partner-properties-page.tsx")).not.toContain("Stripe Connect");
    expect(readRepo("src/components/partners/partner-properties-page.tsx")).not.toContain("ACH");
  });
});
