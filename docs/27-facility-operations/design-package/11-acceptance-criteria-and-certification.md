# 11 — Acceptance Criteria & Certification Plan

**Parent:** [FAC-OPS-001](./index.md)  
**Status:** Proposed

---

## Package-level acceptance (Approve this design)

Stakeholders Approve when:

- [ ] Vision & promise accepted  
- [ ] FO vs Maintenance vs PM boundaries accepted  
- [ ] Workflow catalog covers module-map ownership stubs  
- [ ] Conceptual data model + prefixes accepted (no SQL required at Approve)  
- [ ] Work-order product context accepted  
- [ ] FO Mission Control attention rules accepted  
- [ ] Subscription alignment confirms no SKU redesign  
- [ ] MA testing plan accepted  
- [ ] Phase E slices E.1–E.6 accepted as Implement order  
- [ ] Capital remains future  

Approve changes package status **Proposed → Approved**. Implement still requires per-slice authorize.

---

## Slice acceptance criteria

### E.1 Site + Mission Control

| # | Criterion |
|---|-----------|
| E1-1 | Entitled org can create and activate a Facility Site |
| E1-2 | `/facility/mission-control` shows attention derived from rules (at least setup_incomplete) |
| E1-3 | Events/audit for site create/activate visible to MA |
| E1-4 | Facility-only org does not see PM leasing/rent modules |
| E1-5 | No new FO business tables beyond site/location needed for profile |
| E1-6 | MA certification checklist Pass recorded |

### E.2 Assets + Systems

| # | Criterion |
|---|-----------|
| E2-1 | CRUD/lifecycle for assets & systems per WF-02/03 |
| E2-2 | Hierarchy + criticality enforced |
| E2-3 | Command Centers show timeline/docs hooks |
| E2-4 | Search returns assets/systems with entitlement filter |
| E2-5 | system_down appears on MC |
| E2-6 | MA lifecycle tests Pass |

### E.3 Corrective FO work

| # | Criterion |
|---|-----------|
| E3-1 | Facility WO create with product_context=facility |
| E3-2 | FO Operations queue filters correctly |
| E3-3 | PM Maintenance queue does not silently own facility WOs |
| E3-4 | Execution assign/complete via reused Maintenance paths |
| E3-5 | Facility-only org can execute without PM SKU |
| E3-6 | Notifications + audit include context |
| E3-7 | MA witness Pass |

### E.4 Preventive

| # | Criterion |
|---|-----------|
| E4-1 | Active schedule computes next due |
| E4-2 | Due generation creates idempotent WO |
| E4-3 | WO close acknowledges run & advances schedule |
| E4-4 | Overdue MC severity works |
| E4-5 | MA Pass |

### E.5 Inventory + Parts

| # | Criterion |
|---|-----------|
| E5-1 | Receive/issue/adjust audited |
| E5-2 | Issue requires WO when policy enforced |
| E5-3 | Stockout MC signal |
| E5-4 | MA Pass |

### E.6 Inspections + Safety + Compliance

| # | Criterion |
|---|-----------|
| E6-1 | Inspection fail spawns facility WO |
| E6-2 | Safety high severity notifies + MC |
| E6-3 | Compliance overdue MC + satisfy with evidence |
| E6-4 | Documents attached & auditable |
| E6-5 | MA Pass |

---

## Product certification (after E.1–E.6)

| Gate | Result meaning |
|------|----------------|
| FO Operational GO | Journeys J-F0–J-F8 Pass on staging with MA evidence |
| Complete Platform GO | Dual MC + launcher without duplicate homes |
| Capital | Separate future certification |

Regression: Property Manager certified paths remain green (automated + smoke).

---

## Certification artifacts (Implement time)

Per slice folder under `docs/27-facility-operations/design-package/certification/eN/` (created when slice ships):

- implementation-status.md  
- master-admin-verification.md  
- workflow-verification.md  
- go-no-go.md  

---

## Related

- [09 MA Testing Plan](./09-master-admin-testing-plan.md)  
- [10 Slices](./10-implementation-order-and-slices.md)  
