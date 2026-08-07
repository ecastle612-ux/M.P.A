# 10 — Implementation Order & Slices

**Parent:** [FAC-OPS-001](./index.md)  
**Status:** Approved  
**Binding sequence:** Matches Approved Phase E in [implementation-order-after-reset.md](../../24-product-architecture/implementation-order-after-reset.md)  
**Rule:** Do not invent a parallel roadmap. Each slice requires Approve (package) + **slice authorize** before code.

---

## Preconditions (before any FO feature code)

1. This design package **Approved**  
2. CI green on authoritative `main`  
3. Property Manager feature freeze respected  
4. Explicit `AUTHORIZE FACILITY OPERATIONS PHASE E.x IMPLEMENT`

---

## Slice map

| Slice | Name | Customer value | Independently testable | Certifiable | Reuses |
|-------|------|----------------|------------------------|-------------|--------|
| **E.1** | Site profile + FO Mission Control attention | Operable FO home with honest attention | Yes | Yes | MC shell, events, entitlements, MA |
| **E.2** | Assets + Building Systems | Registry of what we operate | Yes | Yes | Documents, search, timeline, audit |
| **E.3** | Corrective facility work (shared WO context) | Open/track facility WOs; Maintenance executes | Yes | Yes | Shared WO, Maintenance execution, notifications |
| **E.4** | Preventive Maintenance programs | Schedules generate work | Yes (needs E.2–E.3) | Yes | WO context, jobs/automation, MC |
| **E.5** | Inventory + Parts | Storeroom truth; issue to WO | Yes (issue needs E.3) | Yes | Audit, MC stockout |
| **E.6** | Inspections + Safety + Compliance | Risk & evidence programs | Yes | Yes | Docs, WO spawn, MC |
| **E.7** | Capital Projects | Future CapEx portfolio | Future gate | Future | — |

---

## Slice E.1 — detail

**In**

- FacilitySite entity + settings UX  
- Guided Setup step for site activate  
- FO Mission Control attention engine for signals available at E.1 (`setup_incomplete`, and placeholders that become live as later slices ship)  
- MA witness for site activate + MC load  

**Out**

- Assets, PM, inventory, inspections, safety, compliance feature depth  
- Capital  

**Exit criteria:** See [11](./11-acceptance-criteria-and-certification.md) E.1

---

## Slice E.2 — detail

**In:** AssetCategory, Asset hierarchy, BuildingSystem, Asset/System Command Centers, search index, MC signals for system_down (manual status)  
**Out:** PM generation, inventory, inspections  

---

## Slice E.3 — detail

**In:** `product_context` on shared WO; FO Operations queue; create facility WO with asset/system; execution via reused Maintenance components; queue filters  
**Out:** PM generator, inspection auto-spawn (can manual link)

---

## Slice E.4 — detail

**In:** PMSchedule, due evaluation, WO generation idempotency, MC pm_due/overdue, acknowledge on WO close  
**Depends:** E.2 + E.3  

---

## Slice E.5 — detail

**In:** Parts, InventoryLocation, InventoryStock, movements, issue-to-WO, stockout MC  
**Depends:** E.3 for issue link  

---

## Slice E.6 — detail

**In:** InspectionProgram/Run, SafetyIncident, ComplianceObligation, evidence docs, spawn WOs, MC signals  
**Depends:** E.3 for corrective spawn; Documents shared  

---

## Slice E.7 — future

Capital Projects entitlement flag + portfolio UX — separate design confirm optional; not in first Approve Implement wave.

---

## Parallelism

E.5 may overlap E.4 only after E.3 certified.  
E.6 after E.3.  
Never start E.3 before E.1 site identity exists.

---

## STOP discipline

After each slice: certify → STOP → wait for next slice authorize.  
No “while we’re here” expansion into the next slice.
