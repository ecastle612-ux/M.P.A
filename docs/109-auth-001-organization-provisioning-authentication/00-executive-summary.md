# 00 — Executive Summary

**Package:** AUTH-001  
**Status:** ✅ Approved with Amendments · Implement 🔒 Locked

---

## Goal

Design the complete **account provisioning, authentication, onboarding, organization hierarchy, and security model** for M.P.A. so that commercial customers purchase a private workspace, receive a provisioned Organization Administrator, and operate all subsequent users inside hard tenant boundaries — without M.P.A. staff creating day-to-day users after onboarding.

---

## Product thesis

| Principle | Statement |
|-----------|-----------|
| **Workspace purchase** | Customers buy an Organization, not a personal account |
| **Ownership** | The subscriber is the Organization Administrator |
| **Identity** | Username is permanent; email is contact only |
| **Delegation** | Org Admin creates and manages all subaccounts |
| **Support boundary** | M.P.A. recovers Org Admins; Org Admins recover everyone else |
| **Surface assignment** | Dashboards are derived, never chosen |
| **Isolation** | No data may cross organizations |

---

## In scope (design)

1. Organization as private SaaS workspace  
2. Level 0 (M.P.A. Internal) and Level 1 (Organization Administrator) hierarchy  
3. Username / email / password policies  
4. Subscription activation → organization provisioning handoff from BILL-001  
5. First-login and Setup Wizard  
6. Professional Implementation and AI Guided Setup  
7. Subaccount creation and lifecycle  
8. Recovery, emergency recovery, suspension, deletion  
9. Permission hierarchy and elevation bans  
10. Multi-organization future architecture (design now; MVP exposure optional)  
11. Security model, audit requirements, sequence diagrams, edge cases, acceptance criteria  

---

## Out of scope (this package)

| Excluded | Notes |
|----------|-------|
| Implementation of auth/schema/API/UI | Gate-locked |
| Stripe Billing product/catalog | BILL-001 |
| Tenant rent / Connect payouts | API-005 / FIN-003 / PAY-001 |
| Visual redesign of login screens | UX-005 (must later align) |
| Full RBAC catalog for every module | Defines hierarchy + rules; module grants stay in domain packages |
| SOC 2 certification program | Architecture readiness only |
| SSO / SAML / OIDC enterprise federation | Designed as future extension slot |
| Replacing Supabase Auth | Remains behind Identity Adapter |

---

## Success

**Design PASS** when gate owners Approve this package and ADR-026.  
**Product PASS** (post-implement) when the PASS criteria in the [README](./README.md) and [23 — Acceptance criteria](./23-acceptance-criteria.md) are met without cross-org leakage or identity confusion.

---

## Non-negotiable invariants

1. Username never changes and is never reused.  
2. Email changes never affect authentication.  
3. Temporary passwords expire forever after first successful password change.  
4. Passwords are always hashed; plaintext never stored or displayed to staff.  
5. Org Admin cannot access another organization.  
6. Subaccounts cannot elevate beyond grants or change organization.  
7. Every privileged action is **permanently** audited.  
8. Dashboards are never user-selectable.  
9. **No public self-registration** — invitation-only ([27](./27-invitation-only-platform.md)).  
10. Users see **only** purchased subscription capabilities ([26](./26-subscription-capability-matrix.md)).
