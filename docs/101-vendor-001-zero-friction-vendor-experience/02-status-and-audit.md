# 02 — Status & Audit

**Package:** VENDOR-001  
**Status:** Draft — Ready for Approval

---

## Status mapping (proposed)

Prefer **additive** statuses or clear aliases over a WO redesign.

| Vendor action | Display | Stored status (proposed) | Notes |
|---------------|---------|--------------------------|-------|
| Scan (view only) | — | unchanged | Audit: `vendor.job.viewed` |
| Start Job | Vendor On Site | `vendor_on_site` **or** existing `arrived`/`in_progress` | Record arrival timestamp |
| Finish Job | Awaiting Approval | `awaiting_approval` | Record completion timestamp |
| PM approves work | Approved | existing completed/approved path | May already exist — reuse |
| Invoice pending | Invoice submitted | invoice status `submitted` | Separate from WO status |
| Invoice approved | — | invoice `approved` | Enables pay |
| Paid | Paid | payment `paid` | Notify vendor |

**Approve-time choice:** Map Start → existing `arrived` if product wants zero new enum values; otherwise add `vendor_on_site` + `awaiting_approval` to the WO status enum with migration.

## Required audit fields

| Event | Payload |
|-------|---------|
| `vendor.job.viewed` | token id, WO id, user-agent hash |
| `vendor.job.started` | arrival_at (device + server), IP hash |
| `vendor.job.completed` | completed_at, notes present?, photo count |
| `vendor.invoice.submitted` | amount, file id |
| `vendor.invoice.approved` / `rejected` | actor user id |
| `vendor.payment.recorded` | amount, method, reference, paid_at |

Use existing `maintenance_activity_events` where possible; add typed vendor job events if schema is too narrow.
