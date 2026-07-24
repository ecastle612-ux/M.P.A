# 03 — Domain Model

**Package:** FIN-003  
**Status:** ✅ **Approved**  
**Note:** Conceptual model for Approve. **No schema/migrations in this package stage.**

---

## Core concepts

| Concept | Meaning |
|---------|---------|
| **OrganizationSettlementAccount** | Org’s Stripe Connect Express account that receives destination charges |
| **OwnerConnectAccount** | Owner’s Stripe Connect Express account for receiving transfers |
| **OwnerPropertyInterest** | Owner’s share of a property (split %). Exact persistence open — see [12](./12-open-questions.md) |
| **PayoutPeriod** | Accounting window (e.g. calendar month) for a property or portfolio slice |
| **Allocation** | Computed net amount attributable to an owner for a period/property |
| **PayoutRun** | Batch of allocations executed together (schedule or manual) |
| **TransferIntent** | Intent to move funds settlement → owner (maps to Stripe Transfer) |
| **OwnerPayout** | Owner-visible distribution record (status machine in [05](./05-payout-lifecycle.md)) |
| **PayoutAttempt** | One execution try of a TransferIntent (supports retries) |
| **RemittanceArtifact** | Optional vaulted receipt/PDF for a paid payout |

---

## Relationships (logical)

```
Organization 1—* Property
Property *—* Owner (via ownership interest / access)
Organization 1—1 OrganizationSettlementAccount (v1)
Owner 1—1 OwnerConnectAccount (v1 default; multi-bank = open Q)
PayoutPeriod → many Allocation
PayoutRun → many TransferIntent → many PayoutAttempt
TransferIntent → OwnerPayout (owner projection)
```

---

## Status vocabularies (canonical)

### OwnerConnectAccount.status

`not_started` · `onboarding` · `pending_verification` · `restricted` · `eligible` · `disabled`

### OwnerPayout.status

`scheduled` · `pending` · `in_transit` · `paid` · `failed` · `returned` · `canceled` · `action_required`

### PayoutRun.status

`draft` · `queued` · `running` · `succeeded` · `partial` · `failed` · `canceled`

---

## Money fields (rules)

- Store amounts as integer minor units **or** decimal numeric — never float  
- Always include `currency` (US-first default `usd`)  
- Record `gross`, `fees`, `reserves`, `net`, `split_percent` as applicable  
- Immutable after `paid` except compensatory adjustments as **new** records  

---

## System of record boundaries

| Fact | SoR |
|------|-----|
| Rent charges & resident payments | Financial module / API-005 ledger |
| Owner statements / report PDFs | FIN-001 ReportingService + vault |
| Connect balances & bank payouts | Stripe |
| Allocation decisions & internal statuses | FIN-003 domain (future persistence) |
| SaaS invoices | BILL-001 |

---

## Identity mapping

| M.P.A. identity | Connect |
|-----------------|---------|
| `organization_id` | Org settlement Express `acct_…` |
| Owner user / owner account | Owner Express `acct_…` |
| Never | BILL-001 `saas` Customer |
| Never | API-005 `payment_customers` for Connect payouts |

---

## Ownership splits (design intent)

v1 must support **multi-owner properties** at allocation time. Exact source of split % is an Open Question (explicit ownership table vs interim equal/PM-configured). Approve must pick before Phase C.
