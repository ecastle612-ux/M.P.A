# Compliance Workflow Verification — Phase E.6

**Package:** FAC-OPS-001 · WF-09  

| Step | Expected | Status |
|------|----------|--------|
| Create obligation | Title, authority, requirement, due date | Implemented |
| Derived status | upcoming / due / overdue | Implemented |
| Satisfy with evidence | Requires ≥1 evidence document id | Implemented |
| Waive | Reason + `facility.compliance:waive` | Implemented |
| Overdue MC | `compliance_overdue` attention | Implemented |
| Documents | Shared Documents entity `facility_compliance_obligation` | Implemented |
| History | Timeline + audit events | Implemented |

## Acceptance

| # | Criterion | Evidence |
|---|-----------|----------|
| E6-3 | Compliance overdue MC + satisfy with evidence | MC builder + satisfy API |
| E6-4 | Documents attached & auditable | Document entity types + audit |
