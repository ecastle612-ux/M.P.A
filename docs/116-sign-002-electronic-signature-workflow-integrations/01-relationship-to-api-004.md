# 01 — Relationship to API-004

**Package:** SIGN-002  
**Status:** Draft — Ready for Approval

---

## Binding rule

SIGN-002 **extends** [API-004](../50-api-004-electronic-signatures/README.md). It does **not** redefine `SignatureProvider`, webhook ingress, or provider selection.

```
Module workflow (lease / vendor / owner / …)
  → SignatureService (sole write path)
    → SignatureProvider
      → SignWellProvider | noop
```

If a workflow needs a capability missing from `SignatureProvider`, that is an **API-004 amendment** (Design → Document → Approve), not a SIGN-002 bypass.

---

## Reuse inventory (mandatory)

| Capability | Source | SIGN-002 rule |
|------------|--------|---------------|
| Package CRUD / send / remind / cancel / void | `SignatureService` | Only entry point |
| Provider ceremony | SignWell via ADR-030 | Invisible to users |
| Webhooks | `/api/webhooks/signature/signwell` | Idempotent apply only |
| Document types enum | API-004 contracts | Prefer existing types; add only via API-004 amendment |
| Vault / media | API-002A + API-004 vault handoff | Executed + certificate on complete |
| Permissions | `signature:*` (+ module perms) | See [08](./08-permission-matrix.md) |
| Notifications | API-001 NotificationService | See [09](./09-notification-matrix.md) |
| Audit | `signature_audit_events` (+ module timeline) | See [10](./10-audit-event-matrix.md) |
| Reporting | Existing reporting / Ops / Command Center | See [11](./11-reporting-matrix.md) |

---

## Package ↔ business record binding

Every signature package **must** store:

| Field | Requirement |
|-------|-------------|
| `organization_id` | Always |
| Originating entity | At least one of: `lease_id`, `applicant_id`, `tenant_id`, `property_id`, `unit_id`, plus metadata keys for owner/vendor/work_order/inspection/employee as applicable |
| `document_type` | Canonical API-004 type |
| `package_number` | Human-readable lineage |

Modules surface packages **inside** their existing detail UIs (Documents / Acknowledgements panels). SIGN-002 forbids a separate orphan signature product as the primary UX.

---

## Document type mapping (V1.0)

| Workflow | Preferred `document_type` | Notes |
|----------|---------------------------|-------|
| Lease Agreement | `lease_agreement` | Exists |
| Lease Renewal | `lease_renewal` | Exists; independent package; history retained |
| Owner Management Agreement | `owner_agreement` | Exists |
| Move-In Acknowledgement | `move_in_form` | Exists; may wrap multi-ack content |
| Move-Out Acknowledgement | `general_pdf` or dedicated type | Prefer `general_pdf` until API-004 adds `move_out_form` (non-blocking if metadata `kind=move_out_ack`) |
| Vendor Agreement | `vendor_agreement` | Exists |
| Contractor Agreement | `vendor_agreement` | Same type; metadata `party_kind=contractor` |
| Work Authorization | `general_pdf` | Metadata `kind=work_authorization` |
| Inspection Sign-Off | `inspection_form` | Exists |
| Safety acknowledgement | `general_pdf` | Org-configurable; metadata `kind=safety_ack` |
| Employee / policy | `general_pdf` | Metadata `kind=employee_ack` / `policy_ack` |
| Custom org request | `general_pdf` / `other` | Explicit custom path |

**Rule:** Do not invent parallel type systems in modules. New first-class types require API-004 doc amendment when product needs filter/reporting clarity.

---

## Already shipped (baseline)

API-004 Phase 1 already supports:

- Create/send/remind/cancel packages  
- Lease + applicant `SignaturePackagePanel` for `lease_agreement`  
- Vault sync on complete + resident activation hooks where configured  
- Ops signature widgets / Command Center indexables  

SIGN-002 Slice A **deepens** lease/renewal and adds owner + move-in/out; it does not rebuild the platform.
