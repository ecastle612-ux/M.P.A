# 04 — Workflow Timing Matrix

**Package:** DPX-001  
**Amendment:** C  
**Status:** Living — capture during / after UX-009 surface work  
**Method:** Scripted run on production (or staging with production-like data). Mobile = 390×844 unless noted. Desktop = 1280×800.

---

## How to measure

1. Start timer when the user begins the job (or lands on the entry surface).  
2. End when the job’s success state is visible.  
3. Record taps / distinct screens / scroll screenfuls + hesitation count.  
4. Log hesitation points in [05-friction-registry.md](./05-friction-registry.md).

**Rule:** If a workflow **consistently exceeds** its target because of UI friction, redesign it (Amendment C).

**Aligns with:** [DX-004 Five-Minute Rule](../61-dx-004-five-minute-rule/README.md) for longer jobs.

---

## Hard time budgets (Amendment C)

| ID | Workflow | Target | Current (s) | Taps now | Taps target | Improvements made | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| W-C1 | Find resident | **&lt; 5 s** | TBD | TBD | TBD | | Open |
| W-C2 | Create work order | **&lt; 60 s** | TBD | TBD | TBD | | Open |
| W-C3 | Send announcement | **&lt; 30 s** | TBD | TBD | TBD | | Open |
| W-C4 | Generate owner report | **&lt; 60 s** | TBD | TBD | TBD | | Open |

## Extended seed workflows

| ID | Workflow | Target (s) | Current (s) | Taps now | Taps target | Improvements made | Owner surface |
| --- | --- | --- | --- | --- | --- | --- | --- |
| W1 | Create Property | TBD | TBD | TBD | TBD | | Properties |
| W2 | Add Resident | TBD | TBD | TBD | TBD | | Residents |
| W3 | Assign Vendor | TBD | TBD | TBD | TBD | | Maintenance / Vendors |
| W4 | Generate Report | ≤60 (align W-C4) | TBD | TBD | TBD | | Reports / Financials |
| W5 | Send Announcement | ≤30 (W-C3) | TBD | TBD | TBD | | Communications |
| W6 | Complete Inspection | TBD | TBD | TBD | TBD | | Facility / Maintenance *(N/A if capability missing — friction, don’t invent)* |
| W7 | Open Lease | TBD | TBD | TBD | TBD | | Leases |
| W8 | Search Resident | ≤5 (W-C1) | TBD | TBD | TBD | | Search M.P.A. |

## Daily Operator Test timing (Amendment B)

Capture completion time + hesitation count per scenario block (Morning / Leasing / Maintenance / Owner) during certification — see [07-certification-protocol.md](./07-certification-protocol.md).

## Capture log (append)

| Date | ID | Device | Current | Hesitations | Notes |
| --- | --- | --- | --- | --- | --- |
| | | | | | Baselines pending UX-009 expansion + operator runs |
