# Phase 12 — Resident Experience & Digital Operations Foundation

**Status:** Draft — awaiting Design → Document → Approve → Implement gate  
**Initiative ID:** RX-001 (recommended; see roadmap note below)  
**Gate owner:** Product + Lead Architect

---

## Executive Summary

Phase 12 defines M.P.A.'s **Resident Experience & Digital Operations** layer — the connected ecosystem that eliminates paper workflows, centralizes resident communications, digitizes leasing, and maintains one permanent digital record per applicant/resident.

This is a **core differentiator** and spans twelve capability areas (digital file, document vault, e-sign, screening, messaging, community hub, push, offline, timeline, Operations Center, Command Center).

**Implementation is blocked until this package is approved.** Per [Implementation Gate](../00-governance/implementation-gate.md) and ADR-012, no schema, API, or UI code ships until status moves from **Draft → Approved**.

### Roadmap numbering note

The [Development Roadmap](../17-development-roadmap/index.md) currently assigns **Phase 12** to *Production Hardening & Launch Readiness*. This initiative should be scheduled as either:

- **Phase 13** (Resident Experience Foundation), pushing hardening to Phase 14, **or**
- **RX-001** cross-cutting initiative inserted after Phase 11 with explicit roadmap amendment.

Approval must include which numbering is authoritative.

### Current platform baseline (already implemented)

| Area | Status | Extend — do not duplicate |
|------|--------|---------------------------|
| Organizations, properties, units, tenants, leases | ✅ Foundation | Digital file links here |
| Maintenance work orders | ✅ Foundation | Maintenance messaging threads |
| Vendors | ✅ Foundation | PM ↔ vendor messaging |
| Financials (charges, payments, expenses) | ✅ Foundation | Payment history read-only |
| Communications / announcements | ✅ Phase 9 (MHF-001 partial) | Community hub extends this |
| AI Operations | ✅ Phase 11 | Screening summary, doc analysis hooks |
| Operations Center / Command Center | ✅ Shell + widgets | New resident ops widgets |
| Resident portal shell | ✅ Route group | Primary resident UX surface |
| QR enrollment | ✅ Phase 9 | Applicant/resident onboarding |

### Explicitly out of scope (this phase)

- Payment gateway integration (INT-1xx)
- Accounting system sync (INT-804)
- AI autonomous decisions (MHF-004)
- Redesign of existing PM modules
- Duplicate announcement or document systems

---

## Documents in this package

| Doc | Purpose |
|-----|---------|
| [01 — Requirements Traceability](./01-requirements-traceability.md) | PRR IDs, user requirements → capability mapping |
| [02 — Architecture & Integration](./02-architecture-and-integration.md) | Schema domains, events, RLS, module integration |
| [03 — Implementation Slices](./03-implementation-slices.md) | Approved sequencing after gate (not executed yet) |
| [04 — Provider Abstractions](./04-provider-abstractions.md) | E-sign, screening, push — swappable providers |
| [05 — Definition of Done](./05-definition-of-done.md) | Verification checklist for closeout |

---

## Prerequisites before Approve → Implement

1. **DEV-004 / migration reconciliation** — local migration history aligned with remote (blocks clean `db push`)
2. **Provider decisions** — e-sign (INT-202), screening (INT-201) vendor shortlist
3. **Supabase Storage policy** — document vault bucket + RLS design sign-off
4. **Roadmap amendment** — resolve Phase 12 vs Production Hardening numbering
5. **ADR** — RX-001 architecture decision (recommended before slice 1)

---

## Approval checklist

- [ ] Product sign-off on scope and slices
- [ ] Architect sign-off on architecture doc + ADR
- [ ] Security review on document vault RLS + messaging
- [ ] PRR index updated with satisfied/deferred IDs
- [ ] Status changed to **Approved** on this README
