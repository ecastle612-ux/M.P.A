# 10 — Audit Event Matrix

**Package:** SIGN-002  
**Status:** Draft — Ready for Approval  
**Store:** Existing `signature_audit_events` + module timeline where already used

---

## Package-level events (all workflows)

| Event key | When |
|-----------|------|
| `signature.package.created` | Draft created |
| `signature.document.previewed` | Preview generated |
| `signature.package.sent` | Sent to provider |
| `signature.package.failed` | Provider send failure |
| `signature.recipient.reminded` | Reminder |
| `signature.package.cancelled` | Cancelled before complete |
| `signature.recipient.viewed` | Viewed |
| `signature.recipient.signed` | Signed |
| `signature.recipient.declined` | Declined |
| `signature.recipient.expired` | Recipient expired (if tracked) |
| `signature.package.completed` | All required signed |
| `signature.vault.stored` | Executed + certificate stored |
| `signature.vault.awaiting_sync` | Vault retry path |
| `signature.package.voided` | Admin void (use/admin path) |
| `signature.artifact.downloaded` | Executed download (when instrumented) |

Payload must include `organization_id`, `package_id`, and originating entity ids (`lease_id`, `vendor_id`, `work_order_id`, `inspection_id`, `owner_id`, `user_id`, etc.).

---

## Workflow-linked timeline (module)

| ID | Additional domain events (existing or designed elsewhere) |
|----|----------------------------------------------------------|
| A1 | Lease signed / activated timeline |
| A2 | Lease renewed timeline |
| A3 | Owner agreement executed |
| A4 | Move-in acknowledgement completed |
| A5 | Move-out acknowledgement completed |
| B1–B2 | Vendor activated / agreement executed |
| B3 | Work authorization completed |
| B4 | Inspection signed off |
| B5 | Safety acknowledgement completed |
| C1–C2 | Employee/policy acknowledgement completed |
| C3–C4 | Org document executed |

---

## Webhook audit

Provider ingress continues to record `integrations_webhook_events` (API-004). SIGN-002 does not add a second webhook ledger.
