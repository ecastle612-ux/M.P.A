# Product Vision & Scope

**Parent:** [FIN-OPS-001](./index.md)  
**Status:** Approved (FIN-OPS-001)

---

## 1. Product vision

Financial Operations gives Property Managers a single operational money surface for:

- charging residents (rent and fees),
- collecting payments,
- tracking balances,
- approving and paying vendors,
- summarizing results for properties and owners.

**North-star sentence:**  
*“I know what is owed, what was paid, what is late, and what vendors are owed — without opening a second finance product.”*

### What this is

| Is | Is not |
|----|--------|
| Operational finance for PM workflows | Full ERP / general ledger |
| Append-only money truth for ops | Tax engine / CPA suite |
| Stripe-orchestrated collections & payouts | In-house card processing |
| Owner/property money summaries | Facility capital budgeting |
| Prepared for future trust accounting (ADR-010) | Chart of accounts v1 |

---

## 2. Scope boundaries

### In scope (design)

- Charges: recurring rent, recurring fees, one-time charges, late fees  
- Resident ledger & payment history  
- Payment collection (Stripe)  
- Delinquency / late fee rules (operational)  
- Vendor invoice intake, approval, payment  
- Property financial summaries  
- Owner financial summaries (feeds Owner Reporting)  
- Operational reporting  
- Entitlement `pm.financial_operations`  
- Audit, notifications, search indexing, mobile-ready APIs  

### Out of scope (explicit)

| Out | Why |
|-----|-----|
| Facility Operations finance / CapEx | Different product |
| SaaS subscription billing UI for M.P.A. plans | `platform.billing_self` / commercial billing |
| Full double-entry GL, trust accounting, bank recon | ADR-010 future |
| Payroll | Not PM ops finance |
| CORE-004 changes | Forbidden by authorization |
| Duplicate ledgers per module | One finance model |

---

## 3. Customer #1 capability matrix

| Capability | Phase | Notes |
|------------|-------|-------|
| Rent collection | **Launch-critical** | Recurring charge → pay → ledger |
| Recurring charges | **Launch-critical** | Rent + scheduled fees |
| One-time charges | **Launch-critical** | NSF, pet, damage, misc |
| Resident ledger | **Launch-critical** | Balance, aging, line items |
| Payment history | **Launch-critical** | Resident + PM views |
| Late fees | **Launch-critical** | Rule-based apply + notify |
| Vendor invoice approval | **Launch-critical** | Approve/reject against work order |
| Vendor payments | **Launch-critical** | Stripe Connect payout after approval |
| Property financial summaries | **Launch-critical** | Income/expense rollup per property |
| Owner financial summaries | **Launch-critical** | Owner-safe view / report feed |
| Operational reporting | **Launch-critical** | Collections, AP, delinquency lists |
| Autopay / saved payment methods | Phase 2 | SetupIntent / Customer |
| Partial payments & payment plans | Phase 2 | Controlled allocation rules |
| Owner draws / contributions | Phase 2 | Owner money movements |
| Security deposit held/released accounting | Phase 2 | Tied to move-out |
| Multi-currency | Post-launch | USD-first for Customer #1 |
| Native trust accounting / COA | Post-launch | ADR-010 future |
| QuickBooks/Xero sync | Phase 2 | Export first, sync later |
| AI delinquency coaching | Phase 2 | Embedded suggestions only |
| Bulk charge import | Post-launch | CSV tooling |

---

## 4. Design principles

1. **One money graph** — charges, payments, invoices, ledger entries share one model.  
2. **Append-only truth** — corrections via reversing entries, never silent edits.  
3. **Workflow-attached** — every money object ties to lease, property, resident, vendor, and/or work order when applicable.  
4. **Entitlement-first** — no FO surface without `pm.financial_operations`.  
5. **Stripe at the rails** — M.P.A. owns orchestration; Stripe owns payment processing.  
6. **Owner clarity without PM internals** — owners see summaries, not triage clutter.  
7. **Not Facility** — no FO module under Facility nav or entitlements.

---

## 5. Relationship to existing Blueprint

| Existing | Relationship |
|----------|--------------|
| Workflow 5 Rent Collection (05) | Canonical resident-side spine |
| Workflow 6/7 Vendor invoice/payment | Canonical AP spine |
| Workflow 8 Owner Reporting | Consumes FO summaries |
| ADR-010 | Bound — defer full GL |
| ADR-004 Marketplace | Vendor payout identity |
| Product Architecture 24 | FO owned by Property Manager |
| Entitlement matrix | `pm.financial_operations` |
