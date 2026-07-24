# 04 — Ledger Integration

**Package:** PAY-001  
**Status:** 📝 Draft (amended · [11](./11-architecture-amendments.md))  
**Hosts:** API-005 operational ledger + Phase 10 financial ops  
**Non-goal:** Full GL / trust accounting (ADR-010)

---

## Principles

1. **Append-only** money facts — reverse with new entries.  
2. **Org-scoped** every entry.  
3. **Event-linked** to payment attempts / charges / refunds / disputes / ACH returns.  
4. Ledger is SoR for **bookkeeping intent**, **not** for Stripe available cash.  
5. PAY-001 makes ledger facts **settlement-aware** for ops and future FIN-003 inputs — without implementing FIN-003 allocation.  
6. **Never persist a transferable settlement cash balance** derived only from ledger math.

---

## Ledger accounting state vs Stripe settlement cash

| Concept | System | May authorize FIN-003 transfer? |
|---------|--------|----------------------------------|
| Collected / paid / refunded / disputed (books) | Operational ledger | **No** (input only) |
| Fee / fee reversal (books) | Operational ledger | **No** |
| `funding_mode` + settlement account linkage | Mapping + ledger metadata | **No** (eligibility signal only) |
| **Available cash** on org Express | **Stripe Balance retrieve** | **Yes** (with FIN-003 rules) — SoT |
| Pending ACH / pending balance | Stripe pending | **No** — not transferable |

### Derived reporting (allowed)

| Field | Meaning | Persistence rule |
|-------|---------|------------------|
| **Gross − platform fee (derived)** | Reporting aid: estimated net after application fee as known at settle | **May** appear in reports/UI calculations · **Must not** be stored as “settlement cash” or used as transfer preflight SoT |

If Stripe balance transactions disagree with derived net, **Stripe wins for cash**; ledger/report is corrected via reconcile — not by inventing Connect credit.

---

## Facts PAY-001 must ensure

| Fact | When | Notes |
|------|------|-------|
| Payment succeeded | API-005 settle | Include settlement `acct_…` + `funding_mode` + property linkage |
| Application / platform fee | On succeed settle | Explicit fee fact (cents); see [03](./03-payment-routing.md) fee policy |
| Refund / reversal | Refund lifecycle | Reduces distributable corpus **in books** |
| ACH return | ACH return lifecycle ([05](./05-refunds-disputes.md)) | Treat as reversal of collected; not “paid” |
| Dispute hold / loss / win | Dispute lifecycle | Must not look like safe collected cash while open/lost |
| Funding mode | Attempt create/settle | `destination` or `legacy_platform` |
| Fee reversal | Refund / dispute lost as applicable | Align with Stripe fee refund behavior |

---

## What ledger must not do

| Anti-pattern | Why |
|--------------|-----|
| Treat all-time `amount_paid` as period settlement cash | Unsafe for future payouts |
| Invent Connect balance rows without Stripe retrieve | Dual fiction |
| Persist “net to settlement” as cash SoT | R8 — use derived reports only |
| Post “owner paid” | FIN-003 only |
| Mix SaaS invoice lines into resident ledger | ADR-024 |
| Treat `legacy_platform` collections as org Express corpus | Never FIN-003-transferable |

---

## Interface toward FIN-003 (read-only contract foreshadow)

PAY-001 does **not** implement FIN-003 allocation. It **prepares** inputs:

| Future FIN-003 need | PAY-001 contribution |
|---------------------|----------------------|
| Property × period collected | Payment facts + timestamps + `property_id` |
| Fee-aware net (books) | Fee + fee reversal facts |
| Exclude reversed / disputed / ACH-returned | Lifecycle postings |
| Destination-routed only for transfers | `funding_mode=destination` + mapping; **exclude** `legacy_platform` |
| Cash preflight | Stripe available balance on org Express (SoT) — not ledger |

Exact payout input API remains FIN-003 / shared ([FIN-003 §32 P6](../98-fin-003-owner-payout-stripe-connect/32-phase-c-prerequisites.md)).

---

## Reporting

| Consumer | Use |
|----------|-----|
| PM financial summaries | Books; disclose destination settlement when relevant |
| Owner statements | Collections facts — still not “owner payout paid” |
| Ops reconcile | Mapping + ledger + Stripe retrieve ([03](./03-payment-routing.md)) |
| Derived net reports | Explicitly labeled estimated; not cash |
