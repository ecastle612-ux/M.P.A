import { describe, expect, it } from "vitest";
import {
  buildProgress,
  mergeTemplate,
  missingMergeFields,
  type SignaturePackageRecord,
  type SignatureRecipientRecord
} from "./contracts";
import { generateDocumentFromTemplate, hashContent } from "./document-generation";

describe("signature contracts", () => {
  it("merges template fields", () => {
    expect(mergeTemplate("Hello {{name}}", { name: "Ada" })).toBe("Hello Ada");
  });

  it("detects missing required fields", () => {
    expect(missingMergeFields("{{a}} {{b}}", { a: "1" }, ["a", "b"])).toContain("b");
  });

  it("builds progress steps", () => {
    const pkg = {
      id: "1",
      organizationId: "o",
      applicantId: null,
      leaseId: null,
      propertyId: null,
      unitId: null,
      tenantId: null,
      screeningCaseId: null,
      packageNumber: "SIG-1",
      provider: "noop",
      documentType: "lease_agreement",
      status: "sent",
      orderMode: "sequential",
      subject: null,
      message: null,
      externalReference: "x",
      expiresAt: null,
      sentAt: new Date().toISOString(),
      completedAt: null,
      cancelledAt: null,
      signedAt: null,
      vaultStatus: "not_required",
      vaultRetryCount: 0,
      vaultLastError: null,
      residentActivatedAt: null,
      certificateVaultDocumentId: null,
      lastError: null,
      retryCount: 0,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as SignaturePackageRecord;
    const recipients = [
      {
        id: "r1",
        organizationId: "o",
        signatureRequestId: "1",
        role: "primary_applicant",
        fullName: "A",
        email: "a@x.com",
        userId: null,
        applicantId: null,
        tenantId: null,
        signingOrder: 1,
        signingGroup: 1,
        isRequired: true,
        authMethod: "email",
        status: "invited",
        progressToken: null,
        signingUrl: null,
        externalRecipientId: null,
        invitedAt: null,
        viewedAt: null,
        signedAt: null,
        declinedAt: null,
        lastReminderAt: null,
        reminderCount: 0,
        progressUrl: null
      }
    ] as SignatureRecipientRecord[];
    const steps = buildProgress(pkg, recipients);
    expect(steps.find((s) => s.key === "signing")?.status).toBe("active");
  });
});

describe("document generation", () => {
  it("generates hashed preview document", () => {
    const doc = generateDocumentFromTemplate({
      title: "Lease",
      documentType: "lease_agreement",
      context: {
        property_name: "Oak",
        property_address: "1 Main",
        unit_number: "A",
        org_name: "MPA LLC",
        primary_name: "Ada Lovelace",
        primary_email: "ada@example.com",
        lease_start: "2026-08-01",
        lease_end: "2027-07-31",
        rent_amount: "$1,200",
        deposit_amount: "$1,200"
      },
      preview: true
    });
    expect(doc.missingFields).toEqual([]);
    expect(doc.contentText).toContain("PREVIEW");
    expect(doc.contentHash).toBe(hashContent(doc.contentText));
    expect(doc.contentBase64.length).toBeGreaterThan(20);
  });
});
