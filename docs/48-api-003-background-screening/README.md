# API-003 — Background Screening & Applicant Verification

**Status:** Approved · Implemented (slices 0–9)  
**Initiative ID:** API-003  
**PRR / integration:** [INT-201](../31-product-requirements/integration-roadmap.md) · [INT-203](../31-product-requirements/integration-roadmap.md)  
**Gate:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)  
**Related:** [Phase 12 RX-001 Applicant Lifecycle](../41-phase-12-resident-experience-digital-operations/RX-001-applicant-lifecycle.md) · [Provider abstractions](../41-phase-12-resident-experience-digital-operations/04-provider-abstractions.md) · [Security Standards](../14-security-standards/index.md) · [API-002A Media / Vault](../46-api-002a-universal-media-foundation/README.md) · [API-001 Notifications](../44-api-001-onesignal-notification-foundation/README.md)  
**Gate owner:** Product + Lead Architect + Security (+ Compliance counsel for FCRA/adverse action)  
**Recommended first provider:** Checkr  
**Alternatives:** TransUnion SmartMove · RentPrep · Equifax  
**Architectural decisions (Approve):** Q1 Checkr first · Q2 electronic consent required · Q3 structured SoR + vault PDFs · Q4 human decision only · Q5 least-privilege PII · Q6 configurable retention 

---

## Executive Summary

M.P.A. already has an **applicant lifecycle foundation** (RX-001) and a **noop `ScreeningProvider` stub**. What it does **not** have is a complete, compliance-aware background screening platform: consent, FCRA adverse action, multi-report packages, provider-swappable orchestration, retention, or PM review UX that connects screening → lease → e-sign → resident activation.

**API-003 designs that complete platform.**

This is **not** “wire Checkr and store a PDF.” It is the applicant verification workflow that sits inside the leasing lifecycle:

```
Applicant → Application submitted → Consent → Identity →
Credit / Criminal / Eviction / Sex offender → (Income future) →
PM review → Approve / Reject / Conditional → Lease → E-sign → Resident
```

**Invariant:** Business modules talk only to `ScreeningService`. `ScreeningService` talks only to `ScreeningProvider`. Concrete adapters (`CheckrProvider`, future `SmartMoveProvider`, `RentPrepProvider`, `EquifaxProvider`) never leak into applicant, lease, Operations Center, or Command Center code.

### What this package defines

| Area | Outcome |
|------|---------|
| Screening workflow | End-to-end states, packages, multi-party applicants |
| Provider abstraction | Swappable vendors; Checkr first |
| Applicant experience | Consent, authorization, progress, notifications |
| PM review | Decisioning, adverse action, conditional approval |
| Security & compliance | FCRA posture, PII, audit, least privilege |
| Data retention | Report expiration, purge, vault references |
| Ops / Command Center | Widgets + searchable index |
| Future AI | Assistive report summary only — never auto-decide |

### Explicitly out of scope (this documentation task)

- Application code, migrations, Edge Functions, SDK commits
- Choosing final commercial terms with Checkr (Approve may lock vendor)
- Implementing AI summarization
- Income verification product (designed as future slice)
- Automatic approval rules engine (future)
- Provider failover mesh (future)

---

## Problem analysis

| Observed | Interpretation |
|----------|----------------|
| `ScreeningProvider` noop + thin `screening_cases` | Stub only — not a leasing-grade workflow |
| INT-201 lists TransUnion / Checkr without package design | Need one authoritative design before implement |
| Fair housing / FCRA risk if PMs improvise email decisions | Adverse action must be first-class |
| Screening PDFs can become orphaned | Results must bind to applicant → lease → resident |
| Vendor lock-in risk | Abstraction mandatory from day one |

---

## Architecture overview

```
Applicant / PM UI / Ops Center / Command Center / Timeline
  → ScreeningService (domain — only public write path)
      → authz + consent gates + audit + notifications
        → ScreeningProvider (interface)
          → CheckrProvider | SmartMoveProvider | RentPrepProvider | EquifaxProvider
            → Provider APIs + signed webhooks
              → Edge Function ingress (idempotent)
                → ScreeningService.applyProviderEvent(...)
```

**Data plane (conceptual):** screening cases, party roles, consent records, report artifacts (vault/media refs), decisions, adverse-action packets, audit events — all org-isolated via RLS.

---

## Documents in this package

| Doc | Purpose |
|-----|---------|
| [01 — Requirements](./01-requirements.md) | Goals, surfaces, acceptance |
| [02 — Screening Workflow](./02-screening-workflow.md) | Lifecycle, states, parties, decisions |
| [03 — Provider Abstraction](./03-provider-abstraction.md) | `ScreeningService` / `ScreeningProvider` / Checkr |
| [04 — Applicant Experience](./04-applicant-experience.md) | Consent, progress, notifications |
| [05 — Property Manager Review](./05-property-manager-review.md) | Review UI, adverse action, rules |
| [06 — Security and Compliance](./06-security-and-compliance.md) | FCRA, PII, permissions, audit |
| [07 — Data Retention](./07-data-retention.md) | Expiration, purge, vault |
| [08 — Provider Comparison](./08-provider-comparison.md) | Checkr vs alternatives |
| [09 — Implementation Slices](./09-implementation-slices.md) | Deployable slices after Approve |
| [10 — Definition of Done](./10-definition-of-done.md) | Gate + implementation DoD |
| [11 — Risk Analysis](./11-risk-analysis.md) | Risks, mitigations, open questions |

---

## Recommended rollout

1. **Approve** this package (Product + Architect + Security + Compliance).
2. Lock first provider (**Checkr recommended**) and package SKUs in Approve notes.
3. Implement slices 0–3: domain model, consent, Checkr adapter, webhook ingress.
4. Ship PM review + adverse action before enabling production screening fees.
5. Connect lease generation / e-sign handoff; then Ops/Command widgets.
6. Later: income verification, auto-rules (assistive only), failover, AI summary (API-003B).

---

## Approval checklist

- [x] Product sign-off on workflow, decision outcomes, applicant UX
- [x] Architect sign-off on ScreeningService / provider boundary
- [x] Security + Compliance sign-off on FCRA/adverse action/retention
- [x] Status on this README changed to **Approved**
- [x] Implementation authorized for approved slices in [09](./09-implementation-slices.md)
- [x] Q1–Q6 decisions recorded (Checkr · consent · structured SoR · human decision · least privilege · configurable retention)

---

## Gate status

| Stage | State |
|-------|--------|
| Design | **Complete** |
| Document | **Complete** |
| Approve | **Complete** |
| Implement | **Complete (slices 0–9)** — income / auto-rules / failover / AI deferred |

**Design ✔ · Document ✔ · Approve ✔ · Implement ✔**

Live paths: `apps/web/src/lib/screening/` · `apps/web/src/lib/integrations/screening/` · migration `20260717180000_api003_background_screening_foundation.sql`
