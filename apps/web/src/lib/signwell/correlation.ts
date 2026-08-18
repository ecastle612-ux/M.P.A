/**
 * SignWell webhook → lease correlation.
 * Stored signwell_document_id is authoritative. Metadata is advisory only.
 */

export type SignWellLeaseCorrelationRow = {
  id: string;
  organization_id: string;
  signwell_document_id: string | null;
};

export type SignWellCorrelationResult =
  | { ok: true; lease: SignWellLeaseCorrelationRow }
  | {
      ok: false;
      reason: "unmatched" | "document_mismatch" | "lease_mismatch" | "organization_mismatch";
    };

export function resolveSignWellLeaseCorrelation(input: {
  signwellDocumentId: string;
  metadataLeaseId?: string | null;
  metadataOrganizationId?: string | null;
  lease: SignWellLeaseCorrelationRow | null;
}): SignWellCorrelationResult {
  const documentId = input.signwellDocumentId.trim();
  if (!documentId || !input.lease) {
    return { ok: false, reason: "unmatched" };
  }

  if ((input.lease.signwell_document_id ?? "").trim() !== documentId) {
    return { ok: false, reason: "document_mismatch" };
  }

  const metadataLeaseId = input.metadataLeaseId?.trim();
  if (metadataLeaseId && metadataLeaseId !== input.lease.id) {
    return { ok: false, reason: "lease_mismatch" };
  }

  const metadataOrganizationId = input.metadataOrganizationId?.trim();
  if (metadataOrganizationId && metadataOrganizationId !== input.lease.organization_id) {
    return { ok: false, reason: "organization_mismatch" };
  }

  return { ok: true, lease: input.lease };
}

/** True when a new SignWell document would orphan an existing request. */
export function alreadyHasActiveSignWellRequest(input: {
  status: string;
  signwellDocumentId?: string | null;
}): boolean {
  return input.status === "pending_signature" && Boolean(input.signwellDocumentId?.trim());
}
