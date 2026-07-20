# 08 — Risks

**Package:** FIN-001  
**Status:** Design ✔ · Document ✔ · Approve Pending · Implement Blocked

---

## Risk register

| ID | Risk | Impact | Likelihood | Mitigation |
| --- | --- | --- | --- | --- |
| R1 | Report numbers disagree with on-screen accounting | Trust loss with owners/PMs | Medium | Document recognition basis; shared read models; fixture tests for totals; fingerprint when data changes |
| R2 | Implementers write PDFs inside Accounting services | Architecture erosion | Medium | Binding rule + codeowners / lint boundary post-Approve |
| R3 | Generation overwrites vault files | Audit/compliance failure | Low | Version-never-overwrite law; unique object keys |
| R4 | Heavy report queries slow payment posting | Ops degradation | Medium | Async jobs; scoped queries; no shared write transactions; RC-001 scale awareness |
| R5 | Scope creep into GL / bookkeeping | Delays + ADR-010 violation | High | Non-goals; Approve checklist rejects GL items |
| R6 | Confusion between Phase 10 `owner_statements` and FIN-001 PDFs | Duplicate UX / dual truth | Medium | Architecture clarification; Approve Q2 decision |
| R7 | Cash vs accrual misunderstanding by owners | Support burden / disputes | Medium | Label basis on every P&L / Owner Statement PDF |
| R8 | ACH pending treated as paid on delinquency | Wrong collections focus | Medium | Align with API-005 settlement states |
| R9 | Premature schedule/AI build in Phase 1 | Unstable foundation | Medium | Future roadmap only; DoD excludes those items |
| R10 | Branding/logo missing → unprofessional PDF | Partner perception | Low | Fallbacks + PDF standard checklist |
| R11 | Security: leaked signed URLs | Data exposure | Low | Short-lived URLs; capability checks; private bucket |
| R12 | Design Partner expects portfolio/tax packs Day 1 | Expectation gap | Medium | RC-001 communication; Phase 1 catalog explicit |

---

## Open product decisions (resolve at Approve)

See [10 Approval Checklist](./10-approval-checklist.md):

1. Default income recognition basis (cash vs posted charges)  
2. Relationship between Phase 10 owner statement records and FIN-001 artifacts  
3. Capability name (`financial:read` vs `reporting:generate`)  
4. Whether empty-data reports still generate PDFs (recommended: yes)

---

## Residual risk after mitigations

FIN-001 remains **operational reporting**, not audited GAAP statements. Packets must not claim CPA-certified financial statements. Disclaimer language is recommended on Owner Statement / P&L footers.
