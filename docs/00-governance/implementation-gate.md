# Implementation Gate Policy

**Status:** Permanent — binding for all M.P.A. work  
**Established:** 2026-07-13

---

## The Rule

> **Nothing gets implemented until it has been designed, documented, and approved.**

This applies to architecture, visual identity, components, workflows, APIs, schema, AI capabilities, and integrations. There are no shortcuts for “small” work that will become permanent platform surface.

---

## The Sequence (Mandatory)

```
Design  →  Document  →  Approve  →  Implement
```

| Stage | Meaning | Done when |
|-------|---------|-----------|
| **Design** | Intentional product/UX/technical design exists | Problem, approach, and constraints are clear |
| **Document** | Written in the MPA Blueprint (or ADR) | Another senior engineer can execute without tribal knowledge |
| **Approve** | Explicit stakeholder / gate-owner sign-off | Status moves from Draft/Proposed → Approved/Accepted |
| **Implement** | Code, migrations, UI, infrastructure | Only against approved docs; PRs cite them; [PRR checklist](../31-product-requirements/implementation-checklist.md) passed |

### Product Requirements Registry (before Implement)

Before entering **Implement**, verify alignment with the [Product Requirements Registry](../31-product-requirements/index.md):

1. Complete the [Implementation Checklist](../31-product-requirements/implementation-checklist.md).
2. List satisfied and deferred PRR IDs (MHF, FEH, INT, AUT, AI, MOB) in phase or PR notes.
3. If proposed work violates a **CRITICAL** must-have (MHF-001–005), stop and recommend an alternative — do not write code.

**Forbidden:** Code-first exploration that becomes the de facto design. Spikes must be disposable and labeled; they do not ship without going through this sequence.

---

## What Counts as “Designed”

Depending on the work:

| Work type | Minimum design artifact |
|-----------|-------------------------|
| Visual / UI | Canopy tokens + component/pattern philosophy (06) |
| Product feature | Six-goal filter + workflow mapping (05) + UX approach |
| Architecture | ADR + relevant 08–16 standards updates |
| Schema | Database design note + RLS plan (09/14) |
| API / Edge Function | Contract + auth plane (10/14) |
| AI capability | Fit to 13 AI Strategy + suggestion/feedback model |

---

## What Counts as “Documented”

- Blueprint path under `docs/` **or** Decision Log ADR
- Linked from the relevant index
- Version/status visible (`Draft` → `Approved`)

Chat messages alone are **not** documentation.

---

## What Counts as “Approved”

| Gate | Owner | Evidence |
|------|-------|----------|
| Architecture | Lead Architect | ADR Accepted; architecture improvements cleared |
| Design language (Canopy) | Lead Architect / UX | Phase 1.5 checklist signed |
| Feature / workflow slice | Product + Architect | Evaluation template Pass + roadmap slot |
| Schema / security-sensitive | Architect + Security review | ADR or migration design approved |

Silence is not approval. “Looks good” in chat should be recorded as status change on the document or ADR.

---

## Implementation Rules After Approval

1. Implement **only** what was approved — scope creep returns to Design.
2. PRs must reference the approving doc/ADR.
3. Material deviation from approved design requires a new Design → Document → Approve cycle (or superseding ADR).
4. Bug fixes that do not change product/architecture behavior may proceed without a new design doc; if a fix implies a new pattern, document it.
5. Phase or feature closeout requires [Definition of Done](./definition-of-done.md) evidence before marking complete.

---

## Current Gates (Do Not Skip)

| Item | Status |
|------|--------|
| Software architecture | Approved (per Phase 1) |
| Canopy design language (Phase 1.5) | Approved (v1.0) |
| Experience architecture (Phase 1.6) | Approved (v1.0) |
| Foundation scaffold | Completed (Phase 2) |
| Foundation hardening | Completed (Phase 2.1) |
| Phase 3 identity foundation | Completed (approved and implemented) |
| Phase 4 core property foundation design package | ✅ **COMPLETE** — Approved and implemented |
| Phase 4 implementation | ✅ **COMPLETE** (historical foundation) |
| Phase 5 Tenant & Lease Foundation design package | ✅ **COMPLETE** — Approved (docs/25 + ADR-016) and implemented |
| Phase 5 implementation | ✅ **COMPLETE** (historical foundation) |
| DPX-001 Design Partner Experience (Phase 6) | **Approved** — operator experience philosophy; Amendments A–G + roadmap rule bind future product work ([92](../92-dpx-001-design-partner-experience/README.md)) |
| DPX-002 Complete Daily Workflow | **PASS** — gold-standard reference path; Amendments A–G; freeze binds successors ([93](../93-dpx-002-complete-daily-workflow/README.md)) |
| DPX-003 Commercial Product Experience | **Approved** — cognitive load, empty states, tenant IA, push, theme, consistency, mobile, AI polish; no new modules ([96](../96-dpx-003-commercial-product-experience/README.md)) |
| PUSH-001 PWA Push Commercial Certification | **Approved** · Implement unlocked · Blocker 5 **ACTIVE** · commercial PASS pending real-device evidence · [Blocker-5-Readiness](../103-core-002-commercial-launch-blocker-execution/Blocker-5-Readiness.md) ([99](../99-push-001-pwa-push-commercial-certification/README.md)) |
| ADMIN-001 Master Admin Impersonation | **Approved** — Portal Test Mode + Impersonation Center + audit ([71](../71-admin-001-master-admin-impersonation/README.md)) |
| ADMIN-002 Master Admin Role Switcher | 📝 **Draft — Awaiting Approval** · Implement **locked** ([94](../94-admin-002-master-admin-role-switcher/README.md) · [02-approval](../94-admin-002-master-admin-role-switcher/02-approval.md) unsigned) |
| ADMIN-003 Master Admin Operations Center | **Approved** — Mission Control HQ; **Slice A unlocked** ([95](../95-admin-003-master-admin-operations-center/README.md)) |
| CORE-002 Commercial Launch Blocker Execution | **Approved** — Blockers 1–4 ✅ **CLOSED (PASS)**; Blocker 4 closeout [Blocker-4-Closeout](../103-core-002-commercial-launch-blocker-execution/Blocker-4-Closeout.md); **Current focus: Blocker 5** (PUSH-001); Commercial Launch not authorized |
| OWNER-001 Commercial Owner Portal MVP | ✅ **COMPLETE** · ✅ **CERTIFIED PASS** · Blocker 3 ✅ **CLOSED**; no Stripe/FIN-003 ([104](../104-owner-001-commercial-owner-portal/README.md) · [28](../104-owner-001-commercial-owner-portal/28-owner-001-certification.md)) |
| FIN-003 Owner Payouts (Stripe Connect) | ✅ **APPROVED** · Package ✅ **CERTIFIED PASS** ([57](../98-fin-003-owner-payout-stripe-connect/57-fin003-package-certification.md)) · Blocker 4 ✅ **CLOSED** · Commercial Launch not authorized · live transfers ops-gated |
| UX-010 Unified Image Acquisition | 📝 **Draft — Awaiting Approval** · Implement **locked** ([105](../105-ux-010-unified-image-acquisition/README.md) · [08](../105-ux-010-unified-image-acquisition/08-approval-checklist.md)) |
| PAY-001 Settlement Funding Foundation | ✅ **Verified** (2026-07-23) — A1–A21 PASS · predecessor to FIN-003 Phase C (CERTIFIED PASS) · Q3b/Q4 before production destination enable ([32](../108-pay-001-settlement-funding-foundation/32-package-certification.md)) |

---

## Enforcement

- Agents and engineers **must refuse** to write application/UI code for unapproved work.
- Documentation-only updates are always allowed.
- If asked to “just build it,” respond with the missing Design / Document / Approve step.

---

## Related

- [Project Roadmap Status (Governance Audit)](./project-roadmap-status.md) — active package matrix · commercial spine · next effort
- [Governance Audit Closeout](./governance-audit-closeout.md) — G-1–G-5 resolution record
- [Commercial Launch Master Plan](./commercial-launch-master-plan.md) — consolidated remaining roadmap · launch checklist · risks
- [Development Freeze Checkpoint](./development-freeze-checkpoint.md) — Blocker 4 CLOSED · focus Blocker 5 (PUSH-001)
- [Product Requirements Registry](../31-product-requirements/index.md)
- [Implementation Checklist](../31-product-requirements/implementation-checklist.md)
- [Definition of Done](./definition-of-done.md)
- [Product Principles](../product-principles/index.md)
- [06 Design Language](../06-design-language/index.md)
- [18 Decision Log](../18-decision-log/index.md)
- [DPX-001 Design Partner Experience](../92-dpx-001-design-partner-experience/README.md) — operator experience over feature count; replace-friction + roadmap filters
- ADR-012 — Design → Document → Approve → Implement
