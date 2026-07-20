# FAC-001 — Facility Operations Foundation

**Status:** Design ✔ · Document ✔ · **Approved** · Implement unlocked (Slice A + Slice B + Slice C)  
**Initiative ID:** FAC-001  
**Gate:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)  
**Type:** Platform foundation (permanent facility memory) — **not** a work-order redesign

---

## Objective

Design **Facility Operations** as a core pillar of M.P.A.’s Property Operations Platform so every repair, inspection, asset event, warranty, vendor visit, and maintenance decision becomes part of a property’s **permanent operational record**.

---

## Platform pillars (binding vision)

| Pillar | Role |
| --- | --- |
| Resident Operations | People, leases, move-in/out, communications |
| **Facility Operations** | Buildings, assets, repairs, providers, compliance memory |
| Financial Operations | Charges, payments, expenses, reporting ([FIN-001](../64-fin-001-financial-reporting-foundation/README.md)) |
| Business Operations | Ops OS, Command Center, migration, AI assist |

FAC-001 defines Facility Operations only.

---

## Gate status

| Stage | Status |
| --- | --- |
| Design | ✔ Complete (this package) |
| Document | ✔ Complete (this package) |
| Approve | **Approved** (2026-07-18 Slice A/B · 2026-07-19 Slice C) |
| Implement | **Unlocked for Slice A + Slice B + Slice C** · Slice C delivered ([13](./13-slice-c-delivery.md)) |

### Approved Slice A — Permanent Repair History

In scope:

- Facility Record auto-created when Work Order reaches `completed`
- Exactly one Facility Record per Work Order (idempotent; reopen refreshes lifecycle)
- Property + Unit Repair History (newest first, searchable/filterable)
- Work Order “View Facility Record” after completion
- Property Timeline architecture for repair-completion events only
- Keyword search for Facility Records (Command Center)
- Document Vault references (no duplicate storage)
- Vendor bridge fields only (no UI rename / migration)

### Approved Slice B — Property Timeline & Service Provider Intelligence

In scope (EP-002 Slice B authorization, 2026-07-18):

- Premium Property Timeline (cross-pillar events, filters, keyword search)
- Unit Timeline
- Property Overview sections (Recent Activity / Repairs / Timeline / Documents / Upcoming placeholder)
- Service Provider Intelligence (computed over Vendor bridge — no workflow redesign)
- Read-only Service Provider profile enrichment
- Expanded Facility Search + Command Center (timeline, providers, repairs, history)
- Ingest hooks: repairs, resident move-in/out, lease sign/renew, announcements, major expenses
- Future hooks only (no Assets / PM / Health scoring / AI)

### Approved Slice C — Asset Foundation

In scope (EP-005 Slice C authorization, 2026-07-19):

- `FacilityAsset` registry (property / optional building / optional unit / common area)
- Extensible asset types (HVAC, water heater, roof, …, custom)
- Asset profile (read-only): overview, repair history, timeline, documents, photos, warranty & future-maintenance placeholders
- Optional Facility Record → Asset link (repairs accumulate; no duplicate history)
- Property Assets section + Unit Assets (unit-scoped only)
- Facility Search + Command Center surfaces for Assets
- Document Vault entity type `asset` (no duplicate storage)

Out of scope (remain blocked):

- Preventive Maintenance, Warranty engine, Replacement planning, Property Health scoring
- AI recommendations, Compliance engines, Depreciation, Capital planning
- Asset Passports product, Vendor ratings, Building dashboards
- Work Order / Accounting / Resident / FIN-001 / Operations Center redesigns

---

## Core philosophy (binding)

```
Work Order  →  coordinates work (temporary)
Facility Record  →  permanent memory (never disappears)
```

- Maintenance workflows remain the **coordination** surface.  
- Facility Records are the **system of record for history**.  
- Closing a work order must **append** history — never erase it.  
- Property managers must never need tribal knowledge to answer: when / who / cost / warranty / recurrence.

---

## Cross-links

| Package / surface | Relationship |
| --- | --- |
| [Phase 6 Maintenance](../26-phase-6-maintenance-foundation/README.md) | Existing WO lifecycle — extend beneath; do not redesign |
| [Phase 7 Vendor](../27-phase-7-vendor-foundation/README.md) | Migration source for Service Provider model |
| [WF-003 Resident Lifecycle](../55-wf-003-resident-lifecycle/00-executive-summary.md) | Timeline events (move-in/out) feed Property Timeline |
| [DX-003 Zero Friction](../60-dx-003-zero-friction-daily-operations/README.md) | One path to Facility History; no competing history UIs |
| [DX-004 Five-Minute Rule](../61-dx-004-five-minute-rule/README.md) | Command Center / Today’s Work may deep-link into History |
| [IA-001 Intelligent Ops](../62-ia-001-intelligent-property-operations/README.md) | Future insights over Facility Records (hooks only) |
| [MOAT-001](../63-moat-001-competitive-advantage-blueprint/README.md) | Facility memory as durable switching cost |
| [FIN-001](../64-fin-001-financial-reporting-foundation/README.md) | Expenses may link to repairs; accounting unchanged |
| [Operations Center](../30-product-experience/04-dashboard-experience.md) | Surface health signals later — behavior unchanged in FAC-001 Phase 1 |
| [Document Vault / API-002A](../46-api-002a-universal-media-foundation/README.md) · [Phase 12 Vault](../41-phase-12-resident-experience-digital-operations/02-architecture-and-integration.md) | Photos, invoices, warranties, manuals |
| [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md) | Gate policy |

---

## Package contents

| Doc | Purpose |
| --- | --- |
| [00 — Executive Summary](./00-executive-summary.md) | Vision, success test, non-goals |
| [01 — Facility Architecture](./01-facility-architecture.md) | Layers, boundaries, module map |
| [02 — Facility Data Model](./02-facility-data-model.md) | Entities and relationships |
| [03 — Property Timeline](./03-property-timeline.md) | Permanent event stream |
| [04 — Facility Records](./04-facility-records.md) | Immutable repair / facility memory |
| [05 — Service Provider Model](./05-service-provider-model.md) | Unified providers + Vendor migration |
| [06 — Asset Foundation](./06-asset-foundation.md) | Assets, lifecycle hooks |
| [07 — Property Health](./07-property-health.md) | Contributing factors (no scoring algo) |
| [08 — Search Architecture](./08-search-architecture.md) | Facility Search contracts |
| [09 — Future Roadmap](./09-future-roadmap.md) | PM, AI, compliance — document only |
| [10 — Risks](./10-risks.md) | Dual truth, migration, scope creep |
| [11 — Definition of Done](./11-definition-of-done.md) | Post-Approve acceptance |
| [12 — Approval Checklist](./12-approval-checklist.md) | Explicit Approve gate |

---

## Binding rules (post-Approve)

1. **Extend, don’t replace:** Existing WO create/assign/complete/close paths keep current behavior.  
2. **Append-only history:** Facility Records are immutable except admin correction with audit.  
3. **Vendor continuity:** Service Provider is a generalization; current vendor assignment must keep working during migration.  
4. **No accounting mutation:** Facility Ops never writes charges/payments/expenses as bookkeeping.  
5. **Vault-first media:** Photos/docs use API-002A / Document Vault — no parallel upload systems.  
6. **Future plugs in:** PM schedules, AI, compliance engines consume Facility Records — they do not invent parallel history.  
7. Material scope changes restart Design → Document → Approve.

---

## Success test

> If a property manager owns this building for **15 years**, can every repair, inspection, replacement, warranty, document, and maintenance decision still be found inside M.P.A.?

If **yes**, the architecture is correct.

---

## Explicit non-goals (Slice A / Phase 1 Implement)

- Redesigning work-order UX or status machines  
- Breaking vendor assignments  
- Changing accounting or FIN-001  
- Changing Resident workflows or Operations Center behavior  
- Implementing preventive schedules, predictive maintenance, or AI scoring  
- Assets, Property Health scoring, Compliance engines, Building dashboards  
