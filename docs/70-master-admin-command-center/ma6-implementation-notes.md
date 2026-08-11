# Master Admin MA-6 — Platform Operations

**Status:** Implemented (slice MA-6)  
**Parent:** [70 Master Admin Command Center](./index.md)  
**Date:** 2026-08-11  

## Delivered

- Operations overview `/admin/operations`
- Work orders `/admin/operations/work-orders` (+ detail `/admin/operations/work-orders/[workOrderId]`)
- Properties & units `/admin/operations/properties`
- Vendors `/admin/operations/vendors`
- Notifications `/admin/operations/notifications`
- Inspect API: `GET /api/admin/operations?view=overview|work-orders|properties|vendors|notifications`
- Nav: Overview · Organizations · Users · Subscriptions · Capacity · Checkout / Provisioning · Webhooks · **Operations** · Audit Log · Errors
- Org Detail deep-links into Operations work orders / vendors / notifications

## Data sources (reuse — no new stores)

| Domain | Source |
|--------|--------|
| Properties | `property_properties` |
| Units | `property_units` |
| Work orders | `maintenance_work_orders` |
| Vendors | `vendor_vendors` |
| Notifications | `maintenance_notifications` |
| Audit (detail) | `audit_events` (read-only context) |

## Health / anomaly rules (factual only)

- **Open buckets:** align with MA-2 (`submitted` / `triaged` / `assigned` = open; `in_progress` separate; terminal = `completed` / `closed` / `cancelled`).
- **Overdue:** `due_at` set and `due_at < now` while not terminal — **no invented SLA age thresholds**.
- **Unassigned:** non-terminal WO with empty/`unassigned` `assignee_type`.
- **Notification health:** `failed` / `queued` → ATTENTION; `sent` / skipped → HEALTHY; otherwise UNKNOWN.
- **Org backlog attention:** overdue count > 0 (factual backlog signal).

## Non-goals

- Work-order / vendor / notification mutations
- Invented vendor ratings or performance scores
- Duplicate commercial capacity math (MA-4 remains authoritative)
- Auto-remediation

## AuthZ

Platform operators only (`isPlatformOperatorUser`). Organization-scoped forged roles → 403.
