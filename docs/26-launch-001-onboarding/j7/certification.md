# J7 Certification — Daily Operations

**Parent:** [LAUNCH-001](../index.md)  
**Journey:** [J7](../customer-journeys.md#j7--daily-operations)  
**Authorization:** `AUTHORIZE LAUNCH-001 JOURNEY J7`  
**Delivery status:** Delivered (implementation)  
**Certification status:** Ready for Master Admin Pass script  

---

## Customer promise

> When I log in each morning, I immediately know what requires my attention and can run my business without hunting for information.

---

## Outcome

```
Property Manager logs in
  → Mission Control
  → Greeting + M.P.A. Assistant briefing (rule-based)
  → Immediate Attention · Waiting on Me · Waiting on Others
  → Today's Mission · Recommended Actions · Quick Actions
  → Recent Activity · Financial snapshot · Open maintenance
  → Upcoming leases · Resident / vendor alerts · Timeline
  → Continue daily work in existing modules
  → Next: Review your owner's portfolio.
```

---

## Requirements honored

| Rule | Behavior |
|------|----------|
| No new dashboards | Reuses `OperationsConsoleShell` (Universal / Operations Console) |
| No duplicated data | Aggregates FO report, maintenance WOs, leases, residents, events |
| Quick Actions | Links only to existing workflows |
| Assistant | Summarizes existing signals — no AI generation |

---

## Journey completion

Opening Mission Control after J6 (maintenance ready) records:

- Timeline: `mission_control.daily_ops_reviewed`
- Audit: `mission_control.daily_ops_reviewed`

Then Mission Control / Assistant recommend:

**Review your owner's portfolio.** → `/portal/owner/financials`

Success understanding:

> I can run my property management business from this dashboard.

---

## Master Admin / Launch Readiness evidence

API: `GET /api/admin/launch/j7?organizationId=<uuid>`  
Panel: `/admin/launch-readiness` J7

---

## STOP

Do not implement J8 until:

```
AUTHORIZE LAUNCH-001 JOURNEY J8
```
