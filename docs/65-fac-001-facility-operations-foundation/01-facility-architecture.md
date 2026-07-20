# 01 — Facility Architecture

**Package:** FAC-001  
**Status:** Design ✔ · Document ✔ · Approve Pending · Implement Blocked

---

## Intent

Separate **work coordination** (Maintenance / Work Orders) from **facility memory** (Facility Operations). Coordination remains fast and guided ([DX-003](../60-dx-003-zero-friction-daily-operations/README.md)). Memory remains permanent and searchable.

---

## Layered architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Existing coordination surfaces (UNCHANGED behavior)          │
│  Work Orders · Vendor assign · Ops Today’s Work · ⌘K actions │
└────────────────────────────┬─────────────────────────────────┘
                             │ lifecycle events (complete/close)
                             ▼
┌──────────────────────────────────────────────────────────────┐
│  FacilityOperationsService                                    │
│  • ingest WO completion → Facility Record                     │
│  • append Timeline events                                     │
│  • link Assets / Warranties / Providers / Vault media         │
│  • expose Property / Unit History read models                 │
└───────────────┬───────────────────────────────┬──────────────┘
                ▼                               ▼
┌──────────────────────────┐     ┌──────────────────────────────┐
│  Facility memory store    │     │  Document Vault / Media      │
│  records · timeline ·     │     │  photos · invoices · manuals │
│  assets · warranties ·    │     │  API-002A                    │
│  provider links           │     └──────────────────────────────┘
└──────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────────────────┐
│  Experience surfaces (additive)                               │
│  Facility Ops nav · Property History · Unit History · Search  │
└──────────────────────────────────────────────────────────────┘
```

---

## Module map (product surfaces)

Under **Facility Operations** (additive IA):

| Surface | Purpose |
| --- | --- |
| Repair History | Browse Facility Records |
| Service Providers | Unified provider directory (Vendor migration) |
| Assets | Asset registry foundation |
| Preventive Maintenance | Placeholder / foundation only |
| Warranties | Warranty entities linked to assets/repairs |
| Property Timeline | Permanent event stream |
| Compliance | Placeholders only |
| Documents / Photos | Vault-backed facility media views |

**Hard rule:** Do not create a second work-order product. Maintenance remains the place to create/assign/complete work.

---

## Relationship graph (conceptual)

```
Organization
  └── Property
        ├── Building (optional future; Phase 1 may flatten to Property)
        ├── Unit
        │     ├── Assets
        │     ├── Facility Records
        │     └── Timeline events (unit-scoped)
        ├── Assets (property-scoped)
        ├── Facility Records
        ├── Timeline events
        ├── Warranties
        └── Documents / Photos (vault links)
Service Provider ──assigned to──▶ Work Order / Facility Record
Work Order ──produces──▶ Facility Record (on complete)
Expense (FIN) ──optional link──▶ Facility Record (no accounting rewrite)
```

---

## Isolation rules

| Rule | Requirement |
| --- | --- |
| I-1 | Facility services must not replace MaintenanceService write APIs for WO CRUD |
| I-2 | On WO complete/close, Facility Ops **appends**; it does not mutate historical Facility Records |
| I-3 | Accounting modules never own facility history; optional expense ↔ repair links are references only |
| I-4 | Resident lifecycle emits timeline events; it does not store repair memory |
| I-5 | AI / PM / compliance are consumers of Facility Records — never a parallel history store |

---

## Navigation IA (post-Approve guidance)

Additive only:

- Sidebar / module: **Facility Operations** (or Property → History entry points)  
- Property detail: **History** tab (Repairs, Assets, Documents, Timeline, Stats)  
- Unit detail: **History** tab  
- Maintain existing **Maintenance** and **Vendors** routes during migration ([05](./05-service-provider-model.md))

[DX-003](../60-dx-003-zero-friction-daily-operations/README.md): one recommended path to “see history” — Property History — not three competing archives.

---

## Capability sketch (Approve-time)

Prefer extending maintenance/document capabilities rather than inventing a parallel ACL maze:

| Action | Suggested capability |
| --- | --- |
| Read history | `maintenance:read` or `facility:read` |
| Admin correct Facility Record | `facility:admin` or `maintenance:admin` |
| Manage providers | evolve `vendor:*` → `provider:*` with alias period |

Exact naming is an Approve decision ([12](./12-approval-checklist.md) Q3).

---

## Extension ports (design only)

```
FacilityOperationsService.onWorkOrderCompleted
FacilityOperationsService.appendTimelineEvent
FacilityOperationsService.linkMedia
FacilityOperationsService.getPropertyHealthSignals   // factors only
Future: PreventiveMaintenanceScheduler
Future: FacilityInsightAdapter (IA-001)
Future: ComplianceEngine
```
