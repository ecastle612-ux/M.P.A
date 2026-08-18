import { describe, expect, it } from "vitest";
import {
  alreadyHasActiveSignWellRequest,
  resolveSignWellLeaseCorrelation
} from "./correlation";
import { isSignWellCompletedStatus } from "./client";

const lease = {
  id: "lease-a",
  organization_id: "org-a",
  signwell_document_id: "doc-a"
};

describe("SignWell lease correlation", () => {
  it("accepts a lease found by stored SignWell document id", () => {
    expect(
      resolveSignWellLeaseCorrelation({
        signwellDocumentId: "doc-a",
        lease
      })
    ).toEqual({ ok: true, lease });
  });

  it("accepts matching metadata as advisory confirmation", () => {
    expect(
      resolveSignWellLeaseCorrelation({
        signwellDocumentId: "doc-a",
        metadataLeaseId: "lease-a",
        metadataOrganizationId: "org-a",
        lease
      }).ok
    ).toBe(true);
  });

  it("rejects unknown documents", () => {
    expect(
      resolveSignWellLeaseCorrelation({
        signwellDocumentId: "doc-a",
        metadataLeaseId: "lease-b",
        lease: null
      })
    ).toEqual({ ok: false, reason: "unmatched" });
  });

  it("rejects metadata lease_id that does not match the stored document's lease", () => {
    expect(
      resolveSignWellLeaseCorrelation({
        signwellDocumentId: "doc-a",
        metadataLeaseId: "lease-other",
        lease
      })
    ).toEqual({ ok: false, reason: "lease_mismatch" });
  });

  it("rejects metadata organization_id that does not match the stored lease org", () => {
    expect(
      resolveSignWellLeaseCorrelation({
        signwellDocumentId: "doc-a",
        metadataOrganizationId: "org-other",
        lease
      })
    ).toEqual({ ok: false, reason: "organization_mismatch" });
  });

  it("rejects a lease row whose stored document id does not match the event", () => {
    expect(
      resolveSignWellLeaseCorrelation({
        signwellDocumentId: "doc-a",
        metadataLeaseId: "lease-a",
        lease: { ...lease, signwell_document_id: "doc-other" }
      })
    ).toEqual({ ok: false, reason: "document_mismatch" });
  });
});

describe("SignWell send idempotency", () => {
  it("blocks a second send while a pending SignWell request exists", () => {
    expect(
      alreadyHasActiveSignWellRequest({
        status: "pending_signature",
        signwellDocumentId: "doc-a"
      })
    ).toBe(true);
  });

  it("allows send on draft or after a failed send with no document id", () => {
    expect(alreadyHasActiveSignWellRequest({ status: "draft", signwellDocumentId: null })).toBe(
      false
    );
    expect(
      alreadyHasActiveSignWellRequest({
        status: "pending_signature",
        signwellDocumentId: null
      })
    ).toBe(false);
  });
});

describe("SignWell completion mapping", () => {
  it("does not treat declined, canceled, expired, or viewed as completed", () => {
    expect(isSignWellCompletedStatus("declined")).toBe(false);
    expect(isSignWellCompletedStatus("canceled")).toBe(false);
    expect(isSignWellCompletedStatus("cancelled")).toBe(false);
    expect(isSignWellCompletedStatus("expired")).toBe(false);
    expect(isSignWellCompletedStatus("viewed")).toBe(false);
    expect(isSignWellCompletedStatus("completed")).toBe(true);
    expect(isSignWellCompletedStatus("complete")).toBe(true);
  });
});
