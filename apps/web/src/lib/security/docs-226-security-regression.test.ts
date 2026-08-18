import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { MEDIA_MAX_IMAGE_BYTES, MIN_PASSWORD_LENGTH, validateMediaUploadIntent } from "@mpa/shared";
import { isWebhookRateLimitExemptPath } from "./durable-rate-limit";

function readRepo(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("SEC-001 security regression contracts", () => {
  it("keeps provider webhooks exempt from application rate limits", () => {
    const stripeSaas = readRepo("src/app/api/commerce/webhooks/stripe/route.ts");
    const stripeFinance = readRepo("src/app/api/finance/webhooks/stripe/route.ts");
    const signwell = readRepo("src/app/api/leasing/webhooks/signwell/route.ts");
    expect(stripeSaas).not.toContain("consumeRateLimit");
    expect(stripeFinance).not.toContain("consumeRateLimit");
    expect(signwell).not.toContain("consumeRateLimit");
    expect(isWebhookRateLimitExemptPath("/api/commerce/webhooks/stripe")).toBe(true);
    expect(isWebhookRateLimitExemptPath("/api/finance/webhooks/stripe")).toBe(true);
    expect(isWebhookRateLimitExemptPath("/api/leasing/webhooks/signwell")).toBe(true);
  });

  it("authorizes Master Admin search before running it", () => {
    const adminSearch = readRepo("src/app/api/admin/search/route.ts");
    expect(adminSearch.indexOf("isPlatformOperatorUser")).toBeLessThan(
      adminSearch.indexOf("runGlobalOwnerSearch")
    );
    expect(adminSearch).toContain('status: 401');
    expect(adminSearch).toContain('status: 403');
    expect(adminSearch).toContain('class: "ADMIN"');
  });

  it("does not look up SignWell leases by metadata lease_id", () => {
    const route = readRepo("src/app/api/leasing/webhooks/signwell/route.ts");
    expect(route).toContain('.eq("signwell_document_id", documentId)');
    expect(route).toContain("resolveSignWellLeaseCorrelation");
    expect(route).not.toMatch(/\.eq\("id", leaseIdFromMeta\)/);
  });

  it("uses the shared 12-character password contract on set-password paths", () => {
    expect(MIN_PASSWORD_LENGTH).toBe(12);
    const claim = readRepo("src/app/api/commerce/provision/claim-password/route.ts");
    const complimentary = readRepo("src/lib/complimentary-access/service.ts");
    const login = readRepo("src/components/shell/login-form.tsx");
    const reset = readRepo("src/components/auth/reset-password-form.tsx");
    expect(claim).toContain("meetsMinPasswordLength");
    expect(claim).not.toContain("password.length < 8");
    expect(complimentary).toContain("password_too_short");
    expect(login).toContain("meetsMinPasswordLength");
    expect(login).toContain("mode === \"sign_up\"");
    expect(reset).toContain("meetsMinPasswordLength");
  });

  it("keeps upload MIME and size enforcement", () => {
    expect(
      validateMediaUploadIntent({
        mimeType: "application/x-msdownload",
        fileSize: 100,
        relatedEntityType: "maintenance"
      }).ok
    ).toBe(false);
    expect(
      validateMediaUploadIntent({
        mimeType: "image/png",
        fileSize: MEDIA_MAX_IMAGE_BYTES + 1,
        relatedEntityType: "maintenance"
      }).ok
    ).toBe(false);
  });

  it("patches Next.js to the approved 16.2.11 line", () => {
    const pkg = readRepo("package.json");
    expect(pkg).toContain('"next": "16.2.11"');
    expect(pkg).toContain('"eslint-config-next": "16.2.11"');
    expect(pkg).not.toContain('"next": "16.2.10"');
  });

  it("does not persist anonymous client-report org identifiers", () => {
    const route = readRepo("src/app/api/observability/client-report/route.ts");
    expect(route).toContain("persistDurable: Boolean(actorId)");
    expect(route).not.toContain("options.organizationId = body.organizationId");
    expect(route).toContain("MAX_CLIENT_REPORT_BYTES");
  });
});
