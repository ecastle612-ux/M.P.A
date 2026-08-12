# Master Admin — Implementation Slices, Acceptance & Open Questions

**Parent:** [70 Master Admin Command Center](./index.md)  
**Status:** Draft / Proposed  
**Gate:** No slice may be implemented until this blueprint + ADR-022 are Accepted **and** that slice is explicitly authorized.

---

## Implementation slices

Slices are documentation-sequenced for least risk: read/inspect first, then governed mutations, then deeper operations.

### Slice MA-0 — Blueprint & ADR (this package)

- Deliver docs package 70 + ADR-022 Proposed → Accepted by PO  
- **Code: none**

### Slice MA-1 — Overview health + Errors explorer

**Scope:**  
- Overview signals wired to real aggregates (orgs, subscriptions, trials, units, checkout/provisioning failures, webhooks, critical errors, notification failures, auth denials if available, system health)  
- Errors list/detail over `platform_error_events`  
- Deep links into Organization Detail (existing or minimal)

**Non-goals:** new mutation types; new error system.

### Slice MA-2 — Organization Detail diagnostic spine

**Scope:**  
- Expand org profile into tabbed diagnostic model (users, modules, properties/units, subscription/Stripe, capacity, checkout/provisioning, WO summary, notifications, webhooks, errors, audit)  
- Server-scoped loaders; section-level failure isolation

### Slice MA-3 — Users & Memberships + Audit Log explorer

**Scope:**  
- Fleet users/memberships directory  
- Unified audit explorer over `platform_support_audit_events` (+ carefully scoped domain audit reads)

### Slice MA-4 — Subscriptions + Stripe linkage + Units & Capacity

**Scope:**  
- Subscriptions fleet UI  
- Stripe ids / items / Price id visibility (scrubbed)  
- Units & Capacity fleet + org reconciliation views (read-only)

### Slice MA-5 — Checkout, Provisioning & Webhooks health

**Scope:**  
- Checkout/provisioning anomaly queues  
- Stripe + SignWell webhook health panels  
- Wire existing retry/claim support actions with confirmation + audit verification

### Slice MA-6 — Operations queues

**Scope:**  
- Cross-org WO backlog (PM + FO surfaces)  
- Vendor health signals  
- Notification/email failure queue  
- Checkout/quote anomaly queue  
- Authorization denial summaries

### Slice MA-7 — Capability RBAC hardening + governed org lifecycle mutations

**Scope:**  
- Operator capability model  
- Suspend / reactivate with side-effect spec, confirmation, audit  
- Tighten APIs to capability checks  
- Optional error resolve/ack fields

### Slice MA-8 — Hardening & certification

**Scope:**  
- a11y, performance budgets for admin pages  
- Security review of admin APIs  
- Certification checklist against acceptance criteria  
- **Still no Production deploy unless separately authorized**

---

## Acceptance criteria (package-level)

### Product

- [ ] Master Admin is operable as a control center, not a vanity dashboard  
- [ ] Navigation matches approved IA (or documented mapping from live routes)  
- [ ] Overview answers “Is M.P.A. healthy right now?” with real signals  
- [ ] Organization Detail connects the full diagnostic chain  
- [ ] All nine “must expose” domains are inspectable  
- [ ] Operational visibility queues exist or are explicitly deferred with PO sign-off  

### Architecture

- [ ] No duplicate org/subscription/unit/WO/notification/webhook/error systems  
- [ ] Observability consumed from Sprint 5 architecture  
- [ ] Constitution-safe SKU labeling only  

### Security

- [ ] Operator gate on all MA routes/APIs  
- [ ] Permissions matrix enforced (or bootstrap mapping documented)  
- [ ] Mutation matrix enforced; destructive actions confirmed + audited  
- [ ] Client org ids never trusted as sole authorization input  
- [ ] Sensitive data minimized in UI/logs/audit  

### Quality

- [ ] Empty/error states honest per surface  
- [ ] Desktop-primary responsive behavior documented and met  
- [ ] Automated tests for authz on admin mutations  
- [ ] Manual certification script for Overview + Org Detail + one mutation  

---

## Test strategy

| Layer | Focus |
|-------|-------|
| Unit | Metric classifiers, DTO mappers, capability checks |
| Integration | Admin API authz (non-operator 403), org scope mismatch 403/404, audit row written on mutation |
| RLS / DB | Operator select policies on `platform_error_events`, support audit; no anon access |
| UI | Overview tile deep-links; Org Detail tabs load independently; confirmation modals |
| Regression | Existing Owner Ops flows (search, View-As, provisioning retry, invitation resend) remain green |
| Security | CSRF on mutations; rate limit smoke; scrubbing tests for secrets in error metadata |

**Forbidden in tests:** Production Stripe live side effects; Production DB destructive fixtures.

---

## Open questions (Product Owner)

1. **Suspend/reactivate side effects** — Should suspend block login, freeze entitlements, cancel Stripe, or only flag support state?  
2. **Capability model timing** — Ship MA-1..MA-6 with boolean operators, or require capabilities before any new mutations?  
3. **Manual capacity mutation** — Allow operators to edit authorized capacity, or keep Stripe/webhook as sole writer? (Blueprint default: **no manual edit**)  
4. **Webhook replay** — Expose safe replay in MA, or keep provider dashboard + natural retries only? (Default: **inspect-only**)  
5. **Error resolution schema** — Add `resolved_at` / `resolved_by` on `platform_error_events`, or track triage only in support audit?  
6. **Finance webhook visibility** — Show `financial_stripe_webhook_events` in the same Webhooks surface, or keep SaaS vs Connect separated?  
7. **Nav migration** — Replace Owner Ops nav groups in one cut, or alias old routes during MA-1..MA-5?  
8. **Impersonation write expansion** — Remains read-only View-As? (Default: **yes, read-only**)  
9. **Enterprise org labeling** — How should sales-led Enterprise orgs appear without implying a fourth product SKU?  
10. **Production deploy authority** — Which slice (if any) is allowed to deploy to Production, and under what cert gate?

---

## Final report template (for implement turns)

Use after each authorized slice:

```
Master Admin slice: MA-#
Code changes: ...
Database changes: none | additive migration ...
Stripe: NO CHANGES (unless explicitly authorized)
Vercel Production: NO DEPLOYMENT (unless explicitly authorized)
```
