# ADR-022: Master Admin Complimentary Access (Entitlement Sources)

## Status
Accepted (amendment **Accepted** — 2026-08-13 beta invitation revision)

## Date
2026-08-13

## Accepted
2026-08-13 — Product Owner implementation authorization for ADM-001 entitlement sources.

## Amendment (Accepted)
2026-08-13 — Replace direct account provisioning with customer-style **invitation → signup/login → Guided Setup → ACTIVE grant** beta workflow. Tester lifecycle: `INVITED` | `ACTIVE` | `EXPIRED` | `REVOKED`. Product Owner authorized implementation.

## Context

Production billing and SKU entitlements are live. Operators need complimentary / beta tester access before public launch without fake Stripe subscriptions.

The first Accepted decision established entitlement sources and Stripe precedence. Product feedback requires testers to experience a **realistic customer path**: invitation, account, Guided Setup/tutorial, then full granted-plan access — not operator-side direct account creation that skips onboarding.

Related:

- ADR-012 Implementation Gate  
- ADR-015 Three Commercial Products + Master Admin OS  
- ADR-018 Self-Service Commercial Platform  
- ADR-019 Product Constitution (account → Guided Setup → Mission Control order)  
- Feature design: `docs/76-adm-001-complimentary-access/index.md`

## Decision

1. Introduce explicit commercial entitlement **sources**:
   - `STRIPE_SUBSCRIPTION` — Stripe-backed organization subscription (`stripe_subscription_id` present; lifecycle status rules unchanged)
   - `MASTER_ADMIN_GRANT` — complimentary grant row with entitlement-active window

2. Resolution precedence (**unchanged**):
   1. Active Stripe-backed subscription → that SKU’s entitlements  
   2. Else entitlement-active Master Admin grant → `plan_granted` via `entitlementsForSku`  
   3. Else fail closed for paid features  

3. Grants MUST NOT create or modify Stripe Prices, Customers, or Subscriptions.

4. **Beta provisioning path (amended):**
   - Master Admin supplies tester email + plan + expiration (+ reason)  
   - System sends a **customer-style organization invitation**  
   - Tester signs up or logs in, accepts invite, completes **Guided Setup**  
   - Only then does the grant become entitlement-active  

5. **Tester lifecycle** on the grant: `INVITED` | `ACTIVE` | `EXPIRED` | `REVOKED`.  
   - Paid-tier entitlements apply only when lifecycle is `ACTIVE` and the time window is valid.  
   - `INVITED` allows setup/invite acceptance paths only (fail closed for paid modules).

6. Grant records include organization, operator actor, plan, lifecycle, start/expiration, reason, timestamps; optional notes; invitation reference and tester email as needed for invite/audit — no unnecessary PII.

7. Only platform operators may create invites/grants, extend, or revoke. No new customer RBAC keys.

8. Audit events: `MASTER_ADMIN_GRANT_CREATED` | `ACTIVATED` | `EXTENDED` | `REVOKED` | `EXPIRED`.

9. Billing UI for grant-backed orgs must present complimentary/beta access (not a fake Stripe subscription). Paid MRR/ARR and Checkout conversion analytics must exclude grants (tag beta usage separately if needed).

10. Material scope changes restart Design → Document → Approve. This invitation/lifecycle amendment is **Accepted** with docs/76 **Approved**.

## Consequences

**Easier:** Testers validate real onboarding; Stripe integrity preserved; entitlement matrix reused; clear lifecycle for ops.

**More difficult:** Invite + Guided Setup activation hooks; entitlement resolver must key off `ACTIVE` lifecycle; prior direct-provision code paths must be aligned or replaced; billing surfaces need complimentary labeling.

## Alternatives Considered

- **Fake Stripe subscriptions for testers:** Rejected — corrupts billing, webhooks, lifecycle, and finance reporting.  
- **Direct operator account creation skipping Guided Setup:** Rejected in this amendment — does not match paying-customer beta goals.  
- **Reuse unlimited `organization_subscriptions` assign only:** Rejected — no expiration, weak grant audit, conflates paid and complimentary.  
- **Global feature flag bypassing entitlements:** Rejected — weakens authorization and Product Constitution enforcement.  
- **Implement amendment before re-approval:** Rejected — violates ADR-012.
