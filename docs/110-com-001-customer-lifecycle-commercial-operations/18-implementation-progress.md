# 18 — Implementation Progress Tracker

**Package:** COM-001  
**Amendment:** A02  
**Status:** Binding (Approved with Amendments)

---

## Purpose

Every customer organization has an **implementation score** (0–100%) reflecting setup progress toward Production Ready.

Displayed to:

- Customer (Org Admin / entitled implementers)  
- M.P.A. Support  
- Customer Success  
- AI Assistant (org-scoped)  

---

## Score model (canonical milestones)

| Score | Milestone | Meaning |
|------:|-----------|---------|
| **0%** | Purchased | Payment Successful; commercial Won converted |
| **10%** | Organization Created | AUTH-001 org + Org Admin provisioned |
| **25%** | Stripe Connected | Applicable payments/Connect step complete (or N/A waived) |
| **40%** | Properties Imported | ≥1 property live **or** explicit “none yet” deferral counted partial |
| **55%** | Units Imported | Units mapped for imported properties (or deferral rule) |
| **70%** | Tenants Imported | Tenant records staged/confirmed (or deferral) |
| **85%** | Team Invited | ≥1 staff invite sent **or** solo-admin acknowledgment |
| **100%** | Production Ready | Finish Setup + recovery contact + required checklist complete |

Exact weighting may be tuned at Implement without changing milestone names. Design default: **highest completed milestone** drives displayed score (monotonic); optional weighted blend later.

---

## Milestone rules

| Milestone | Complete when | Waive / N/A |
|-----------|---------------|-------------|
| Purchased | COM-001 Payment Successful | — |
| Organization Created | Org exists; welcome issued | — |
| Stripe Connected | Provider connection ready for plan requirements | Owner-only SKUs may mark N/A → credit 25% |
| Properties Imported | Count ≥1 or deferred with reason | Deferral caps score below 100 until resolved or Finish acknowledges |
| Units Imported | Units exist for properties or deferred | Same |
| Tenants Imported | Tenants linked or deferred | Same |
| Team Invited | Invite sent or solo ack | Solo admin allowed |
| Production Ready | AUTH-001 Finish Setup criteria met | — |

---

## Visibility

| Audience | Sees |
|----------|------|
| **Customer** | Progress bar, next recommended step, blockers |
| **Customer Success** | Score + stalled days + health coupling ([19](./19-customer-health-score.md)) |
| **Support / Tech** | Score + failed milestone details |
| **AI Assistant** | Same as customer context; can coach next step; cannot fake 100% |

---

## Stalled implementation

| Signal | Action |
|--------|--------|
| No score increase N days | CS + AI nudge |
| Stuck below 25% after kickoff SLA | Professional Implementation offer |
| Stuck at Stripe | Guided connector + Support |

---

## Relationship to Setup Wizard

Wizard steps ([05](./05-implementation-workflows.md), AUTH-001 wizard) **update** milestones. Score is the cross-path progress contract for Professional and AI Guided alike.

---

## Acceptance (A02)

| ID | Criterion |
|----|-----------|
| IP-01 | 0→100% milestone ladder defined |
| IP-02 | Visible to Customer, Support, CS, AI |
| IP-03 | Production Ready requires Finish Setup gates |
| IP-04 | Score cannot reach 100% without recovery contact + Finish |
