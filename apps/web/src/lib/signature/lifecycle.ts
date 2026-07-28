/**
 * SIGN-002 — shared user-facing signature lifecycle labels.
 * Business UI must use these; never expose provider jargon.
 */

import type { SignaturePackageStatus, SignatureRecipientRecord } from "./contracts";

export const SIGNATURE_LIFECYCLE_LABELS = [
  "Draft",
  "Pending Signature",
  "Viewed",
  "Awaiting Others",
  "Completed",
  "Declined",
  "Expired",
  "Voided",
  "Archived"
] as const;

export type SignatureLifecycleLabel = (typeof SIGNATURE_LIFECYCLE_LABELS)[number];

export function toSignatureLifecycleLabel(
  status: SignaturePackageStatus | string,
  recipients: Array<Pick<SignatureRecipientRecord, "isRequired" | "role" | "status">> = [],
  options: { archived?: boolean } = {}
): SignatureLifecycleLabel {
  if (options.archived) return "Archived";

  const required = recipients.filter((r) => r.isRequired && r.role !== "cc_viewer");
  const anyViewed = required.some((r) => r.status === "viewed" || r.status === "signed");
  const signedCount = required.filter((r) => r.status === "signed").length;

  switch (status) {
    case "draft":
    case "ready_to_send":
      return "Draft";
    case "sent":
      return anyViewed ? "Viewed" : "Pending Signature";
    case "in_progress":
      if (signedCount > 0 && signedCount < required.length) return "Awaiting Others";
      return anyViewed ? "Viewed" : "Pending Signature";
    case "partially_signed":
      return "Awaiting Others";
    case "completed":
    case "awaiting_vault_sync":
      return "Completed";
    case "declined":
      return "Declined";
    case "expired":
      return "Expired";
    case "voided":
      return "Voided";
    case "cancelled":
      return "Voided";
    case "failed":
      return "Declined";
    default:
      return "Draft";
  }
}

export function documentTypeLabel(documentType: string, kind?: string | null): string {
  if (kind === "move_out_ack" || (documentType === "general_pdf" && kind === "move_out_ack")) {
    return "Move-Out Acknowledgement";
  }
  const labels: Record<string, string> = {
    lease_agreement: "Lease Agreement",
    lease_renewal: "Lease Renewal",
    owner_agreement: "Owner Management Agreement",
    move_in_form: "Move-In Acknowledgement",
    general_pdf: "Document",
    inspection_form: "Inspection Sign-Off",
    vendor_agreement: "Vendor Agreement",
    pet_agreement: "Pet Agreement",
    parking_agreement: "Parking Agreement",
    application_consent: "Application Consent",
    addendum: "Addendum",
    other: "Document"
  };
  return labels[documentType] ?? documentType.replaceAll("_", " ");
}
