# 12 — Approval Checklist

**Package:** FAC-001  
**Status:** Design ✔ · Document ✔ · **Approved** · Implement unlocked (Slice A)  
**Policy:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)

---

## How approval works

Silence is not approval. A gate owner must:

1. Resolve open decisions (below)  
2. Check every box in this document  
3. Change package README **Status** to: `Approved — Ready for Implement`  
4. Set Gate line to: Design ✔ · Document ✔ · **Approved** · Implement unlocked  

Until then: **no application code, migrations, schema changes, API routes, or UI implementation.**

---

## Package completeness

- [x] [README](./README.md) reviewed  
- [x] [00 Executive Summary](./00-executive-summary.md) reviewed  
- [x] [01 Facility Architecture](./01-facility-architecture.md) reviewed  
- [x] [02 Facility Data Model](./02-facility-data-model.md) reviewed  
- [x] [03 Property Timeline](./03-property-timeline.md) reviewed  
- [x] [04 Facility Records](./04-facility-records.md) reviewed  
- [x] [05 Service Provider Model](./05-service-provider-model.md) reviewed  
- [x] [06 Asset Foundation](./06-asset-foundation.md) reviewed  
- [x] [07 Property Health](./07-property-health.md) reviewed (factors only — no score)  
- [x] [08 Search Architecture](./08-search-architecture.md) reviewed  
- [x] [09 Future Roadmap](./09-future-roadmap.md) accepted as **non-implement** for Phase 1  
- [x] [10 Risks](./10-risks.md) acknowledged  
- [x] [11 Definition of Done](./11-definition-of-done.md) accepted as post-Approve bar  

---

## Architecture decisions

- [x] Work Orders remain coordination; Facility Records are permanent memory  
- [x] Existing maintenance / vendor assignment behavior must not break  
- [x] Facility Ops does not mutate accounting  
- [x] Operations Center / Resident workflows / FIN-001 unchanged in Phase 1  
- [x] Future PM / AI / compliance plug into Facility Ops — no parallel history  

---

## Product decisions (record answers)

### Q1 — WO statuses that mint Facility Records

- [x] Decision recorded

**Decision:** Mint on status `completed` (no separate closed status in current WO model). Reopen must not create a second record; refresh the same Facility Record lifecycle until final completion.  
**Date / owner:** 2026-07-18 / EP-002 Slice A authorization  

### Q2 — Vendor → Service Provider migration depth (Phase 1)

- [x] A) Bridge only (recommended)  

**Decision:** Bridge only — continue Vendor workflow/UI; store `legacy_vendor_id` / provider snapshot fields on Facility Record. No UI rename. No data migration.  
**Date / owner:** 2026-07-18 / EP-002 Slice A authorization  

### Q3 — Capabilities

- [x] Reuse `maintenance:read` / add `facility:*` / other  

**Decision:** Reuse `maintenance:read` for Facility Record / timeline reads; `maintenance:update` for system minting on WO complete and administrative corrections. No new `facility:*` capabilities in Slice A.  
**Date / owner:** 2026-07-18 / EP-002 Slice A authorization  

### Q4 — Building entity in Phase 1

- [x] Property-only (nullable building later) / include Building now  

**Decision:** Property-only for Slice A. `building_id` nullable column reserved without Building entity/UI.  
**Date / owner:** 2026-07-18 / EP-002 Slice A authorization  

### Q5 — Navigation entry

- [x] New Facility Operations module / Property History tabs first / both  

**Decision:** Property History + Unit History surfaces first, plus Work Order “View Facility Record” after completion. No full Facility Operations module nav in Slice A.  
**Date / owner:** 2026-07-18 / EP-002 Slice A authorization  

---

## Non-goals confirmation

Approvers confirm Phase 1 / Slice A will **not** include:

- [x] Work order UX/status redesign  
- [x] Breaking vendor assignment  
- [x] Accounting / FIN-001 changes  
- [x] Operations Center behavior changes  
- [x] PM schedules, predictive maintenance, AI scoring, compliance engine  

---

## Cross-link alignment

- [x] Compatible with [Phase 6 Maintenance](../26-phase-6-maintenance-foundation/README.md)  
- [x] Compatible with [Phase 7 Vendor](../27-phase-7-vendor-foundation/README.md)  
- [x] Aligns with [WF-003](../55-wf-003-resident-lifecycle/00-executive-summary.md) timeline emissions  
- [x] Aligns with [DX-003](../60-dx-003-zero-friction-daily-operations/README.md) / [DX-004](../61-dx-004-five-minute-rule/README.md)  
- [x] Aligns with [IA-001](../62-ia-001-intelligent-property-operations/README.md) hook boundaries  
- [x] Supports [MOAT-001](../63-moat-001-competitive-advantage-blueprint/README.md) facility memory moat  
- [x] Compatible with [FIN-001](../64-fin-001-financial-reporting-foundation/README.md) (reference links only)  
- [x] Compatible with [Document Vault / API-002A](../46-api-002a-universal-media-foundation/README.md)  
- [x] Respects [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)  

---

## Sign-off

| Role | Name | Date | Signature / ack |
| --- | --- | --- | --- |
| Product | EP-002 authorization | 2026-07-18 | Approved — Slice A |
| Lead Architect | EP-002 authorization | 2026-07-18 | Approved — Slice A |
| Security (retention / media) | EP-002 authorization | 2026-07-18 | Vault-reference model accepted |

**Approve result:** ☑ Approved · ☐ Changes requested · ☐ Rejected  

**Notes:**

Slice A — Permanent Repair History only. Assets / PM / Property Health / Compliance / AI remain blocked.

---

## After Approve

1. Update this package README gate status ✔  
2. Open Implement work citing FAC-001 docs + DoD ✔ (EP-002 Slice A)  
3. Material changes restart Design → Document → Approve  
