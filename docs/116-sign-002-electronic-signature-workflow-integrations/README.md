# SIGN-002 — Electronic Signature Workflow Integrations

**Status:** Approved  
**Slice A:** Authorized — Implemented (pending review before Slice B)  
**Initiative ID:** SIGN-002  
**Type:** Workflow integration design (extends API-004; does not replace it)  
**Gate:** Design → Document → Approve → Implement  
**Policy:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)  
**Date:** 2026-07-27  
**Approved:** 2026-07-27  
**Gate owners:** Product + Lead Architect + Security (+ Legal counsel for ESIGN/UETA template posture)  
**Depends on:** [API-004](../50-api-004-electronic-signatures/README.md) · [ADR-030 SignWell](../18-decision-log/adr-030-signwell-as-primary-esign-provider.md) · [API-001](../44-api-001-onesignal-notification-foundation/README.md) · [API-002A](../46-api-002a-universal-media-foundation/README.md) · [FAC-002](../114-fac-002-facility-operations-v1/README.md) · [OWNER-001](../104-owner-001-commercial-owner-portal/README.md) · Lease foundation · Vendor-001  

---

## Executive summary

API-004 delivered the **signature platform**: `SignatureService` → `SignatureProvider` → `SignWellProvider`, plus vault, audit, notifications, and the lease package path. SIGN-002 designs **which business workflows** must (or may) use that platform in Version 1.0 — and how each workflow binds packages to originating records without inventing a second e-sign product.

**Invariant:** Business modules call only `SignatureService`. Users never see SignWell branding or provider jargon. Signatures are required only when they create legal, contractual, regulatory, or accountability value.

### What this package is

| In scope | Out of scope |
|----------|--------------|
| Workflow triggers, parties, order, status sync | New signature infrastructure or providers |
| UX lifecycle terminology across modules | Parallel “signature center” that duplicates module UIs |
| Permissions / notifications / audit / reporting matrices | Wet-ink, notary, witness-required ceremonies |
| Implementation roadmap (Slices A–D) | Changing SignWell adapter internals |
| Explicit V1.0 deferrals | AI signing or auto-impersonation |

### Slices (Approve → Implement)

| Slice | Scope | V1.0 | Status |
|-------|-------|------|--------|
| **A** | Property Ops: lease, renewal, owner agreement, move-in/out acknowledgements | Required | **Authorized + implemented** — review before B |
| **B** | Facility Ops: vendor/contractor agreements, work authorization, inspection sign-off | Required | Not started |
| **C** | Core: employee/policy acknowledgements, general org documents, custom requests | Required | Not started |
| **D** | Hardening: reporting widgets, compliance summaries, turnaround metrics, QA | Required after A–C | Not started |

---

## Documents in this package

| Doc | Purpose |
|-----|---------|
| [00 — Executive summary](./00-executive-summary.md) | Problem, outcomes, gate |
| [01 — Relationship to API-004](./01-relationship-to-api-004.md) | Extension rules; reuse inventory |
| [02 — Design principles](./02-design-principles.md) | When to require a signature |
| [03 — Cross-platform UX](./03-cross-platform-ux.md) | Shared document lifecycle language |
| [04 — Slice A Property Ops](./04-slice-a-property-operations.md) | Lease, renewal, owner, move-in/out |
| [05 — Slice B Facility Ops](./05-slice-b-facility-operations.md) | Vendor, contractor, WO auth, inspections |
| [06 — Slice C Core Platform](./06-slice-c-core-platform.md) | Employee, policy, general, custom |
| [07 — Workflow integration matrix](./07-workflow-integration-matrix.md) | One-page SoT matrix |
| [08 — Permission matrix](./08-permission-matrix.md) | Reuse vs net-new |
| [09 — Notification matrix](./09-notification-matrix.md) | Events per workflow |
| [10 — Audit event matrix](./10-audit-event-matrix.md) | Audit events + entity links |
| [11 — Reporting matrix](./11-reporting-matrix.md) | Reports via existing framework |
| [12 — Implementation roadmap](./12-implementation-roadmap.md) | Slices A–D |
| [13 — Acceptance checklist](./13-acceptance-checklist.md) | V1.0 DoD |
| [14 — Deferred beyond V1.0](./14-deferred-beyond-v1.md) | Intentional exclusions |
| [15 — Approval checklist](./15-approval-checklist.md) | Gate sign-off |
| [16 — Slice A implementation notes](./16-slice-a-implementation-notes.md) | Delivered scope + remaining before B |

---

## Gate status

**Design ✔ · Document ✔ · Approve ✔ · Implement (Slice A) ✔**

Slice B must not begin until Slice A is reviewed and Slice B is explicitly authorized.
