# 07 — Design Partner Certification Protocol

**Package:** DPX-001  
**Status:** Approved protocol — execute when surfaces are ready  
**Prerequisite:** Shell PASS · UX-009 patterns on audited surfaces · Amendments A–G binding

---

## Review stance

Review as a property manager using it for the **first time**.

For every workflow:

1. Is the next step obvious? (**10-Second Rule** — Amendment A)  
2. Can the task be completed confidently?  
3. Would this feel faster than competing software?  
4. Confidence score ≥ 9/10? (Amendment D)

Document every hesitation → [05-friction-registry.md](./05-friction-registry.md).

## Daily Operator Test (Amendment B) — required

Run full workday scenarios (not feature unit tests):

| Block | Jobs |
| --- | --- |
| Morning | Overnight issues · dashboard · maintenance · messages · payments |
| Leasing | Review / approve applicant · create / send lease · track signature |
| Maintenance | Review WO · assign vendor · contact resident · upload photos · close |
| Owner | Review financials · generate owner statement · send report |

Measure hesitation, navigation, and completion time.

## Minimum device script (also required)

| Step | Action | Devices |
| --- | --- | --- |
| 1 | Sign in → Operations Center | Mobile + desktop |
| 2 | Find resident (&lt;5s budget) · open profile | Mobile |
| 3 | Property · toolbelt / top actions | Mobile |
| 4 | Work order · AI next step | Mobile |
| 5 | Create entity end-to-end | Mobile |
| 6 | Announcement path (&lt;30s) | Either |
| 7 | Open lease | Either |
| 8 | Dashboard AI priorities | Either |

## Design Partner Council (Amendment G)

Before public launch: 3–5 companies, silent observation — [13-design-partner-council.md](./13-design-partner-council.md).

## Evidence required

- Before/after screenshots  
- Timing budgets met or redesign filed ([04](./04-workflow-timing.md))  
- Friction register updates (Amendment F)  
- Confidence scores ≥9 ([12](./12-confidence-scores.md))  
- First-time audit ([06](./06-first-time-experience.md))  
- Consistency check (Amendment E)  
- AI context correctness  

## Outcome

Record PASS/FAIL in [08-pass-criteria.md](./08-pass-criteria.md) and `14-certification-report.md` when executed.

**Do not** claim PASS from code review alone. Prefer User Verified / Council observation.
