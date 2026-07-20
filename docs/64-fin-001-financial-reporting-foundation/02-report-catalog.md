# 02 — Report Catalog

**Package:** FIN-001  
**Status:** Design ✔ · Document ✔ · Approve Pending · Implement Blocked

---

## Phase 1 catalog

Seven report types (six financial + Maintenance Summary additive via EP-017). All are **single-property** in Phase 1 unless noted. Portfolio rollups are future ([07](./07-future-roadmap.md)).

Shared filter defaults:

| Filter | Notes |
| --- | --- |
| Organization | Implicit from session |
| Property | Required |
| Period | Calendar month (default) or inclusive date range where specified |
| As-of timestamp | Generation time recorded on artifact |

Currency: organization default (USD Phase 1 unless org setting exists). Amounts: decimal/numeric — never float.

---

## 1. Monthly Profit & Loss

| Field | Definition |
| --- | --- |
| **Purpose** | Show property income vs operating expenses for a period so managers can explain performance to owners |
| **Audience** | Property manager; owner (via delivery later) |
| **Required data** | Income from rent charges posted / payments collected (Approve chooses recognition basis — see notes); expenses by category; optional late fees collected |
| **Filters** | Property; period (month); optional income recognition: `accrual` (charges) vs `cash` (payments) — default documented at Approve |
| **Grouping** | Income section → line items; Expense section → category; optional unit drill later |
| **Totals** | Gross income; total expenses; net operating income (income − expenses) |
| **Subtotals** | Per income type; per expense category |
| **Future expansion** | Budget vs Actual; portfolio P&L; YoY comparison |

**Recognition note:** Phase 10 is operational, not full accrual GL. Catalog must label the basis clearly on PDF (“Cash collections” vs “Posted charges”) so owners are not misled. Default recommendation: **cash collections for income + expense cash/date for costs** unless product Approve selects otherwise.

---

## 2. Owner Statement

| Field | Definition |
| --- | --- |
| **Purpose** | Period packet summarizing money in, money out, and ending position for an owner’s property |
| **Audience** | Owner (primary); property manager (preparer) |
| **Required data** | Beginning balance (if available); collections; other income; expenses; fees/management fee line if present; ending balance / amount due to owner; property identity |
| **Filters** | Property; period; optional owner entity when multi-owner exists (Phase 1: property-level) |
| **Grouping** | Collections; adjustments; expenses; summary |
| **Totals** | Total collected; total expenses; net to owner (formula per Approve) |
| **Subtotals** | By charge type / expense category |
| **Future expansion** | Multi-property owner packet; digital signature block; portal publish |

**Relationship to Phase 10:** May read existing `owner_statements` / generation inputs. PDF + vault version is FIN-001 responsibility. See [01 Architecture](./01-architecture.md) clarification.

---

## 3. Rent Roll

| Field | Definition |
| --- | --- |
| **Purpose** | Snapshot of units, occupancy, lease terms, and rent obligations as of period end (or as-of date) |
| **Audience** | Property manager; owner; lenders (future export) |
| **Required data** | Units; tenants/leases; lease status; rent amount; deposit; lease start/end; occupancy |
| **Filters** | Property; as-of date (default: period end) |
| **Grouping** | By unit (primary); optional by building/wing if data exists |
| **Totals** | Unit count; occupied / vacant; total contractual rent; average rent |
| **Subtotals** | Occupied rent sum; vacant potential (if market rent known — optional) |
| **Future expansion** | Market rent gap; renewal pipeline; portfolio rent roll |

---

## 4. Cash Flow Summary

| Field | Definition |
| --- | --- |
| **Purpose** | Period view of cash in vs cash out (operational cash lens) |
| **Audience** | Property manager; owner |
| **Required data** | Payments succeeded/settled in period; expenses paid/dated in period; optional other cash movements if tracked |
| **Filters** | Property; period |
| **Grouping** | Inflows; outflows; net |
| **Totals** | Total inflows; total outflows; net cash flow |
| **Subtotals** | By payment method (optional); by expense category |
| **Future expansion** | Bank reconciliation tie-out; forecast; multi-month trend |

**Constraint:** Does not invent bank balances. If beginning cash is unknown, report shows **period movement only** and labels that clearly.

---

## 5. Expense Report

| Field | Definition |
| --- | --- |
| **Purpose** | Itemized and categorized expenses for a property period |
| **Audience** | Property manager; owner; tax prep handoff (future) |
| **Required data** | Expenses (amount, date, category, vendor, property, notes/work order link if any) |
| **Filters** | Property; period; optional category; optional vendor |
| **Grouping** | By category (default); optional by vendor |
| **Totals** | Grand total expenses |
| **Subtotals** | Per category; per vendor when grouped |
| **Future expansion** | Receipt attachments index; 1099 vendor rollup; maintenance vs capex tags |

---

## 6. Delinquency Report

| Field | Definition |
| --- | --- |
| **Purpose** | Identify residents/units with outstanding balances and aging |
| **Audience** | Property manager (collections); owner (visibility) |
| **Required data** | Open rent charges / balances; last payment date; tenant; unit; days past due |
| **Filters** | Property; as-of date; optional minimum balance; optional aging bucket |
| **Grouping** | By aging bucket (0–30, 31–60, 61–90, 90+); then by unit/tenant |
| **Totals** | Total delinquent balance; count of delinquent leases/units |
| **Subtotals** | Per aging bucket |
| **Future expansion** | Collections workflow deep links; promise-to-pay; notice history |

**API-005 alignment:** Prefer settled vs pending payment states so ACH-in-flight does not falsely clear delinquency ([API-005 §07](../51-api-005-resident-payments-billing/07-ledger-and-reporting.md)).

---

## 7. Maintenance Summary (EP-017 additive)

| Field | Definition |
| --- | --- |
| **Purpose** | Operational period summary of work orders for a property (open vs completed, by category) |
| **Audience** | Property manager; owner (visibility via shared reports surface) |
| **Required data** | Maintenance work orders created or completed in period; status; priority; category; unit |
| **Filters** | Property; calendar month |
| **Grouping** | Open; completed; by category |
| **Totals** | Work orders in period; open; completed; high/emergency count |
| **Recognition basis** | N/A (counts, not money) |
| **Capability** | Existing `financial:read` via Reports surface |

Does **not** redesign ReportingService. Reuses Report Engine → PDF → Vault.

---

## Cross-cutting catalog rules

1. Every report declares **data freshness** (generated at timestamp + source fingerprint).  
2. Empty sections render as “No items for this period” — never silent omission of totals.  
3. Partial data (e.g. missing manager name) uses graceful fallbacks, not generation failure, unless property/period invalid.  
4. Phase 1 does not support custom column builders or ad-hoc SQL reports.

---

## Catalog matrix (quick reference)

| Report | Period model | Primary sources (conceptual) |
| --- | --- | --- |
| Monthly P&L | Month | Charges/payments + expenses |
| Owner Statement | Month | Collections + expenses + statement summary |
| Rent Roll | As-of | Units + leases + tenants |
| Cash Flow Summary | Month / range | Payments + expenses |
| Expense Report | Month | Expenses |
| Delinquency Report | As-of | Open charges |
| Maintenance Summary | Month | Work orders |
| Expense Report | Month / range | Expenses (+ vendors) |
| Delinquency Report | As-of | Open balances / charges + payments |
