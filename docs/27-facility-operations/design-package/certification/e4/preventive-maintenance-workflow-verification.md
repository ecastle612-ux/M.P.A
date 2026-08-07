# Preventive Maintenance Workflow Verification (E.4 / WF-05)

| Step | Expected | Status |
|------|----------|--------|
| Create program on asset/system | Schedule draft or active | Implemented |
| Activate | Status active; next_due_on set | Implemented |
| Due generation | Shared WO `product_context=facility`, `work_kind=facility_preventive`, `source=facility_pm_generator` | Implemented |
| Idempotent generate | Second generate for same due_on reuses run/WO | Implemented |
| Maintenance executes | Reused FO/Maintenance execution on shared WO | Implemented |
| Close WO | Run → work_completed → acknowledged; schedule advances | Implemented |
| One-shot | Schedule retired after acknowledge | Implemented |
| Pause / resume / retire | Lifecycle transitions | Implemented |
| Overdue MC | `pm_overdue` with criticality × days escalation | Implemented |
| Due MC | `pm_due` for next_due_on = today | Implemented |

**Forbidden check:** No second WO engine; no FO technician workflow clone.
