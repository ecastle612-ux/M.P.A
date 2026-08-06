# J6 Certification Report — First Maintenance Request

**Package:** LAUNCH-001  
**Journey:** J6 — First Maintenance Request  
**Date:** 2026-08-06  
**Authorization:** `AUTHORIZE LAUNCH-001 JOURNEY J6`  
**Delivery:** Complete (implementation)  
**MA Pass:** Pending operator run of [certification.md](./certification.md)

---

## Customer journey verification (implementation)

| Area | Result |
|------|--------|
| Resident submission | Pass — `/portal/tenant/maintenance` sole create |
| MCC review / prioritize | Pass — `/pm/maintenance` |
| Technician assignment | Pass — assign + progress APIs |
| Vendor assignment | Pass — `vendor_vendors` + `/portal/vendor` |
| Completion | Pass — mark complete |
| Resident confirmation | Pass — closes work order |
| Property Command Center | Pass — open/emergency/assigned/recent |
| Timeline / audit | Pass — `work_order.*` / `vendor.assigned` |
| Assistant / Mission Control | Pass — Review your daily operations. |
| Permissions | Pass — `pm.maintenance:*` + role grants |
| Accessibility / mobile | Pass — stacked MCC + portal forms |
| Regression | Shared + web typecheck/lint |

---

## Maintenance verification

| Check | Result |
|-------|--------|
| One workflow | Pass — no duplicate WO creators |
| Queue / history | Pass |
| Notifications | Pass — `maintenance_notifications` |

---

## Vendor verification

| Check | Result |
|-------|--------|
| Directory reuse | Pass — FO `vendor_vendors` |
| Assignment | Pass — MCC assign vendor |
| Portal progress | Pass — `/portal/vendor` |
| FO payables unchanged | Pass — still FO-only |

---

## Resident verification

| Check | Result |
|-------|--------|
| Submit | Pass |
| Track progress | Pass |
| Confirm completion | Pass |
| History | Pass |

---

## Master Admin / Launch Readiness evidence

| Check | Surface |
|-------|---------|
| Lifecycle checks | `/admin/launch-readiness` J6 panel |
| Timeline / audit | Evidence lists |
| Journey completion | `maintenanceReady` + assistant recommendation |

API: `GET /api/admin/launch/j6?organizationId=<uuid>`

---

## Follow-on

J7 authorized and delivered — see [J7 certification](../j7/certification.md).
