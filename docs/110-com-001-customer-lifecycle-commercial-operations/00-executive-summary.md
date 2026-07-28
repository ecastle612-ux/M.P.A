# 00 — Executive Summary

**Package:** COM-001  
**Status:** ✅ Approved with Amendments · Implement 🔒 Locked

---

## Goal

Define the complete **customer lifecycle** for M.P.A. from first contact through subscription, onboarding, implementation, renewal, cancellation, suspension, and reactivation — so commercial operations are explicit, auditable, and free of tribal knowledge.

---

## Product thesis

| Principle | Statement |
|-----------|-----------|
| **Commercial origin** | Every authenticated organization originates from COM-001 (or audited Master Admin commercial exception) |
| **Separation** | AUTH = identity; BILL = money rail; COM = customer journey & ops |
| **Plan completeness** | No feature exists outside a subscription plan or approved add-on |
| **Implementation choice** | Every customer chooses Professional Implementation **or** AI Guided Setup |
| **Owned handoffs** | Sales, Billing, Auth, Provisioning, Implementation, CS, Support, Renewals each have named transfers |
| **Invitation-only team accounts** | Team users never self-register (AUTH-001); **customer acquisition** may be public self-serve for Trial/Pro/Business per [A10](./43-amendment-a10-self-service-acquisition.md) / [ACQ-001](../115-acq-001-self-service-customer-acquisition/README.md) |

---

## In scope (design)

1. Full customer lifecycle stages with entry/exit criteria  
2. Sales-to-customer workflow  
3. Subscription plan architecture (modules, limits, support, integrations, add-ons)  
4. Billing / commercial state machine  
5. Implementation workflows (Professional + AI Guided)  
6. Customer success post-sale model  
7. Renewal, cancellation, reactivation  
8. Support ownership for commercial issues  
9. Cross-team handoffs  
10. Sequence diagrams, edge cases, acceptance criteria  

---

## Out of scope

| Excluded | Owner / note |
|----------|----------------|
| Auth/schema/API/UI implementation | Gate-locked |
| Stripe product wiring / webhook code | BILL-001 |
| Identity Adapter / username login code | AUTH-001 |
| Marketing website redesign | Future / brand packages |
| Exact dollar prices | Commercial ops (Stripe), not architecture |
| Tenant rent / Connect payouts | API-005 / FIN-003 / PAY-001 |

---

## Success

**Design PASS** when gate owners Approve COM-001 and ADR-027.  
**Ops PASS** (post-implement) when every lifecycle stage has executable entry/exit, notifications, billing behavior, and support ownership without undocumented steps.
