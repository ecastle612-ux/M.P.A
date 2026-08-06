# LAUNCH-001 — Customer #1 Production Readiness

**Status:** Draft — awaiting authorization  
**Program ID:** LAUNCH-001  
**Date:** 2026-08-06  
**Type:** Launch program (Design · Documentation · Product Strategy · Launch Planning)  
**Implementation:** **Forbidden** except work that removes a documented Launch Blocker on the Launch Board  
**Gate:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-017](../18-decision-log/adr-017-launch-001-customer-one-production-readiness.md)

---

## Authorization request

**Authorize LAUNCH-001** as the governing program until M.P.A. successfully onboards its **first paying customer**.

| Relationship | Rule |
|--------------|------|
| **LAUNCH-001** | Highest priority until Customer #1 retained |
| **CORE-004** | Remains the long-term platform roadmap — **not replaced**, **paused for new capability work** |
| New features | Only if they remove a **🔴 Launch Blocker** on the [Launch Board](./launch-readiness-board.md) |

---

## Mission

Transition M.P.A. from a development project into a **commercially deployable SaaS platform**.

The question is no longer “what feature next?”  
It is: **what prevents us from successfully onboarding and retaining Customer #1?**

Priority stack:

```
Launch Blockers
      ↓
Customer #1 Success
      ↓
Commercial Readiness
      ↓
Production Readiness
      ↓
Post-Launch Expansion (CORE-004 / Facility / …)
```

---

## Evidence baseline

| Baseline | Role in this program |
|----------|----------------------|
| **`origin/release/rc1`** | Authoritative **product candidate** (~143 pages, financials, portals, facility, master admin, acquisition). RC1 cert: **READY FOR LIMITED BETA**; Commercial Launch **not authorized**. |
| **`main` / this docs checkout** | Identity foundation + Blueprint docs; **behind** rc1 product surface. Treat as process risk until ship tree is unified. |
| Prior programs | RC-001, CORE-001/002, PR-001/002, BILL-001, ADR-015/016 — absorbed, not discarded |

Honest posture: engineering capability on rc1 is mature enough that **ops, commercial cutover, claim control, and journey certification** dominate remaining risk — not greenfield module building.

---

## Package contents

| # | Document | Deliverable |
|---|----------|-------------|
| 1 | [Launch Readiness Report](./launch-readiness-report.md) | Official report + A/B/C classification |
| 2 | [Launch Readiness Board](./launch-readiness-board.md) | Living 🔴🟡🟢🔵 board |
| 3 | [Customer #1 Checklist](./customer-one-checklist.md) | End-to-end onboarding checklist |
| 4 | [Role Journey Certification](./role-journey-certification.md) | Master Admin → Owner day-in-the-life |
| 5 | [Visual Experience Audit](./visual-experience-audit.md) | Authenticated UX findings (no impl) |
| 6 | [Product Organization Audit](./product-organization-audit.md) | Modules vs operational work |
| 7 | [GO / NO-GO](./go-no-go.md) | Scores + recommendation |
| — | [ADR-017](../18-decision-log/adr-017-launch-001-customer-one-production-readiness.md) | Proposed program authorization |

---

## Verdict (preview)

| Question | Answer |
|----------|--------|
| Authorize LAUNCH-001? | **Yes — request approval** |
| Begin CORE-004 Phase 6? | **No** |
| New platform capabilities? | **Frozen** unless Launch Blocker removal |
| Facility expansion? | **🔵 Post Launch** (architecture first-class — ADR-015) |
| Commercial GO for unsupervised Customer #1? | **NO-GO** until board 🔴 items clear |
| Limited / supervised design-partner use? | **Conditional GO** (rc1 Limited Beta) with Known Limitations |

---

## Success criteria

LAUNCH-001 is complete when M.P.A. can **onboard, support, bill, and retain** Customer #1 with confidence:

1. All 🔴 Launch Blockers → 🟢 Complete  
2. Customer #1 Checklist executed end-to-end on production  
3. GO / NO-GO flips to **GO — Customer #1**  
4. Known Limitations signed for sales/support  

---

## Related

- **25** Launch Readiness & Roadmap Alignment (sequencing precursor)  
- **24** Facility Operations Architecture  
- ADR-015 · ADR-016 · ADR-017  
- rc1: `docs/00-governance/rc1-final-certification-report.md` (on `release/rc1`)
