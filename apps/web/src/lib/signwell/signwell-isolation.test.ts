import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const webRoot = join(process.cwd(), "src");

function read(rel: string): string {
  return readFileSync(join(webRoot, rel), "utf8");
}

describe("SignWell server-only isolation", () => {
  it("does not expose SignWell secrets on NEXT_PUBLIC_ vars", () => {
    const envExample = readFileSync(join(process.cwd(), ".env.example"), "utf8");
    expect(envExample).not.toMatch(/NEXT_PUBLIC_SIGNWELL/);
    expect(read("lib/env/server-env.ts")).toMatch(/SIGNWELL_API_KEY: process\.env\["SIGNWELL_API_KEY"\]/);
    expect(read("lib/signwell/client.ts")).toMatch(/from "\.\.\/env\/server-env"/);
  });

  it("send path uploads a SignWell-supported HTML file, not raw .txt", () => {
    expect(read("lib/leasing/lease-service.ts")).toMatch(/leaseDocumentToSignWellUpload/);
    expect(read("lib/leasing/document.ts")).toMatch(/\.html/);
  });

  it("send path refuses a second SignWell document for the same pending lease", () => {
    const source = read("lib/leasing/lease-service.ts");
    expect(source).toMatch(/alreadyHasActiveSignWellRequest/);
    expect(source).toMatch(/alreadySent: true/);
    expect(read("components/leasing/lease-command-center.tsx")).toMatch(
      /pending_signature" && !data\.lease\.signwellDocumentId/
    );
  });

  it("lease embeds disambiguate pm_residents through resident_id", () => {
    expect(read("lib/leasing/lease-service.ts")).toMatch(/pm_residents!resident_id\(/);
    expect(read("lib/leasing/lease-service.ts")).not.toMatch(
      /property_units\(id, unit_label, status\), pm_residents\(/
    );
  });

  it("webhook correlates only through stored signwell_document_id", () => {
    const source = read("app/api/leasing/webhooks/signwell/route.ts");
    expect(source).toMatch(/resolveSignWellLeaseCorrelation/);
    expect(source).toMatch(/\.eq\("signwell_document_id", documentId\)/);
    expect(source).not.toMatch(/\.eq\("id", leaseIdFromMeta\)/);
  });

  it("Documents maps completed SignWell files onto the existing externalUrl control", () => {
    const client = read("lib/signwell/client.ts");
    const documents = read("lib/documents/document-service.ts");
    expect(client).toMatch(/completed_pdf\?url_only=true/);
    expect(client).toMatch(/getSignWellCompletedPdfUrl/);
    expect(documents).toMatch(/getSignWellCompletedPdfUrl/);
    expect(documents).toMatch(/resolveSignWellExternalFileUrl/);
    expect(read("components/documents/documents-workspace.tsx")).toMatch(/Open external file/);
  });
});
