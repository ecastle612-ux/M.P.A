# 10 — Definition of Done

**Package:** API-003  
**Status:** Approved · Implemented (Phase 1)

---

## Gate DoD (documentation)

| Criterion | State |
|-----------|--------|
| Design complete | ✔ |
| Documented under `docs/48-api-003-background-screening/` | ✔ |
| Linked from Blueprint / integration docs | ✔ |
| Explicit Approve on README | ✔ |
| Application / migration code | ✔ Implemented |

**Design ✔ · Document ✔ · Approve ✔ · Implement ✔**

---

## Phase 1 implementation DoD

- [x] `ScreeningService` is sole domain entry; no SDK leaks
- [x] Consent gate enforced before consumer reports
- [x] Checkr adapter + signed webhooks + noop for CI
- [x] Normalized reports + vault artifact metadata
- [x] PM decisions: approve / reject / conditional
- [x] Adverse action path for applicable rejects
- [x] Multi-party support (primary + add guarantor/co-app/etc.)
- [x] Ops widgets + Command Center index live
- [x] Retention settings configurable (org table; no hard-coded product constants for durations)
- [x] Audit on consent, view, decision, purge/expiry
- [x] Notifications for consent/ready
- [x] Timeline events via applicant events
- [x] QA-001 P1 screening journey specs
- [x] Package README → Implemented

---

## Explicitly not required for Phase 1 DoD

- Income verification
- Automatic approval finalization
- Provider failover
- AI report summarization
- Every alternate provider adapter (SmartMove/RentPrep/Equifax stubs deferred)
