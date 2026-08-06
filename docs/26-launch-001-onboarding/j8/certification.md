# J8 Certification — Owner Portfolio Review

**Parent:** [LAUNCH-001](../index.md)  
**Journey:** [J8](../customer-journeys.md#j8--review-your-owners-portfolio)  
**Authorization:** `AUTHORIZE LAUNCH-001 JOURNEY J8`  
**Delivery status:** Delivered (implementation)  
**Certification status:** Ready for Master Admin Pass script  

---

## Customer promise

> I can log in and instantly understand how my properties are performing.

---

## Outcome

```
Owner logs in
  → Owner Portfolio Home
  → Portfolio Summary · Property Performance · Occupancy
  → Financial Summary · Outstanding Rent · Recent Payments
  → Open Maintenance · Vendor Activity
  → Recent Documents (honesty) · Recent Timeline
  → Assistant Summary
  → Property drill-down (PCC + FO snapshot reuse)
  → Success: I can confidently monitor my investment portfolio using M.P.A.
```

---

## Requirements honored

| Rule | Behavior |
|------|----------|
| No duplicate dashboards | Composes FO owner summary, WO list, leases, timeline, PCC |
| No accounting | Operational money language only |
| No investment analytics | Occupancy / cash / maintenance / activity only |
| Documents | Honesty empty state — Document Vault not launched |
| Reuse | `/api/finance/reports/owner`, PCC, maintenance WOs |

---

## Journey completion

Opening Owner Portfolio Home (`/portal/owner`) after J7 records:

- Timeline: `owner_portfolio.reviewed`
- Audit: `owner_portfolio.reviewed`

Then Mission Control / Assistant show:

**I can confidently monitor my investment portfolio using M.P.A.**

This completes Property Manager Customer Promise journeys **J0–J8**.

---

## Owner verification

1. Log in as `property_owner` (or PM reviewing owner path).  
2. Land on `/portal/owner` (or open from Mission Control next action).  
3. Within one minute: see occupancy, rent collected, outstanding, vendor spend, open maintenance, active leases, property list.  
4. Open a property → occupancy, residents, leases, financial snapshot, maintenance, timeline.  
5. Confirm Assistant summary is rule-based and understandable.  
6. Confirm no accounting / ROI language.

---

## Property Manager verification

1. After J7, Mission Control next action → **Review your owner's portfolio** → `/portal/owner`.  
2. PM can open owner portal (launch path).  
3. After review, Assistant → customer promise complete copy.  
4. Quick Action **Owner portfolio** points to `/portal/owner`.

---

## Master Admin / Launch Readiness evidence

API: `GET /api/admin/launch/j8?organizationId=<uuid>`  
Panel: `/admin/launch-readiness` J8

Verify:

- Owner login / portfolio visibility  
- Property drill-down  
- Financial + maintenance summaries  
- Timeline + audit  
- Journey completion  

---

## STOP

Do **not** begin new platform capabilities.  
Do **not** begin Facility Operations.  
Do **not** continue FIN-OPS beyond approved slices.

Proceed only to the final [Property Manager Customer Promise Certification](../property-manager-customer-promise-certification.md).
