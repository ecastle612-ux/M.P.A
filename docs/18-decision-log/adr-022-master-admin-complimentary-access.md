# ADR-022: Master Admin Complimentary Access (Entitlement Sources)

## Status
Accepted

## Date
2026-08-13

## Accepted
2026-08-13 — Product Owner implementation authorization for ADM-001.

## Context

Production billing and SKU entitlements are live. Operators need complimentary / tester access before public launch. Creating fake Stripe subscriptions would corrupt billing, lifecycle, and metrics. Permanently assigning `organization_subscriptions` without expiration or source semantics is insufficient and unsafe as a tester model.

Related:

- ADR-012 Implementation Gate  
- ADR-015 Three Commercial Products + Master Admin OS  
- ADR-018 Self-Service Commercial Platform  
- ADR-019 Product Constitution  
- Feature design: `docs/76-adm-001-complimentary-access/index.md`

## Decision

1. Introduce explicit commercial entitlement **sources**:
   - `STRIPE_SUBSCRIPTION` — Stripe-backed organization subscription (`stripe_subscription_id` present; lifecycle status rules unchanged)
   - `MASTER_ADMIN_GRANT` — row in `master_admin_access_grants` with active window

2. Resolution precedence:
   1. Active Stripe-backed subscription → use that SKU’s entitlements  
   2. Else active Master Admin grant → use `plan_granted` entitlements via existing `entitlementsForSku`  
   3. Else fail closed for paid features  

3. Grants MUST NOT create or modify Stripe Prices, Customers, or Subscriptions.

4. Grants require `organization_id`, `granted_by_user_id`, `plan_granted`, `grant_status`, `start_date`, `expiration_date` (nullable only with explicit confirmation), `reason`, timestamps; optional `notes` only.

5. Only platform operators (`platform_operators` / Master Admin) may create, extend, or revoke grants. No new customer RBAC keys.

6. Audit events: `MASTER_ADMIN_GRANT_CREATED` | `EXTENDED` | `REVOKED` | `EXPIRED`.

7. Implementation is allowed only while this ADR is **Accepted** and `docs/76-adm-001-complimentary-access` is **Approved**. Material scope changes restart Design → Document → Approve.

## Consequences

**Easier:** Clean separation of paid vs complimentary access; time-boxed testers; Stripe integrity preserved; reuse of SKU entitlement matrix and Master Admin shell.

**More difficult:** Entitlement resolver must become source-aware; Subscription Console assign needs coexistence/deprecation rules; reporting must exclude grants from paid MRR.

## Alternatives Considered

- **Fake Stripe subscriptions for testers:** Rejected — corrupts billing, webhooks, lifecycle, and finance reporting.  
- **Reuse unlimited `organization_subscriptions` assign only:** Rejected — no expiration, no grant audit semantics, conflates paid and complimentary.  
- **Global feature flag bypassing entitlements:** Rejected — weakens authorization and Product Constitution enforcement.  
- **Implement before approval:** Rejected — violates ADR-012.
