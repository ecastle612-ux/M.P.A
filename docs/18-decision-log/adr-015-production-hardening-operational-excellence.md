# ADR-015: Production Hardening & Operational Excellence Program (EP-008 / PR-003)

## Status

Proposed

> **Not approved. No implementation may begin until this ADR is `Accepted` and the
> associated design package is `Approved`, per the [Implementation Gate](../00-governance/implementation-gate.md)
> and [ADR-012](./adr-012-design-document-approve-implement.md).**

## Date

2026-07-19

## Context

A Design Partner readiness sprint (EP-008 / PR-003) requests platform-wide production
hardening: centralized error monitoring, rate limiting, background-job reliability,
webhook reliability, expanded audit logging, backup/recovery readiness, a security
review, a production health dashboard, and deployment readiness.

Two facts shape how this must be approached:

1. **The Implementation Gate is binding.** These are new, cross-cutting *patterns*
   (not bug fixes), so they require `Design → Document → Approve → Implement`. Nothing
   may be coded before approval.
2. **Sequencing.** The [Development Roadmap](../17-development-roadmap/index.md) places
   Production Hardening at **Phase 10 (commercial launch readiness)**. The platform is
   currently at **Phase 3 — Identity & Multi-Tenant Foundation** ([ADR-014](./adr-014-phase-3-identity-multitenant-foundation.md)).
   Most subsystems the sprint names — Accounting, Facility/Asset Foundation,
   ReportingService, Timeline, Operations/Command Center, Master Admin, and the
   Stripe / OneSignal / Dropbox Sign / Resend integrations, plus PDF generation, bulk
   unit creation, and document processing — **do not exist in the codebase yet**. There
   is no surface to harden for those items.

The Phase 2.1 review already defined the *architecture contracts* this program builds
on: [Observability Placeholders](../22-phase-2-scaffold-review/observability-placeholders.md)
(logging, error monitoring, audit-log field set, rollout sequence) and
[Security Hardening Notes](../22-phase-2-scaffold-review/security-hardening-notes.md)
(headers/CSP, cookie/session strategy, remaining gaps). EP-008 is, in effect, the
*implementation* of those placeholders plus the Phase 10 production track.

## Decision

Adopt a **Production Hardening & Operational Excellence program** as a **phased,
cross-cutting track** rather than a single big-bang sprint, with this shape:

1. **Promote existing contracts to shared implementations.** Turn the Phase 2.1
   observability placeholders (logging / error monitoring / audit interfaces) into a
   shared, typed, fail-open implementation with no-op dev adapters and provider adapters
   in staging — exactly as the placeholder rollout sequence specifies.
2. **Define platform-wide resilience patterns once** (error taxonomy + context envelope,
   rate-limit policy, idempotent job/webhook execution, append-only audit store, health
   probe contract, security baseline, backup/recovery + deployment runbooks).
3. **Apply each pattern to a subsystem only when that subsystem exists.** Hardening for
   Accounting, Reporting, Facility, providers, jobs, etc. attaches to those modules as
   they are delivered on the roadmap. Scope items whose target does not yet exist are
   **design-only** and **deferred** until the module lands.
4. **Preserve existing architecture and workflows.** No redesign; no workflow
   regressions; the do-not-modify list in the design package is binding.

The full design (per-area problem, approach, data/interfaces, dependencies, and
ready-vs-deferred status) is documented in
[24 Production Hardening](../24-production-hardening/index.md).

Any schema needed for audit support is **design-only** here and requires a separate
database design note + RLS plan approval per the Implementation Gate and the
[Database Architecture](../09-database-architecture/index.md) / [Security Standards](../14-security-standards/index.md).

## Consequences

**Easier:** One consistent set of resilience/observability patterns; hardening lands
with each module instead of being retrofitted; readiness improves predictably and
measurably; reviews cite approved design.

**More difficult:** Requires gate discipline when urgency is high; the program spans
multiple roadmap phases rather than a single sprint; readiness scores cannot be reported
as "done" until scoped increments are actually approved and implemented.

## Alternatives Considered

- **Big-bang production-hardening sprint now (as literally requested):** Rejected — it
  targets modules that do not exist, violates roadmap sequencing (Phase 10 vs current
  Phase 3), and would require code-first exploration forbidden by ADR-012.
- **Skip the gate "because it's only hardening":** Rejected — these are new permanent
  platform patterns and security/schema-sensitive surfaces, explicitly in scope of the
  gate. Enforcement requires refusal to implement unapproved work.
- **Do nothing until Phase 10:** Rejected — the observability/security *contracts* and
  cross-cutting patterns can and should be designed and approved now so each future
  module ships already-hardened, avoiding retrofit cost.
