# ADR-026: Organization Provisioning & Username-First Identity

## Status
Accepted

## Date
2026-07-23

## Context
Phase 3 Identity (ADR-014) established Supabase authentication, organizations, memberships, invitations, and portal shells. BILL-001 established SaaS subscription billing as a separate rail. Commercial launch requires a clear ownership and provisioning model: customers purchase a private Organization; the subscriber becomes Organization Administrator; day-to-day users are managed by that administrator; identity must not collapse to mutable email; dashboards must not be user-selected; Org Admin recovery must protect ownership.

Without a binding architecture, teams risk email-as-identity drift, self-serve ownership takeover, open registration, and ad-hoc provisioning that conflicts with enterprise SaaS expectations.

## Decision
Adopt **AUTH-001** ([package](../109-auth-001-organization-provisioning-authentication/README.md)) as the source of truth for commercial organization provisioning and authentication architecture, **including Amendments A01–A08**:

1. **Workspace purchase:** Successful SaaS subscription activation provisions an Organization and binds plan/modules.  
2. **Ownership:** The subscriber is provisioned as Organization Administrator.  
3. **Username-first identity:** M.P.A. generates immutable, non-reusable usernames used for authentication. Email is a contact channel only.  
4. **Identity Adapter:** Retain Supabase Auth behind an adapter so product identity remains username-first.  
5. **Invitation-only:** No public self-registration; accounts created only by Org Admin or Master Admin / system provision.  
6. **Subscription capabilities:** Plan → org type → modules → dashboard → limits (users, properties, storage, AI, marketplace, add-ons); users see only what they purchased.  
7. **Recovery split:** Organization Administrator recovery is Master Admin only (plus emergency secondary contact). Subaccount recovery is Organization Administrator only.  
8. **Dashboard assignment:** Surfaces are derived; never user-selected.  
9. **Org commercial lifecycle:** Prospect → Trial → Pending Setup → Active → Suspended / Past Due → Cancelled → Archived.  
10. **Setup:** Mandatory Organization Setup Wizard with Professional Implementation or AI Guided Setup paths.  
11. **Multi-org switching:** Principal ↔ many memberships with `active_organization_id` (UX may be hidden in MVP).  
12. **Offboarding:** Disable → transfer work/messages/tasks → archive → audit; no data disappearance.  
13. **Support escalation:** AI → Org Admin → M.P.A. Support → Master Admin for auth issues.  
14. **Audit:** Privileged actions permanently audited (timestamp, actor, organization, IP/device if available, reason).  
15. **Slices:** Implementation only via authorized slices A–E, each Design → Authorize → Implement → Validate.

Implementation remains gated per slice unlock phrases.

## Consequences
**Easier:** Clear commercial ownership; safer recovery; consistent provisioning; future multi-org without redesign; entitlement visibility aligned to purchase; invitation-only security posture.

**More difficult:** Migration from email-centric / open-signup UX; Identity Adapter complexity; support process for Org Admin recovery; stricter onboarding (recovery contact, wizard); sequential slice discipline.

## Alternatives Considered
- **Keep email as primary login identity:** Rejected — email changes and inbox takeover undermine ownership.  
- **Open public registration:** Rejected — incompatible with invitation-only enterprise ownership.  
- **Self-serve Org Admin password reset via email:** Rejected — insufficient protection for organization ownership.  
- **User-selected dashboards:** Rejected — breaks role/subscription determinism.  
- **Replace Supabase Auth immediately:** Rejected — unnecessary provider churn; adapter preserves flexibility.  
- **M.P.A. staff manage customer users ongoing:** Rejected — violates customer ownership and does not scale.

## References
- [AUTH-001 package](../109-auth-001-organization-provisioning-authentication/README.md)  
- [AUTH-001 Approval record](../109-auth-001-organization-provisioning-authentication/32-approval-record.md)  
- [ADR-003 Four-Plane Authorization](./adr-003-four-plane-authorization.md)  
- [ADR-014 Phase 3 Identity](./adr-014-phase-3-identity-multitenant-foundation.md)  
- [ADR-024 SaaS Billing Separation](./adr-024-saas-stripe-billing-separation.md)  
- [BILL-001](../100-bill-001-saas-subscription-billing/README.md)
