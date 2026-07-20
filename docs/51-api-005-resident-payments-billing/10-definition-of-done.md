# 10 — Definition of Done

**Status:** Approved · Implemented

---

## Package gate (this design)

| Criterion | Met when |
|-----------|----------|
| Docs complete | README + 01–11 present |
| Architecture clear | BillingService → PaymentProvider → StripeProvider |
| Approval recorded | User Approved |
| Implementation | Slices 0–6 delivered |

---

## Phase 1 product DoD

### Domain & architecture

- [x] All money mutations go through BillingService  
- [x] No business module imports Stripe (or any PSP) SDK  
- [x] PaymentProvider interface covers Phase 1 methods  
- [x] StripeProvider is the only Stripe touchpoint  
- [x] Webhooks verified + idempotent  

### Billing lifecycle

- [x] Recurring charges generated from schedules  
- [x] Invoices published  
- [x] One-time / partial / multi-charge payments  
- [x] AutoPay enroll / disable (versioned consent)  
- [x] Receipts issued with integrity hash  
- [x] Ledger append-only entries  

### Experiences

- [x] Resident portal payments  
- [x] PM collections / adjustments / late fees / ledger  
- [x] Ops widgets  
- [x] Command Center financial indexes  

### Security

- [x] No PAN/CVV/full account numbers in M.P.A.  
- [x] Org isolation + financial permissions (`financial:admin`)  
- [x] Refund and AutoPay audited  

### Quality

- [x] Lint / typecheck / tests / build green  
- [x] Sandbox/noop payment path  
- [x] Friendly error mapping covered by tests  

### Explicit non-goals still out

- [x] Full GL / trust accounting not claimed “done”  
- [x] AI does not move money  
- [x] Secondary PSPs not required for Phase 1 DoD  

---

## Documentation DoD

- [x] Design package authored  
- [x] Cross-links from Blueprint index / integration roadmap / future integrations / testing / roadmap / AI strategy  
- [x] Approval decision recorded (package status: Approved · Implemented)
