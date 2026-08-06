export const LEASE_AUDIT_ACTIONS = [
  "lease.created",
  "lease.document_generated",
  "lease.sent_for_signature",
  "lease.signed",
  "lease.activated",
  "lease.signature_failed"
] as const;
export type LeaseAuditAction = (typeof LEASE_AUDIT_ACTIONS)[number];

export type LeaseAuditDefinition = {
  action: LeaseAuditAction;
  entityType: string;
  description: string;
};

export const LEASE_AUDIT_CATALOG: readonly LeaseAuditDefinition[] = [
  {
    action: "lease.created",
    entityType: "lease_agreements",
    description: "Lease created via Leasing path (J4)"
  },
  {
    action: "lease.document_generated",
    entityType: "lease_agreements",
    description: "Lease document generated"
  },
  {
    action: "lease.sent_for_signature",
    entityType: "lease_agreements",
    description: "Lease sent for electronic signature via SignWell"
  },
  {
    action: "lease.signed",
    entityType: "lease_agreements",
    description: "Lease signed (SignWell completed or offline honesty path)"
  },
  {
    action: "lease.activated",
    entityType: "lease_agreements",
    description: "Lease activated with resident/portal/rent/occupancy"
  },
  {
    action: "lease.signature_failed",
    entityType: "lease_agreements",
    description: "SignWell failure recorded"
  }
];

export function isLeaseAuditAction(value: string): value is LeaseAuditAction {
  return (LEASE_AUDIT_ACTIONS as readonly string[]).includes(value);
}
