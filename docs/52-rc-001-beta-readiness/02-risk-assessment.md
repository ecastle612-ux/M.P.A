# 02 — Risk Assessment

**Package:** RC-001  
**Date:** 2026-07-17

---

## Risk register

| ID | Risk | Likelihood | Impact | Severity | Mitigation |
|----|------|------------|--------|----------|------------|
| R1 | Partner expects Owner/Vendor portal parity | High | High | P1 → managed | Explicitly out of beta scope; signed limitations |
| R2 | Providers left on `noop` in partner env | Medium | High | P1 | Admin guide lists required env flips + sandbox keys |
| R3 | Incomplete journey e2e automation masks regressions | Medium | Medium | P1 | Manual walkthrough checklist before each partner go-live |
| R4 | ACH timing / reconciliation confusion | Medium | Medium | P1 | Document pending vs settled; reconcile action in BillingService |
| R5 | SMS/email delivery gaps for residents | High | Medium | P1 | In-app + optional push only; set expectations |
| R6 | PCI scope expansion if Elements bypassed | Low | Critical | P0 if violated | Enforce PaymentProvider + hosted fields only |
| R7 | Cross-org data leak | Low | Critical | P0 if found | RLS + capability checks; security smoke required |
| R8 | Offline field work assumed complete | Medium | Medium | P2 | Document SW cache-only; no sync queue |
| R9 | Full GL / trust accounting expected | Medium | High | P1 | ADR-010 + known limitations |
| R10 | AI initiates money/comms | Low | Critical | P0 if violated | Product rule: human-gated only |

---

## Residual acceptance

Design Partner beta accepts residual risk of incomplete portal surfaces and noop defaults **when limitations are signed**. Residual risk of live provider misconfiguration is owned by M.P.A. admin onboarding checklist.
