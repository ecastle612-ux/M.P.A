# 07 — Work Order Product Context

**Parent:** [FAC-OPS-001](./index.md)  
**Status:** Proposed  
**Resolves:** Module map Design Debt — shared work-order domain; Maintenance executes

---

## Decision

M.P.A. has **one** work-order domain (Shared Platform persistence).  
Product workflows **own intake and meaning**; Maintenance **owns execution**.

```
Facility Operations / PM Maintenance / (future)
        │ creates / contextualizes
        ▼
  Shared Work Order record
        │
        ▼
 Maintenance execution (assign → progress → complete → close)
```

**Forbidden:** A second FO work-order table family or FO-only status machine.

---

## Product context model

Every work order carries:

| Field | Values / meaning |
|-------|------------------|
| `product_context` | `property_manager` · `facility` |
| `work_kind` | `resident_request` · `unit_turnover` · `facility_corrective` · `facility_preventive` · `facility_inspection_corrective` · `facility_safety_corrective` · `other` |
| `source` | `portal_tenant` · `pm_desk` · `facility_ops` · `facility_pm_generator` · `facility_inspection` · `facility_safety` · `system` |
| `site_id` | FO site when facility context |
| `asset_id` / `system_id` | Optional FO links |
| `property_id` / `unit_id` | PM links when residential |
| `priority` | Including `emergency` |
| Standard WO fields | status, assignee, vendor, timestamps, resolution |

---

## Shared status machine (binding)

```
draft → open → assigned → in_progress → completed → closed
                 ↘ cancelled
```

Product-specific UI may label states but must not add divergent primary statuses. Optional substates only if Approved later.

---

## Who may do what

| Action | Facility context | PM residential context |
|--------|------------------|------------------------|
| Create | FO entitled + permission | PM maintenance entitled |
| View in FO Operations queue | FO roles | N/A (filtered out) |
| View in PM Maintenance queue | Complete/PM+FO: show with filter; Facility-only org: FO execution UI may reuse Maintenance components under FO entitlement | PM roles |
| Assign tech/vendor | Maintenance execute permission (or FO execute if Facility-only org policy) | Maintenance |
| Complete / close | Executor roles | Executor roles |

**Facility-only orgs:** There is no PM Maintenance SKU. Execution UI is the **same component family** mounted under FO entitlements (reuse, not clone business rules).

---

## Queue filtering

| Surface | Default filter |
|---------|----------------|
| `/facility/operations` | `product_context=facility` |
| `/pm/maintenance` | `product_context=property_manager` |
| Complete Platform toggle | User-selected context; never silent mix without label |

---

## Generation rules (FO → WO)

| Source | work_kind | source |
|--------|-----------|--------|
| Manual FO create | `facility_corrective` | `facility_ops` |
| PM schedule due | `facility_preventive` | `facility_pm_generator` |
| Inspection fail item | `facility_inspection_corrective` | `facility_inspection` |
| Safety action | `facility_safety_corrective` | `facility_safety` |

Idempotency: PM generator uses `(schedule_id, due_on)` unique work key.

---

## Notifications & timeline

Use shared notification + timeline services. Payload always includes `product_context` and FO ids when present so MC and Assistant can route.

---

## Acceptance for this design

- [ ] Single WO domain affirmed  
- [ ] Context fields specified  
- [ ] No FO duplicate home for execution  
- [ ] Facility-only org execution path defined as reuse  

---

## Related

- [02 Operational Philosophy](./02-operational-philosophy.md)  
- [04 WF-04 / WF-05](./04-workflow-catalog.md)  
