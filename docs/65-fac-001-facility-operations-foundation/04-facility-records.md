# 04 — Facility Records

**Package:** FAC-001  
**Status:** Design ✔ · Document ✔ · Approve Pending · Implement Blocked

---

## Intent

A **Facility Record** is the permanent operational memory of facility work. Work Orders coordinate; Facility Records endure.

```
Work Order (temporary coordination)
        ↓  on complete / close
Facility Record (permanent)
        ↓
Timeline + Property/Unit History + Search
```

---

## Creation workflow

1. User completes existing maintenance workflow (unchanged UX).  
2. System detects WO terminal successful state (e.g. closed / resident confirmed — exact statuses Approve Q1).  
3. `FacilityOperationsService` creates Facility Record (idempotent on `work_order_id`).  
4. Links provider snapshot, unit/property, optional asset/warranty.  
5. Attaches vault media already on WO (photos/docs) as FacilityMediaLinks.  
6. Appends Property Timeline event.  
7. WO remains queryable; archival of WO never deletes Facility Record.

**Never editable** by normal users after creation.

---

## Field catalog

| Field | Required | Notes |
| --- | --- | --- |
| Issue | ✔ | From WO title/description |
| Root cause | ✘ | If entered on WO / resolution form |
| Resolution | ✔ | From completion notes |
| Service Provider | ✘→✔ when assigned | Snapshot name + provider id |
| Provider classification | ✔ | Internal staff vs external type |
| Labor | ✘ | Hours / notes if captured |
| Materials | ✘ | Future line items |
| Photos | ✘ | Vault links |
| Documents | ✘ | Invoices, permits, manuals |
| Invoice reference | ✘ | Text or expense link id |
| Warranty expiration | ✘ | From linked warranty or date field |
| Completion date | ✔ | |
| Property | ✔ | |
| Unit | ✘ | When unit-scoped |
| Linked Work Order | ✔ (when from WO) | |
| Notes | ✘ | Completion notes snapshot |
| Cost snapshot | ✘ | Optional display amount; not GL |

---

## Immutability & administrative correction

| Policy | Behavior |
| --- | --- |
| Normal edit | Forbidden |
| Admin correction | Create new Facility Record with `correction_of_id` pointing to prior; mark prior `superseded_by_correction` |
| Audit | Who/when/why required on correction |
| Timeline | Emit `facility.record_corrected` linking both ids |
| Search | Default to active (non-superseded) records; admins may view chain |

There is **no hard delete** in Phase 1.

---

## History retention

Retain indefinitely subject to org legal hold and future retention Approve. Soft-hide superseded records in default UI; never purge silently.

---

## Relationship to expenses (FIN)

Optional `invoice_reference` or `expense_id` for navigation. Facility Ops **must not** create or alter accounting rows. [FIN-001](../64-fin-001-financial-reporting-foundation/README.md) remains separate.

---

## Repair History UX

Facility Operations → **Repair History**:

- Filters: property, unit, provider, date range, asset category  
- Row → Facility Record detail (read-only)  
- Actions: Open Work Order · Open Provider · Open Warranty · Open in Timeline  

Property History → **Repairs** is the same read model scoped to property.
