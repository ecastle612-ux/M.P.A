# 05 — Open Questions

**Package:** UX-013  
**Status:** Draft — unresolved until Approve (or explicit lock in approval record)  
**Rule:** Do not Implement while critical OQs remain open unless the approval record marks them Deferred with an interim binding answer.

---

## Open questions

| ID | Question | Options | Suggested default | Blocks Implement? |
|----|----------|---------|-------------------|-------------------|
| **OQ-01** | How does module selection map to entitlement snapshots when today’s matrix entitles **both** Property and Facility on Pro/Business? | (a) Soft UX filter only (nav/copy) · (b) Hard entitlement bind at provision · (c) New Stripe prices per SKU | (b) Hard bind via metadata → entitlement snapshot | **Yes** for Slice B |
| **OQ-02** | Is `plan_code=trial` removed from the **product** (catalog + matrix) or only from **marketing/Checkout entry**? | (a) Marketing-only · (b) Retire trial code · (c) Keep trial for Master Admin grants only | (a) now; Finance decides (b)/(c) | Soft for Slice A; hard if retiring code |
| **OQ-03** | Deep link to `/pricing` without module context? | (a) Force module step · (b) Default `both` · (c) Remember last choice cookie | (a) Force module step before Checkout | Soft |
| **OQ-04** | Facility-only buyers: which “shared” modules (leasing, screening, owner_portal)? | Product list per selection | Minimal shared: documents, messaging, maintenance bridge TBD | **Yes** for entitlement lists |
| **OQ-05** | May Pro/Business Checkout still use Stripe `trial_period_days` without calling it “Free Trial”? | (a) Never · (b) Finance promo only · (c) Always N days silent | (a) Never until Finance amendment | Soft for messaging; hard for Checkout flags |
| **OQ-06** | Vendor portal vs retired Vendor Portal product | (a) Keep tokenized WO-only · (b) First-class portal per Matrix G · (c) Defer Vendor matrix | Defer full portal; ship Matrix G jobs on approved surfaces | Soft for Slice C Vendor row |
| **OQ-07** | Analytics: replace `acq.plan_selected` trial events? | New `module_selection` event + plan | Add `acq.module_selected`; stop emitting trial plan_selected from public | Soft |
| **OQ-08** | COM commercial_status values that say `trial` | Leave mirror · rename later | Leave mirror; public copy avoids “trial” | Soft |

---

## Resolved by this package design (pending Approve)

| Topic | Binding proposal |
|-------|------------------|
| Journey order | Modules → Pricing → Checkout |
| Public Trial plan card / Start free trial CTA | Removed |
| Public Sign Up without payment | Still forbidden |
| Enterprise | Contact Sales only |
| Guided Setup | Same SetupGate; no trial fork |
| Money rail | BILL-001 unchanged |
| Nav | Per-surface matrices + triple filter |

---

## Reopened ACQ decisions (if UX-013 Approved)

| ACQ ID | Prior lock | UX-013 effect |
|--------|------------|---------------|
| OQ-01 (Trial enabled public) | Trial public self-serve | **Superseded** — no public Trial plan path (see A11) |
| Journey §02 step 3–4 | Pricing first | **Superseded** — modules first |

Other ACQ OQ-02–OQ-12 remain unless explicitly reopened above.
