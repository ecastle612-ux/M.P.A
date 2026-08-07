# Approval Recommendation — COM-002

## Decision

# APPROVE WITH AMENDMENTS

---

## Rationale

### Why not APPROVE (as-is)

The Draft would authorize a future implementation that could:

1. Auto-sell Facility Operations / Complete without matching operational depth (**trust failure at scale**).  
2. Bind workspaces to emails without hard proof (**security failure**).  
3. Ship a demo model that collapses under load (**scalability failure**).  
4. Retry provisioning without compensating checkpoints (**ops failure**).  
5. Miss chargeback/SCA/expired/pause/invite journeys (**lifecycle holes**).

Approving without amendments would violate the purpose of this review: find weaknesses before approval.

### Why not NO-GO

COM-002 correctly:

- Automates Professional / Business.  
- Keeps Enterprise high-touch.  
- Separates SaaS Stripe from FIN-OPS.  
- Preserves ADR-015 products.  
- Defines Live Demo and conversion.  
- Sequences slices A–G under the Implementation Gate.  

These are the right bones for an enterprise SaaS commercial platform.

---

## Amendments required before Approve (blocking)

| ID | Amendment | Rationale |
|----|-----------|-----------|
| **A1** | Self-serve catalog honesty for FO/Complete | Prevent paid oversell |
| **A2** | Checkout→account security + redirect/webhook race | Prevent takeover / empty success |
| **A3** | Scalable demo tenancy (overlay + caps; separate DB/project) | Prevent cost/abuse meltdown |
| **A4** | Missing journeys (expired, dispute, SCA, pause in/out, invites) | Complete lifecycle |
| **A5** | Provisioning checkpoint state machine + compensation | Safe automation |
| **A6** | Enterprise fork before Checkout + technical enforcement | Keep motions separate |
| **A7** | Decide O2/O5/O6 with defaults in the package | Architecture must be decidable |

---

## Non-blocking recommendations

- Compress default UX toward fewer pre-Checkout decisions.  
- Define dunning email/banner cadence.  
- Prefer separate Stripe webhook endpoint for SaaS.  
- Disable demo uploads by default.  
- Set O1/O3/O4/O7–O10 before the relevant slices.

---

## How to Approve

1. Author COM-002 amendments (or Accepted amendment addendum) addressing A1–A7.  
2. Stakeholder **APPROVE COM-002** + **Accept ADR-018**.  
3. Authorize **Slice A** only when ready — still no broad implement.  

---

## Explicitly not authorized by this review

- Application code  
- Migrations  
- APIs  
- Stripe implementation  
- UI implementation  
- Capital Projects  
