# 10 — Risks

**Package:** FAC-001  
**Status:** Design ✔ · Document ✔ · Approve Pending · Implement Blocked

---

## Risk register

| ID | Risk | Impact | Likelihood | Mitigation |
| --- | --- | --- | --- | --- |
| R1 | Dual truth: WO notes vs Facility Record diverge | Trust loss | Medium | Snapshot on complete; admin correction chain; idempotent create |
| R2 | Vendor migration breaks assignment | Ops outage | Medium | Bridge period; keep vendor_id; no forced cutover in Phase 1 |
| R3 | Scope creep into full CMMS / PM / AI | Delay | High | Non-goals; Approve checklist; roadmap quarantine |
| R4 | History write slows WO complete | UX regression | Medium | Async append after complete; never block close on search index |
| R5 | PII / photos over-retained | Compliance | Medium | Vault policies; org legal hold; no casual purge |
| R6 | Timeline spam from noisy events | Unusable feed | Medium | Curated event catalog; batch/idempotency keys |
| R7 | Property Health becomes fake score theater | Partner distrust | Medium | Factors only; no score without separate Approve |
| R8 | Competing “History” UIs | DX-003 violation | Medium | Single Property History hub; deep links elsewhere |
| R9 | Backfill of historical WOs incomplete | Partial memory | Medium | Optional backfill job post-Approve; label “from date X” |
| R10 | Accounting links confuse FIN boundaries | Wrong writes | Low | Reference-only expense links; no GL posts from Facility Ops |

---

## Open product decisions

Resolve at Approve ([12](./12-approval-checklist.md)):

1. Exact WO statuses that mint Facility Records  
2. Provider migration bridge depth for Phase 1  
3. Capability naming  
4. Building entity in Phase 1 vs property-only  
5. Nav label: Facility Operations vs Property History entry points  

---

## Residual risk

Even with perfect Facility Records, data quality depends on completion notes and media discipline. Product copy should encourage capture at close without blocking the DX-003 guided path.
