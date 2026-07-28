import { describe, expect, it } from "vitest";
import { documentTypeLabel, toSignatureLifecycleLabel } from "./lifecycle";
import { resolveDocumentTemplate } from "./templates";
import {
  isMoveInAcknowledgementRequired,
  isMoveOutAcknowledgementRequired
} from "./settings";

describe("signature lifecycle labels", () => {
  it("maps package statuses to shared UX labels", () => {
    expect(toSignatureLifecycleLabel("draft")).toBe("Draft");
    expect(toSignatureLifecycleLabel("sent", [{ isRequired: true, role: "primary_applicant", status: "invited" }])).toBe(
      "Pending Signature"
    );
    expect(toSignatureLifecycleLabel("sent", [{ isRequired: true, role: "primary_applicant", status: "viewed" }])).toBe(
      "Viewed"
    );
    expect(
      toSignatureLifecycleLabel("partially_signed", [
        { isRequired: true, role: "primary_applicant", status: "signed" },
        { isRequired: true, role: "property_manager", status: "invited" }
      ])
    ).toBe("Awaiting Others");
    expect(toSignatureLifecycleLabel("completed")).toBe("Completed");
    expect(toSignatureLifecycleLabel("declined")).toBe("Declined");
    expect(toSignatureLifecycleLabel("expired")).toBe("Expired");
    expect(toSignatureLifecycleLabel("voided")).toBe("Voided");
    expect(toSignatureLifecycleLabel("cancelled")).toBe("Voided");
    expect(toSignatureLifecycleLabel("completed", [], { archived: true })).toBe("Archived");
  });

  it("labels Slice A document types without provider jargon", () => {
    expect(documentTypeLabel("lease_agreement")).toBe("Lease Agreement");
    expect(documentTypeLabel("lease_renewal")).toBe("Lease Renewal");
    expect(documentTypeLabel("owner_agreement")).toBe("Owner Management Agreement");
    expect(documentTypeLabel("move_in_form")).toBe("Move-In Acknowledgement");
    expect(documentTypeLabel("general_pdf", "move_out_ack")).toBe("Move-Out Acknowledgement");
    expect(documentTypeLabel("general_pdf")).toBe("Document");
  });
});

describe("signature templates", () => {
  it("resolves Slice A templates", () => {
    expect(resolveDocumentTemplate("lease_renewal").title).toContain("Renewal");
    expect(resolveDocumentTemplate("owner_agreement").title).toContain("Management");
    expect(resolveDocumentTemplate("move_in_form").templateBody).toContain("MOVE-IN");
    expect(resolveDocumentTemplate("general_pdf", "move_out_ack").templateBody).toContain("MOVE-OUT");
  });
});

describe("signature acknowledgement settings", () => {
  it("defaults move-in and move-out acknowledgements to required", () => {
    expect(isMoveInAcknowledgementRequired({ metadata: {} })).toBe(true);
    expect(isMoveOutAcknowledgementRequired({ metadata: {} })).toBe(true);
  });

  it("honors explicit org overrides", () => {
    expect(
      isMoveInAcknowledgementRequired({
        metadata: { move_in_acknowledgement_required: false }
      })
    ).toBe(false);
    expect(
      isMoveOutAcknowledgementRequired({
        metadata: { move_out_acknowledgement_required: false }
      })
    ).toBe(false);
  });
});
