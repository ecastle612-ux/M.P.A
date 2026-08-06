export const LEASE_EVENT_TYPES = [
  "lease.created",
  "lease.document_generated",
  "lease.sent_for_signature",
  "lease.signed",
  "lease.activated",
  "lease.signature_failed"
] as const;
export type LeaseEventType = (typeof LEASE_EVENT_TYPES)[number];

export type LeaseEventDefinition = {
  type: LeaseEventType;
  aggregateType: string;
  description: string;
  auditAction: string;
};

export const LEASE_EVENT_CATALOG: readonly LeaseEventDefinition[] = [
  {
    type: "lease.created",
    aggregateType: "lease_agreements",
    description: "Lease draft created from a pending resident",
    auditAction: "lease.created"
  },
  {
    type: "lease.document_generated",
    aggregateType: "lease_agreements",
    description: "Lease document generated for signature",
    auditAction: "lease.document_generated"
  },
  {
    type: "lease.sent_for_signature",
    aggregateType: "lease_agreements",
    description: "Lease sent through SignWell (or queued)",
    auditAction: "lease.sent_for_signature"
  },
  {
    type: "lease.signed",
    aggregateType: "lease_agreements",
    description: "Lease signatures completed",
    auditAction: "lease.signed"
  },
  {
    type: "lease.activated",
    aggregateType: "lease_agreements",
    description: "Lease activated — resident, portal, rent, occupancy",
    auditAction: "lease.activated"
  },
  {
    type: "lease.signature_failed",
    aggregateType: "lease_agreements",
    description: "SignWell send or sync failed",
    auditAction: "lease.signature_failed"
  }
];

export function isLeaseEventType(value: string): value is LeaseEventType {
  return (LEASE_EVENT_TYPES as readonly string[]).includes(value);
}
