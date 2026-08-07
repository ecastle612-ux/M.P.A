# Inspection Workflow Verification — Phase E.6

**Package:** FAC-OPS-001 · WF-07  

| Step | Expected | Status |
|------|----------|--------|
| Create program | One create path `/facility/inspections?new=1` | Implemented |
| Checklist template | Ordered items on program | Implemented |
| Scope site/asset/system | Scope type enforced | Implemented |
| Schedule cadence | day/week/month/year/one_shot + next due | Implemented |
| Start run | `scheduled`/`in_progress` with not_checked items | Implemented |
| Record outcomes | pass / fail / needs_attention | Implemented |
| Complete fail | `completed_fail` + spawn facility inspection WOs | Implemented |
| Complete pass | `completed_pass`; advance next due | Implemented |
| Cancel | Reason required | Implemented |
| Notifications | Fail notifies managers | Implemented |
| Search / timeline / audit / Assistant | Wired | Implemented |

## Acceptance

| # | Criterion | Evidence |
|---|-----------|----------|
| E6-1 | Inspection fail spawns facility WO | `work_kind=facility_inspection_corrective`, `source=facility_inspection` |
