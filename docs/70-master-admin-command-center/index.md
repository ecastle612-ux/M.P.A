# 70 — Master Admin Command Center Blueprint

**Status:** Draft / Proposed — awaiting Product Owner approval  
**Gate:** Design → Document → Approve → Implement  
**Type:** Documentation only (no application code, migrations, Stripe, Vercel, or Production deploy)  
**Date:** 2026-08-11  
**Baseline main:** `bcc2455eca688b7048c743bb115599fbc817894d`  
**Prior phase:** Production Stabilization — COMPLETE  
**ADR:** [ADR-022](../18-decision-log/adr-022-master-admin-command-center.md) (Proposed)

---

## Executive purpose

Master Admin Command Center is the **operational control, observability, diagnostic, and administrative center** for the entire M.P.A. platform.

It is **not** a customer product. It is **not** a reporting dashboard.

It must answer, continuously:

1. Is M.P.A. healthy right now?
2. Which organizations are broken, at risk, or incomplete?
3. What commercial, provisioning, webhook, auth, or runtime failures require operator action?
4. For any organization: what is the full connected truth from identity → subscription → Stripe → units → operations → errors → audit?

Master Admin must expose fleet-wide control surfaces and one authoritative **Organization Detail** diagnostic model.

---

## Relationship to existing work

| Package / source | Role relative to this blueprint |
|------------------|----------------------------------|
| [24 Master Admin Capability Map](../24-product-architecture/master-admin-capability-map.md) | Commercial/operator OS mandate (Approved) |
| [52 Phase 4 Master Admin](../52-phase-4-master-admin/index.md) | Early Phase 4 shell / certification reports |
| [61 Owner Ops Master Admin](../61-owner-ops-master-admin/index.md) | Live Owner Operations Console (simplified nav) |
| [28 MA Command Center Architecture](../28-production-stabilization/master-admin-command-center-architecture.md) | Sprint 5 approved target surfaces + foundation |
| [ADR-015](../18-decision-log/adr-015-three-commercial-products-master-admin.md) | Three products + Master Admin OS |
| [ADR-019](../18-decision-log/adr-019-product-constitution.md) | Product Constitution (Enterprise ≠ product) |
| [ADR-021](../18-decision-log/adr-021-production-stabilization-sprint-5.md) | Observability / error feed foundation |

This package **supersedes** fragmented “what Master Admin should become” notes by defining the **complete product + implementation blueprint** for the next major phase after Production Stabilization. It does **not** authorize implementation until ADR-022 is Accepted and slices are explicitly authorized.

---

## Product principles

1. **Control center, not dashboard** — Every surface exists to diagnose or operate; vanity charts are forbidden.
2. **One diagnostic spine** — Organization Detail is the primary drill-down; lists feed into it.
3. **Reuse before invent** — Organizations, memberships, subscriptions, entitlements, units, properties, work orders, vendors, notifications, webhooks, audit, and observability already exist; Master Admin consumes them.
4. **No second error system** — Critical errors come from Sprint 5 `platform_error_events` / observability module only.
5. **No admin bypass** — Operator privilege is explicit RBAC + capabilities + audit; never “skip RLS for convenience” in the UI layer.
6. **Server-resolved org scope** — Never trust client-provided organization IDs for mutations; resolve and validate server-side.
7. **Least privilege mutations** — Prefer inspect/read; mutations require capability, confirmation when destructive, and audit.
8. **Sensitive-data minimization** — Do not display secrets, full payment credentials, raw webhook signing secrets, or unnecessary PII.
9. **Constitution-safe** — Master Admin may inspect commercial SKUs (Property Manager, Facility Operations, Complete Platform) and Enterprise sales cases; it must not invent SaaS tiers or present Enterprise as a product/pricing tier.
10. **Gate-bound** — No code until this blueprint is approved; material scope changes restart Design → Document → Approve.

---

## Package contents

| Document | Purpose |
|----------|---------|
| [Information Architecture](./information-architecture.md) | Navigation, Overview, and every primary surface |
| [Organization Detail](./organization-detail.md) | Authoritative org diagnostic model |
| [Permissions & Mutations](./permissions-and-mutations.md) | Permissions matrix + mutation matrix |
| [Data, API & Database](./data-api-database.md) | Existing sources, API requirements, DB requirements |
| [Security & Observability](./security-observability.md) | Security model + observability integration |
| [Implementation Slices](./implementation-slices.md) | Slices, acceptance criteria, test strategy, open questions |
| [MA-1 Implementation Notes](./ma1-implementation-notes.md) | Overview + Critical Errors delivery notes |
| [MA-2 Implementation Notes](./ma2-implementation-notes.md) | Organization Detail diagnostic delivery notes |
| [MA-3 Implementation Notes](./ma3-implementation-notes.md) | Users, Memberships & Audit Log delivery notes |
| [MA-4 Implementation Notes](./ma4-implementation-notes.md) | Subscriptions, Entitlements & Capacity delivery notes |
| [MA-5 Implementation Notes](./ma5-implementation-notes.md) | Checkout, Provisioning & Webhook Health delivery notes |
| [MA-6 Implementation Notes](./ma6-implementation-notes.md) | Platform Operations delivery notes |
| [MA-7 Implementation Notes](./ma7-implementation-notes.md) | RBAC + controlled lifecycle mutations |

---

## Out of scope (this documentation turn)

- Application / UI / API code
- Database migrations or schema edits
- Stripe Price / product / webhook endpoint changes
- Vercel env or Production deploy
- New logging/error subsystems
- New commercial products or pricing tiers

---

## Approval checklist (Product Owner)

- [ ] Blueprint purpose and principles accepted
- [ ] Information architecture accepted
- [ ] Organization Detail diagnostic model accepted
- [ ] Permissions matrix accepted
- [ ] Mutation matrix accepted (including which actions are deferred)
- [ ] Data reuse / no-duplicate-systems inventory accepted
- [ ] Security + observability integration accepted
- [ ] Implementation slices sequencing accepted
- [ ] ADR-022 status → Accepted
- [ ] First implement slice explicitly authorized

**Until the checklist is complete: DO NOT IMPLEMENT.**
