# ACQ-001 — Self-Service Customer Acquisition

**Status:** ✅ **APPROVED** (2026-07-27) · Slices A–C ✅ **IMPLEMENTED** · Slice D 🔒  
**Initiative ID:** ACQ-001  
**Priority:** CRITICAL (commercial acquisition)  
**Type:** Public self-service acquisition & first-run commercial experience  
**Gate:** Design → Document → **Approve** → Implement  
**Policy:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)  
**Date:** 2026-07-27  
**Author:** Product + Lead Architect (documentation)  
**Gate owners:** Product + Commercial + Lead Architect + Security  
**Depends on:** [COM-001](../110-com-001-customer-lifecycle-commercial-operations/README.md) · [AUTH-001](../109-auth-001-organization-provisioning-authentication/README.md) · [BILL-001](../100-bill-001-saas-subscription-billing/README.md) · Canopy · Experience Architecture  
**COM-001 amendment:** [A10 — Self-service acquisition](../110-com-001-customer-lifecycle-commercial-operations/43-amendment-a10-self-service-acquisition.md) (**Accepted**)  
**Approval record:** [21](./21-approval-record.md)  
**Slice A:** [22](./22-slice-a-authorization.md) · [23](./23-slice-a-implementation.md)  
**Slice B:** [24](./24-slice-b-authorization.md) · [25](./25-slice-b-implementation.md)  
**Slice C:** [26](./26-slice-c-authorization.md) · [27](./27-slice-c-implementation.md)  
**Pending amendment:** [28 — A11 Modules-first + trial messaging](./28-amendment-a11-modules-first-trial-messaging.md) (**Draft**) · companion [UX-013](../117-ux-013-customer-acquisition-contextual-navigation/README.md)

> **Slice C COMPLETE.** Production certification (engineering evidence) + analytics/SEO/a11y/ops readiness. Await `AUTHORIZE ACQ-001 SLICE D` only if residual continuous work is needed.  
> **UX-013 / A11** (modules-first + trial CTA removal) is **Draft — Ready for Approval** — do not implement acquire UX changes until `APPROVE UX-013` / `ACCEPT ACQ-001 AMENDMENT A11`.

---

## Product direction (binding when Approved)

> **Public self-service acquisition for Trial / Professional / Business.**  
> **Enterprise remains sales-assisted.**  
> This supersedes COM-001 **C6 (invitation-only acquisition)** via [Amendment A10](../110-com-001-customer-lifecycle-commercial-operations/43-amendment-a10-self-service-acquisition.md).

**Does not** make M.P.A. an open registration platform. AUTH-001 invitation-only for **team members / subaccounts** remains binding. Public visitors may **purchase** (or start a Trial Checkout); they may not create free accounts without the commercial provision pipeline.

---

## Design philosophy

| Principle | Meaning |
|-----------|---------|
| Professional | Calm, credible property-ops brand — not consumer gimmicks |
| Fast | Minimal steps from intent to paid workspace |
| Simple | One job per screen; plain language |
| Minimal clicks | Prefer Checkout metadata over long forms |
| Self-service | Standard customers need no human to start |
| Production-ready | Reuse BILL / AUTH / COM / Setup / entitlements |
| Software does the work | Org, admin, plan, modules provisioned automatically after payment |

---

## Happy path (SoT)

```
Visitor → Landing → Product Tour → Pricing → Select Plan
  → Stripe Checkout → Payment Success
  → Automatic Organization Provisioning → Org Admin Account
  → Email / credential delivery → First Login
  → Guided Setup → Organization Activation → Production Dashboard
```

Enterprise: Landing / Pricing → **Contact Sales** / **Schedule Demo** → COM-001 sales pipeline → assisted activation (existing).

---

## Separation of concerns

| Package | Owns |
|---------|------|
| **ACQ-001** | Public discovery → Checkout entry → post-purchase success/resume UX |
| **COM-001** | Commercial lifecycle SoT; opportunities; activation rules; A10 acquisition mode |
| **BILL-001** | Stripe Billing rail, webhooks, entitlements bind, Company Billing Center |
| **AUTH-001** | Org + Org Admin provision, identity, first-login, invitation-only team |
| **Setup / activation** | Guided Setup + commercial Active |
| **OPS-001** | Events, notifications backbone (consume, do not duplicate) |

**Rule:** Do not duplicate billing, provision, entitlement, or setup logic. ACQ-001 surfaces **orchestrate** existing services.

---

## Documents

| Doc | Purpose |
|-----|---------|
| [00 — Executive summary & business goals](./00-executive-summary.md) | Why / non-goals |
| [01 — Customer personas](./01-personas.md) | Who buys |
| [02 — Customer journey](./02-customer-journey.md) | Full path + alternates |
| [03 — Public website](./03-public-website.md) | Landing, tour, pricing, FAQ |
| [04 — Checkout & payment](./04-checkout-and-payment.md) | Entry, Stripe, success/failure |
| [05 — Provisioning & authentication](./05-provisioning-and-auth.md) | Org, admin, first login |
| [06 — Guided Setup & activation](./06-guided-setup-and-activation.md) | Setup → Active → dashboard |
| [07 — Subscription lifecycle (buyer)](./07-subscription-lifecycle.md) | Upgrade / downgrade / cancel / resume |
| [08 — Email, notifications, audit](./08-email-notifications-audit.md) | Communications & evidence |
| [09 — Error handling](./09-error-handling.md) | Recovery matrix |
| [10 — Accessibility, mobile, SEO](./10-accessibility-mobile-seo.md) | Inclusive public surfaces |
| [11 — Security](./11-security.md) | Abuse, fraud, tenancy |
| [12 — Analytics](./12-analytics.md) | Funnel metrics |
| [13 — Sequence diagrams](./13-sequence-diagrams.md) | Technical sequences |
| [14 — State diagrams](./14-state-diagrams.md) | Onboarding / commercial states |
| [15 — User flow diagrams](./15-user-flow-diagrams.md) | UX flows |
| [16 — Acceptance criteria](./16-acceptance-criteria.md) | Testable requirements |
| [17 — Acceptance checklist](./17-acceptance-checklist.md) | Gate checklist |
| [18 — Open questions](./18-open-questions.md) | ✅ OQ-01–OQ-12 resolved |
| [19 — Approval checklist](./19-approval-checklist.md) | Stakeholder sign-off |
| [20 — Integration map](./20-integration-map.md) | Reuse existing systems |
| [21 — Approval record](./21-approval-record.md) | ✅ **APPROVE ACQ-001** |
| [22 — Slice A Authorization](./22-slice-a-authorization.md) | ✅ **AUTHORIZED** |
| [23 — Slice A Implementation](./23-slice-a-implementation.md) | ✅ **IMPLEMENTED** |
| [24 — Slice B Authorization](./24-slice-b-authorization.md) | ✅ **AUTHORIZED** |
| [25 — Slice B Implementation](./25-slice-b-implementation.md) | ✅ **IMPLEMENTED** |
| [26 — Slice C Authorization](./26-slice-c-authorization.md) | ✅ **AUTHORIZED** |
| [27 — Slice C Implementation & validation](./27-slice-c-implementation.md) | ✅ **IMPLEMENTED** |
| [28 — Amendment A11: Modules-first + trial messaging](./28-amendment-a11-modules-first-trial-messaging.md) | 📝 **Draft** — companion UX-013 |

---

## Implementation gate

| Slice | Scope | Status |
|-------|-------|--------|
| **A** | Public marketing shell: landing + overview + tour + pricing + contact + checkout **navigation** | ✅ **IMPLEMENTED** |
| **B** | Checkout Session + Contact Sales COM + success/cancel/error + provision wire | ✅ **IMPLEMENTED** |
| **C** | Production cert + analytics + SEO + a11y + ops readiness | ✅ **IMPLEMENTED** |
| **D** | Residual continuous analytics/ops (optional) | 🔒 |

---

## Explicit non-goals

- Replacing COM-001 sales CRM for Enterprise
- Open `/signup` without payment / Trial Checkout
- Public self-registration of arbitrary team users
- Redesigning BILL-001 money rail or AUTH identity model
- Marketplace partner acquisition (separate)
- Founder plan public purchase (remains Master Admin grant)

---

## Related governance updates

- COM-001 **Amendment A10** (required companion)
- AUTH-001 invitation-only remains for subaccounts; marketing CTA → purchase already allowed ([27](../109-auth-001-organization-provisioning-authentication/27-invitation-only-platform.md))
- BILL-001 deferred “public marketing pricing page” is **in scope here** (ACQ owns UX; BILL owns Checkout session APIs)

---

## Related packages

| Package | Relationship |
|---------|--------------|
| [UX-013](../117-ux-013-customer-acquisition-contextual-navigation/README.md) | 📝 Draft — modules-first journey + contextual nav; **Implement locked** |
| [Amendment A11](./28-amendment-a11-modules-first-trial-messaging.md) | 📝 Draft companion — Trial messaging removal + modules-first (supersedes parts of §02 / public CTAs when Accepted) |
| [BILL-001 modules-first amendment](../100-bill-001-saas-subscription-billing/22-amendment-modules-first-public-catalog.md) | 📝 Draft — public catalog / Trial entry |
| [ADR-031](../18-decision-log/adr-031-ux-013-modules-first-contextual-navigation.md) | Proposed |
