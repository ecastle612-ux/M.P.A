# 14 — Definition of Done

**Package:** BILL-001  
**Status:** Draft — Ready for Approval

---

## Package gate

| Criterion | Met when |
|-----------|----------|
| Docs 00–15 present | ✔ |
| Separation from rent/Connect explicit | ✔ |
| Plans, admin UX, Master Admin KPIs, webhooks, schema, phases, cert | ✔ |
| ADR-024 Proposed | ✔ |
| Status → Approved | After sign-off |

---

## Product DoD (post-implement)

- [ ] SubscriptionService sole SaaS write path  
- [ ] One sub per org enforced  
- [ ] Checkout + Portal + webhooks green  
- [ ] Company Admin Billing page complete  
- [ ] Entitlements enforced  
- [ ] Master Admin SaaS metrics visible  
- [ ] P0 certification S01–S12 PASS  
- [ ] typecheck + production build green  
- [ ] No writes to rent/Connect money tables from SaaS path  

---

## Explicit non-claims until product DoD

FIN-002/FIN-003 PASS are independent. BILL-001 PASS does not certify rent or owner payouts.
