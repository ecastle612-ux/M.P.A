# 07 — Approval Checklist

**Package:** UX-013  
**Status:** 📝 Draft — awaiting sign-off  
**Binding record:** [08 — Approval record](./08-approval-record.md) (empty until signed)

---

## Preconditions

| Check | Status |
|-------|--------|
| Docs 00–09 complete | ☐ |
| ACQ-001 Amendment A11 drafted | ☐ |
| BILL-001 modules-first amendment drafted | ☐ |
| ADR-031 Proposed | ☐ |
| Indexes updated (ACQ, UX-012, Experience Architecture, implementation-gate reminder) | ☐ |
| No UX-013 application/UI code shipped under this package | ☐ |
| Critical OQs reviewed (01–08) | ☐ |

---

## Decision acceptance

| ID | Decision | Accept? |
|----|----------|---------|
| D1 | Modules-first public journey (modules → pricing → Checkout) | ☐ |
| D2 | Remove standalone Free Trial messaging / Trial plan card from public acquisition | ☐ |
| D3 | Self-serve public Checkout: Professional + Business only; Enterprise = Contact Sales | ☐ |
| D4 | No public Sign Up / pre-payment registration | ☐ |
| D5 | Guided Setup continuity — no separate trial workflow | ☐ |
| D6 | Module selection maps onto existing BILL `plan_code` + entitlement metadata (no parallel rail) | ☐ |
| D7 | Contextual nav matrices A–G + triple filter (role · capability · module) | ☐ |
| D8 | ACQ A11 + BILL companion amendment + ADR-031 accepted with this package | ☐ |
| D9 | OQ-01–OQ-08 resolved or explicitly deferred in approval record | ☐ |

---

## Sign-off (fill on Approve)

| Role | Date | Decision |
|------|------|----------|
| Product Owner | | |
| Commercial / Finance (trial & catalog) | | |
| Chief Product Designer / UX | | |
| Lead Architect | | |

---

## Binding phrases (issue only when signing)

```
APPROVE UX-013
ACCEPT ACQ-001 AMENDMENT A11
ACCEPT BILL-001 AMENDMENT MODULES-FIRST PUBLIC CATALOG
ACCEPT ADR-031
```

Slice unlock (after package Approve, separately):

```
AUTHORIZE UX-013 SLICE A
AUTHORIZE UX-013 SLICE B
AUTHORIZE UX-013 SLICE C
AUTHORIZE UX-013 SLICE D
```
