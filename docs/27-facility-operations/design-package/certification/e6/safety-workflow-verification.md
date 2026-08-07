# Safety Workflow Verification — Phase E.6

**Package:** FAC-OPS-001 · WF-08  

| Step | Expected | Status |
|------|----------|--------|
| Report incident / near-miss | `/facility/safety?new=1` | Implemented |
| Triage severity | reported → triaged | Implemented |
| Spawn corrective WO | `facility_safety_corrective` / `facility_safety` | Implemented |
| Actions open | Status `actions_open` when WO linked | Implemented |
| Close | Summary required; open WOs deferred with audit flag | Implemented |
| High severity MC | `safety_open` attention | Implemented |
| Notifications | High/critical notify managers | Implemented |

## Acceptance

| # | Criterion | Evidence |
|---|-----------|----------|
| E6-2 | Safety high severity notifies + MC | Notification key + `buildFacilitySafetyOpenAttention` |
