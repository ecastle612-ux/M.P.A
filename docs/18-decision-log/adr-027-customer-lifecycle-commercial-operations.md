# ADR-027: Customer Lifecycle & Commercial Operations (COM-001)

## Status
Accepted

## Date
2026-07-23

## Context
AUTH-001 defines who users are and how organizations are provisioned after activation. BILL-001 defines the Stripe SaaS money rail. FIN-003 covers owner payout financial operations. Neither AUTH nor BILL alone defines how a lead becomes a paying customer, how implementation and customer success operate, or how renewal/cancellation/reactivation are owned across teams.

Without a commercial lifecycle SoT, authentication may assume customers already exist, sales may create orgs prematurely, and handoffs remain tribal knowledge.

## Decision
Adopt **COM-001** ([package](../110-com-001-customer-lifecycle-commercial-operations/README.md)) as the commercial source of truth for M.P.A. customer lifecycle and commercial operations, **including Amendments A01–A09**:

1. **Lifecycle + sales pipeline:** Full CRM pipeline (Lead → MQL → SQL → Discovery → Demo → Proposal → Negotiation → Won → Subscription Purchased → Organization Created → Customer Active) with Source, Sales Owner, Expected Close, Probability, Lost Reason, CAC, Referral, Demo Completed.  
2. **Origin rule:** Every authenticated customer organization originates from COM-001 Payment Successful activation (or audited Master Admin exception that emits the event).  
3. **Separation:** COM-001 = journey/ops; BILL-001 = SaaS money; AUTH-001 = identity; FIN-003 = owner financial ops.  
4. **Plans:** Every feature maps to a plan or add-on.  
5. **Implementation progress:** 0–100% milestone score visible to customer, CS, Support, AI.  
6. **Health score:** Automatic Healthy → Critical bands drive CS prioritization.  
7. **Feature discovery:** Continuous post-implementation adoption prompts (entitlement-aware).  
8. **Trial experience:** Length, features, watermarks, reminders, grace, upgrade.  
9. **Offboarding:** Cancel → export → freeze → archive → deletion schedule with recovery window.  
10. **Implementation marketplace:** Architecture for certified partners (MVP may be internal-only).  
11. **Commercial dashboard:** Staff-only ops dashboard.  
12. **Communication timeline:** Unified per-org commercial communications log.  
13. **Slices:** Implementation only via authorized slices A–E.

## Consequences
**Easier:** Clear sales-to-customer path; safe AUTH boundary; operable CS/renewal/cancel; adoption and health visibility; staff commercial HQ.  
**More difficult:** CRM/ops discipline; score/threshold tuning; coordination across AUTH/BILL/ADMIN packages; sequential slice discipline.

## Alternatives Considered
- **Fold lifecycle into AUTH-001:** Rejected — conflates identity with commercial ops.  
- **Fold lifecycle into BILL-001:** Rejected — Stripe rail is necessary but not sufficient.  
- **CRM-only tribal process:** Rejected — fails Implementation Gate.

## References
- [COM-001 package](../110-com-001-customer-lifecycle-commercial-operations/README.md)  
- [COM-001 Approval record](../110-com-001-customer-lifecycle-commercial-operations/27-approval-record.md)  
- [AUTH-001](../109-auth-001-organization-provisioning-authentication/README.md)  
- [BILL-001](../100-bill-001-saas-subscription-billing/README.md)  
- [FIN-003](../98-fin-003-owner-payout-stripe-connect/README.md)  
- [ADR-026](./adr-026-organization-provisioning-username-identity.md)  
- [ADR-024](./adr-024-saas-stripe-billing-separation.md)
