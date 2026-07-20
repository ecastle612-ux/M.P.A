# 01 — Requirements

**Package:** API-003  
**Status:** Approved · Implemented (Phase 1)

---

## Problem statement

Applicant screening is a regulated, multi-party, multi-vendor process. M.P.A. must own the **workflow and compliance UX** while providers own specialized data sources (credit, criminal, eviction, identity). Without a platform design, teams will hard-code Checkr (or another vendor) into applicant screens and create irreversible lock-in plus FCRA gaps.

---

## Goals

| # | Goal |
|---|------|
| G1 | Complete screening lifecycle from application → decision → lease handoff |
| G2 | Provider-swappable architecture (`ScreeningProvider`) with Checkr first |
| G3 | Explicit electronic consent / FCRA authorization before any consumer report |
| G4 | PM review with Approve / Reject / Conditional + adverse action support |
| G5 | Multi-party applications (primary, co-applicant, guarantor, adult occupant) |
| G6 | Secure storage, org isolation, audit trail, retention/expiration |
| G7 | Operations Center + Command Center + Timeline visibility |
| G8 | Notifications for consent, progress, completion, failures |
| G9 | Extensible to income verification, auto-rules, AI assist (never auto-decide) |

---

## Non-goals

- Implementing providers or schema in this documentation task
- Replacing legal counsel for FCRA/adverse action templates (M.P.A. supplies workflow + configurable copy hooks)
- Guaranteeing identical report fields across all vendors (normalize to M.P.A. summary model)
- Automatic approve/reject without human confirmation
- Building a proprietary credit bureau
- Payment of screening fees via every possible gateway in v1 (design fee-state; Stripe path via existing financial patterns later)

---

## Traceability

| Source | Coverage |
|--------|----------|
| INT-201 | Tenant screening provider |
| INT-203 | Credit report storage (metadata / vault refs) |
| MHF-002 / MHF-013 | PM queues; auditability |
| Phase 12 RX-001 | Applicant foundation, stub provider |
| Phase 12 `ScreeningProvider` sketch | Superseded/extended by this package |
| docs/14 Security | Screening results class |
| API-002A | Report PDF / ID images as media/vault assets |
| API-001 | Screening notification events |

---

## Design surfaces (must be documented)

| Surface | Requirement |
|---------|-------------|
| Applicant consent | Electronic authorization before screening |
| FCRA compliance | Disclosure, authorization, adverse action path |
| Identity verification | Provider ID check stage |
| Credit / criminal / eviction / sex offender | Package components |
| Income verification | Future stage — designed, not Phase 1 ship |
| Manual review | Default decision path |
| Automatic approval rules | Future — assistive thresholds only |
| Conditional approval | Conditions captured + tracked |
| Adverse action | Notice workflow + audit |
| Re-screening | New case linked to prior; not silent overwrite |
| Report expiration | Status + access policy |
| Audit trail | Every state change + who/when |
| Provider retry | Transient failures; idempotent |
| Provider failover | Future |
| Multiple applicants / guarantors / co-signers / adult occupants | Party model |
| Application status + progress | Applicant + PM visibility |
| Notifications | Consent, status, complete, fail |
| Timeline | Universal timeline events |
| Operations Center | Widgets listed in README |
| Command Center | Indexables listed in README |
| Resident record | Screening outcome summary on conversion |
| Document vault | Signed consent + report artifacts |

---

## Functional requirements

### Platform

| ID | Requirement |
|----|-------------|
| R-SCR-01 | `ScreeningService` is the only domain entry for create/advance/decide |
| R-SCR-02 | No business module imports provider SDKs |
| R-SCR-03 | Org-level provider selection with env default (`SCREENING_PROVIDER`) |
| R-SCR-04 | Webhooks ingress via Edge Function → verify signature → idempotent apply |
| R-SCR-05 | Noop provider remains for local/CI |

### Lifecycle

| ID | Requirement |
|----|-------------|
| R-SCR-10 | Case progresses through documented states (see [02](./02-screening-workflow.md)) |
| R-SCR-11 | Consent recorded before provider consumer-report pull |
| R-SCR-12 | Package components independently trackable (credit, criminal, eviction, SOR, ID) |
| R-SCR-13 | Decision outcomes: approve, reject, conditional |
| R-SCR-14 | Reject path supports adverse action packet |
| R-SCR-15 | Approved/conditional can hand off to lease generation |
| R-SCR-16 | Re-screen creates a new case with lineage |

### Parties

| ID | Requirement |
|----|-------------|
| R-SCR-20 | Support primary applicant + additional adult parties |
| R-SCR-21 | Guarantor / co-signer roles with distinct package rules |
| R-SCR-22 | Per-party consent and per-party reports |

### Experience & ops

| ID | Requirement |
|----|-------------|
| R-SCR-30 | Applicant portal: consent, upload ID if required, progress |
| R-SCR-31 | PM review workspace with flags and report summaries |
| R-SCR-32 | Ops Center widgets (pending, consent, flagged, failures, turnaround) |
| R-SCR-33 | Command Center providers for applicants/screenings/consent/reports |
| R-SCR-34 | Timeline events for key transitions |

### Security & retention

| ID | Requirement |
|----|-------------|
| R-SCR-40 | PII minimized in logs; full reports least-privilege |
| R-SCR-41 | Audit log for view/download/decision/consent |
| R-SCR-42 | Retention + expiration policy enforceable |
| R-SCR-43 | Org isolation via RLS |

### Future (document only)

| ID | Requirement |
|----|-------------|
| R-SCR-90 | Income verification stage reserved |
| R-SCR-91 | Auto-rules engine reserved (never silent final decision) |
| R-SCR-92 | Provider failover reserved |
| R-SCR-93 | AI report summarization assist reserved — human decision required |

---

## Acceptance (documentation gate)

- [x] Package docs 01–11 exist under `docs/48-api-003-background-screening/`
- [x] Architecture forbids direct provider SDK use from business modules
- [x] Checkr recommended; alternatives compared
- [x] FCRA/adverse action/retention designed
- [x] Ops + Command Center designed
- [x] Slices + DoD + risks documented
- [x] Explicit **Approve** on README before any implement

---

## Gate reminder

**Design ✔ · Document ✔ · Approve ✔ · Implement ✔**
