import { describe, expect, it } from "vitest";
import { resolveSignWellLeaseCorrelation } from "./signwell-lease-correlation";

const lease = {
  id: "lease-a",
  organization_id: "org-a",
  status: "pending_signature"
};

describe("SEC-001 SignWell document correlation", () => {
  it("activates when the stored document matches and metadata agrees", () => {
    expect(
      resolveSignWellLeaseCorrelation({
        documentId: "doc-1",
        leasesByDocumentId: [lease],
        metadataLeaseId: "lease-a",
        metadataOrganizationId: "org-a"
      })
    ).toEqual({ kind: "activate", lease });
  });

  it("activates when metadata is absent", () => {
    expect(
      resolveSignWellLeaseCorrelation({
        documentId: "doc-1",
        leasesByDocumentId: [lease]
      })
    ).toEqual({ kind: "activate", lease });
  });

  it("ignores a matching document when metadata points at another lease", () => {
    expect(
      resolveSignWellLeaseCorrelation({
        documentId: "doc-1",
        leasesByDocumentId: [lease],
        metadataLeaseId: "lease-other",
        metadataOrganizationId: "org-a"
      })
    ).toEqual({ kind: "ignored", reason: "metadata_mismatch" });
  });

  it("does not follow metadata to another organization", () => {
    expect(
      resolveSignWellLeaseCorrelation({
        documentId: "doc-1",
        leasesByDocumentId: [lease],
        metadataLeaseId: "lease-a",
        metadataOrganizationId: "org-other"
      })
    ).toEqual({ kind: "ignored", reason: "cross_org" });
  });

  it("returns unmatched for an unknown document", () => {
    expect(
      resolveSignWellLeaseCorrelation({
        documentId: "doc-unknown",
        leasesByDocumentId: [],
        metadataLeaseId: "lease-a"
      })
    ).toEqual({ kind: "unmatched" });
  });

  it("never uses metadata to invent a lease when the document is unknown", () => {
    const result = resolveSignWellLeaseCorrelation({
      documentId: "doc-unknown",
      leasesByDocumentId: [],
      metadataLeaseId: "lease-b"
    });
    expect(result.kind).toBe("unmatched");
    expect(result).not.toMatchObject({ lease: { id: "lease-b" } });
  });
});
