# 11 — Risk Analysis

**Package:** API-003  
**Status:** Draft — Ready for Approval

---

## Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R1 | FCRA / adverse action non-compliance | Med | Critical | Counsel review; hard gates; versioned templates |
| R2 | Vendor lock-in to Checkr | Med | High | ScreeningProvider + normalization mandatory |
| R3 | PII leakage via logs/webhooks | Med | Critical | Redaction; vault; least privilege; signature verify |
| R4 | Fair housing inconsistent decisions | Med | Critical | Reason codes; no silent AI decisions; audit |
| R5 | Provider downtime blocks leasing | Med | High | Retry/DLQ; manual review path; future failover |
| R6 | Orphaned PDFs / no resident linkage | Med | Med | Vault refs + applicant→lease handoff slice |
| R7 | State-law screening limits | Med | High | Org policy flags; counsel matrix |
| R8 | Scope creep into income/AI/auto-approve | High | Med | Deferred slices; gate enforcement |
| R9 | SSN handling in M.P.A. DB | Med | Critical | Prefer provider-hosted; minimize retention |
| R10 | Stub `screening_cases` diverges from design | High | Med | Slice 0 migration aligns model after Approve |

---

## Open questions (for Approve)

| # | Question | Options | Recommendation |
|---|----------|---------|----------------|
| Q1 | First production provider? | Checkr / SmartMove / other | **Checkr** |
| Q2 | Who pays screening fees? | Applicant / org / split | Product decision |
| Q3 | Default retention for full PDFs? | 1y / 3y / 7y | Counsel + Security |
| Q4 | Is adverse action hard-gated for all orgs? | Always / org opt-out | **Always on** default |
| Q5 | Auto-create screening on application submit? | Always / PM trigger / package rules | PM trigger or rules |
| Q6 | Share full report with applicant? | Never / on adverse / always | **On adverse** minimum |

---

## Related documents

| Doc | Relationship |
|-----|----------------|
| INT-201 / INT-203 | Integration roadmap IDs |
| Phase 12 RX-001 | Applicant foundation |
| Phase 12 provider abstractions | Historical stub — API-003 authoritative after Approve |
| API-002A | Report/consent binaries |
| API-001 | Notification events |
| docs/14 Security | Screening data class |
| QA-001 | E2E journeys after implement |

---

## Gate

**Design ✔ · Document ✔ · Approve Pending · Implement Blocked**
