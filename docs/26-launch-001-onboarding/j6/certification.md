# J6 Certification — First Maintenance Request

**Parent:** [LAUNCH-001](../index.md)  
**Journey:** [J6](../customer-journeys.md#j6--maintenance--vendor--resolved)  
**Authorization:** `AUTHORIZE LAUNCH-001 JOURNEY J6`  
**Delivery status:** Delivered (implementation)  
**Certification status:** Ready for Master Admin Pass script  

---

## Customer promise

> A resident can report an issue and my team can resolve it completely inside M.P.A.

---

## Outcome

```
Resident Portal → Submit Maintenance Request
  → Maintenance Command Center
  → Prioritize
  → Assign Technician OR Vendor
  → Progress updates → Complete
  → Resident confirms resolution
  → Work order closes
  → Timeline · Audit
  → Mission Control / Assistant → Review your daily operations.
```

---

## One maintenance workflow

| Actor | Surface |
|-------|---------|
| Resident submit / track / confirm | `/portal/tenant/maintenance` (sole create path) |
| PM triage / assign / monitor | `/pm/maintenance` Maintenance Command Center |
| Technician | `/pm/maintenance` (assigned queue + progress) |
| Vendor | `/portal/vendor` (assigned work; reuses `vendor_vendors`) |
| Vendors nav | Points to MCC — no second create path |

Do **not** introduce a second work-order system.

---

## Automatic platform events

| Event | Result |
|-------|--------|
| Created | Appears in MCC; property + resident timeline |
| Triaged | Priority set; resident notified |
| Assigned | Technician queue or vendor portal; notifications |
| Progress / complete | Updates history; resident notified |
| Resident confirmed | Status → closed |
| Timeline / audit | `work_order.*` / `vendor.assigned` |
| Mission Control | → Review your daily operations. |

---

## What shipped

| Surface | Behavior |
|---------|----------|
| Work orders | `maintenance_work_orders` + updates + notifications |
| Permissions | `pm.maintenance:read/write/assign` |
| Property Command Center | Open / emergency / assigned / recently completed |
| Master Admin | Launch Readiness J6 evidence panel |

---

## Customer journey verification

| # | Step | Expected |
|---|------|----------|
| 1 | Complete J5; Mission Control | Next = Submit your first maintenance request |
| 2 | Resident submits | Request in MCC |
| 3 | Prioritize | Priority saved; status triaged+ |
| 4a | Assign technician | Technician notified / can progress |
| 4b | Assign vendor | Vendor portal shows assignment |
| 5 | Complete work | Status completed; resident sees confirm |
| 6 | Resident confirms | Closed |
| 7 | Mission Control | Next = Review today's operations. / Assistant = Review your daily operations. |

---

## Master Admin / Launch Readiness evidence

API: `GET /api/admin/launch/j6?organizationId=<uuid>`  
Panel: `/admin/launch-readiness` J6

---

## STOP

Do not implement J7 until:

```
AUTHORIZE LAUNCH-001 JOURNEY J7
```
