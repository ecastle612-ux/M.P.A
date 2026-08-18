/**
 * Canonical SignWell → lease binding.
 * Document identity is authoritative. Metadata lease_id / organization_id are
 * consistency checks only and must never redirect an event to another lease.
 */

export type SignWellCorrelatedLease = {
  id: string;
  organization_id: string;
  status?: string;
};

export type SignWellLeaseCorrelation =
  | { kind: "activate"; lease: SignWellCorrelatedLease }
  | { kind: "unmatched" }
  | { kind: "ignored"; reason: "metadata_mismatch" | "cross_org" };

export function resolveSignWellLeaseCorrelation(input: {
  documentId: string;
  leasesByDocumentId: SignWellCorrelatedLease[];
  metadataLeaseId?: string | null;
  metadataOrganizationId?: string | null;
}): SignWellLeaseCorrelation {
  const documentId = input.documentId.trim();
  if (!documentId) {
    return { kind: "unmatched" };
  }

  const matches = input.leasesByDocumentId.filter((lease) => lease.id);
  if (matches.length === 0) {
    return { kind: "unmatched" };
  }

  const lease = matches[0];
  if (!lease) {
    return { kind: "unmatched" };
  }

  const metadataLeaseId = input.metadataLeaseId?.trim() || null;
  const metadataOrganizationId = input.metadataOrganizationId?.trim() || null;

  if (metadataLeaseId && metadataLeaseId !== lease.id) {
    return { kind: "ignored", reason: "metadata_mismatch" };
  }
  if (metadataOrganizationId && metadataOrganizationId !== lease.organization_id) {
    return { kind: "ignored", reason: "cross_org" };
  }

  return { kind: "activate", lease };
}
