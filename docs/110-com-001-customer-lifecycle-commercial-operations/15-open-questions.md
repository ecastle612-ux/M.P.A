# 15 — Open Questions

**Package:** COM-001  
**Status:** Draft — Awaiting Approval

---

| ID | Question | Options | Proposed default |
|----|----------|---------|------------------|
| Q1 | Trial length | 7 / 14 / 30 days | **14 days** |
| Q2 | Past Due → Grace duration | 3 / 7 / 14 days | **7 days** |
| Q3 | Grace → Suspended automatic? | Yes / manual CS | **Yes automatic** with CS alerts |
| Q4 | Cancel export window | 7 / 30 / 90 days | **30 days** |
| Q5 | Archive after cancel | 90 / 180 / 365 days | **180 days** (legal may extend) |
| Q6 | CRM system of record for Lead→Proposal | HubSpot / Salesforce / internal | **External CRM OK**; COM-001 states must still be representable |
| Q7 | Final plan numeric caps | Product workshop | Align AUTH-001 [26] + BILL-001 Phase C |
| Q8 | Professional Implementation pricing | Included / add-on / enterprise-only | **Add-on**; included on Enterprise |
| Q9 | Inactive Org Admin alert thresholds | 14 / 30 days | **14 warn / 30 CS call** |
| Q10 | Self-serve Checkout without sales | Allowed for Pro / not for Enterprise | **RESOLVED by A10 / ACQ-001** — Trial (if retained) + Pro/Business self-serve; Enterprise sales-assisted |
| Q11 | Win-back discount policy | Finance | Deferred to Finance playbook |
| Q12 | Demo data seeding | Shared demo vs per-AE | **Shared demo tenants**; never convert to customer |

---

## Dependencies at Approve

| Dependency | Owner |
|------------|-------|
| AUTH-001 Approved with Amendments | Architect (done) |
| BILL-001 plan price map | Billing + Finance |
| EML-001 commercial templates | Email + CS |
| CRM integration timing | Commercial ops |
