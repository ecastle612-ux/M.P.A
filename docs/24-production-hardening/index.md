# 24 — Production Hardening & Operational Excellence (EP-008 / PR-003)

**Status:** Approved (2026-07-19)
**Gate:** Phase 1 implementation authorized (Design-ready-now slices only)
**Related ADR:** [ADR-015](../18-decision-log/adr-015-production-hardening-operational-excellence.md) (Accepted)

> **Approved.** ADR-015 is Accepted and Phase 1 scope is authorized for implementation:
> §4.1 error monitoring, §4.2 rate limiting (auth), §4.5 audit events (auth), §4.6/§4.9
> runbooks, and §4.7 security hardening. All items marked **Deferred** remain blocked by
> the [Implementation Gate](../00-governance/implementation-gate.md) until their target
> module exists and passes its own `Design → Document → Approve` cycle. This remains a
> **phased program**, not a single implementation.
>
> **Delivered artifacts (Phase 1):**
> [Security Review Findings](./security-review-findings.md) ·
> [Backup & Recovery Runbook](./backup-recovery-runbook.md) ·
> [Deployment Readiness Runbook](./deployment-readiness-runbook.md) ·
> [Production Readiness Assessment](./production-readiness-assessment.md)

---

## 1. Purpose & Relationship to the Request

EP-008 / PR-003 asks to strengthen M.P.A.'s production reliability, security,
observability, and operational resilience for Design Partner usage — **without**
feature work, UI redesign, or workflow regressions.

This package translates that request into a design that respects two hard constraints:

- **The gate:** every item below is a new cross-cutting *pattern* (not a bug fix) and
  therefore must be designed → documented → approved → implemented.
- **Sequencing:** production hardening is roadmap **Phase 10**; the platform is at
  **Phase 3 — Identity Foundation**. Items whose target subsystem does not yet exist are
  marked **Deferred** and cannot be implemented now regardless of approval.

This program **builds on** the Phase 2.1 contracts already documented:
[Observability Placeholders](../22-phase-2-scaffold-review/observability-placeholders.md)
and [Security Hardening Notes](../22-phase-2-scaffold-review/security-hardening-notes.md).

---

## 2. Current-Platform Reality (what exists today)

| Exists now (hardenable) | Does **not** exist yet (hardening is Deferred) |
|---|---|
| Auth (email/password, reset, session, guards) | Accounting, ReportingService, Financial report generation |
| Organization / membership / invitations | Facility Foundation, Asset Foundation, facility corrections |
| Multi-role authorization + RLS-ready policy model | Timeline, Operations Center, Command Center, Master Admin |
| Four portal shells (no business pages) | Stripe, OneSignal, Dropbox Sign, Resend integrations |
| Next.js app, middleware, API routes (auth/org/profile) | Background jobs / queues, PDF generation, document processing |
| Observability/audit **interfaces** (placeholders only) | Notification delivery, bulk unit creation, uploads at scale |

**Implication:** roughly half of EP-008's named targets are Deferred. The design still
defines their patterns now so each module ships already-hardened.

---

## 3. Preservation Constraints (binding)

Do **not** modify, redesign, or regress: Accounting, Facility Foundation, Asset
Foundation, ReportingService, Timeline, Operations Center, Command Center, Master Admin,
the database schema (except an approved audit-support addition — see §4.5), existing
APIs, and existing workflows. This program is additive and cross-cutting only.

---

## 4. Design by Requirement Area

Each area lists: **Problem → Proposed approach → Data/interfaces → Dependencies →
Status** (Design-ready now vs Deferred). "Design-ready now" means it *may* be implemented
*after approval*; "Deferred" means it also waits on a not-yet-built module.

### 4.1 Centralized Error Monitoring

- **Problem:** No unified capture of unhandled exceptions, server/API/Edge Function/
  provider/browser errors.
- **Approach:** Implement the Phase 2.1 `captureException(error, metadata)` contract as a
  shared, **fail-open, non-blocking** adapter (no-op in dev, provider in staging/prod).
  Standard error envelope: `timestamp, organization_id, actor_id, module, request_id,
  environment, severity`. PII scrubbing (email/phone/payment refs) mandatory.
- **Interfaces:** extends `apps/web/src/lib/observability/*` and the documented
  observability placeholder contracts.
- **Dependencies:** provider selection (ADR needed — e.g. Sentry per Phase 10 roadmap).
- **Status:** ✅ **Phase 1 implemented** — shared error envelope (`timestamp,
  organization, user, module, request_id, environment, severity`), PII redaction,
  request-id propagation, global + browser-runtime capture, and API-route capture, all
  fail-open. Provider adapter (e.g. Sentry) still requires an ADR; module-specific capture
  is Deferred with each module.

### 4.2 Rate Limiting

- **Problem:** Public + authenticated endpoints lack abuse protection.
- **Approach:** Central rate-limit policy layer at the API/Edge boundary
  ([10 API Standards](../10-api-standards/index.md), [ADR-007](../18-decision-log/adr-007-edge-functions-own-mutations.md)):
  keyed by IP + actor + org + route class; standard `429` + `Retry-After`; configurable
  quotas per route class.
- **Applies now:** login/auth routes (brute-force), invitation/org endpoints.
- **Dependencies:** shared limiter store (e.g. Postgres/Upstash — ADR needed).
- **Status:** ✅ **Phase 1 implemented** — shared fixed-window limiter applied to
  app-owned auth endpoints (`/api/auth/session`, `/api/auth/logout`, `/api/auth/events`)
  with `429` + `Retry-After`; login-attempt outcomes reported to a rate-limited,
  audited endpoint (brute-force signal). Announcements, uploads, report generation, and
  notification abuse → **Deferred** (modules absent). Shared/distributed limiter store
  remains a documented follow-up (ADR).

### 4.3 Background Job Reliability

- **Problem:** Long-running ops must complete, retry safely, report failure, and never
  double-execute.
- **Approach:** Define an idempotent job contract (idempotency key, at-least-once with
  dedupe, bounded retries + backoff, dead-letter + failure reporting into §4.1), aligned
  with [ADR-005 Domain Events](../18-decision-log/adr-005-domain-events.md) and
  [ADR-007](../18-decision-log/adr-007-edge-functions-own-mutations.md).
- **Dependencies:** a job/queue mechanism (ADR needed).
- **Status:** **Deferred** — PDF generation, bulk unit creation, document processing,
  notification delivery do not exist yet. Pattern defined now; applied per module.

### 4.4 Webhook Reliability

- **Problem:** Provider webhooks need idempotency, logging, retry handling, duplicate
  protection, and status visibility.
- **Approach:** Shared inbound-webhook handler pattern: signature verification →
  idempotency key (provider event id) → append receipt log → dedupe → process →
  status record. One pattern reused across Stripe / OneSignal / Dropbox Sign / Resend /
  future providers.
- **Dependencies:** none of these providers are integrated yet.
- **Status:** **Deferred** (design-only). Reused as each provider lands.

### 4.5 Audit Logging (expansion)

- **Problem:** Compliance-grade, immutable record of sensitive actions.
- **Approach:** Implement the Phase 2.1 audit contract — append-only store with
  `audit_id, timestamp, actor_id, actor_role, action, resource_type, resource_id, before,
  after, request_id, ip_hash`. Capture (as targets exist): config changes, org settings,
  provider config, financial report generation, facility corrections, Master Admin
  actions, **authentication events**.
- **Schema:** requires a new append-only audit table — **design-only here**; needs a
  separate DB design note + RLS plan approval ([09](../09-database-architecture/index.md) /
  [14](../14-security-standards/index.md)). This is the one permitted schema addition and
  still must clear the gate.
- **Status:** ✅ **Phase 1 implemented (authentication events)** — append-only
  `recordAuditEvent()` foundation with the full immutable field set, fail-open, emitted
  through the observability sink. Wired for `auth.login_succeeded`, `auth.login_failed`,
  `auth.logout`, and `auth.rate_limited`. The **DB-backed append-only audit table remains
  design-only / Deferred** (needs its own DB design note + RLS approval). Note: reliable
  server-side actor attribution depends on resolving the cookie storage-key finding in
  [Security Review Findings](./security-review-findings.md).

### 4.6 Backup & Recovery Readiness

- **Problem:** No documented/verified DB backup, storage recovery, Vault protection,
  restore, environment recovery, or DR guidance.
- **Approach:** **Documentation + verification track** (runbooks), not app code:
  Supabase DB PITR/backup verification, Storage recovery procedure, Document Vault
  protection (once it exists), restore drills, environment recovery, DR guidance.
- **Status:** ✅ **Phase 1 implemented (runbook)** — see
  [Backup & Recovery Runbook](./backup-recovery-runbook.md). Document Vault portions
  **Deferred** until the module exists.

### 4.7 Security Review

- **Problem:** Close the gaps already flagged in Phase 2.1 security notes.
- **Approach:** Audit headers, cookies, session handling, permissions, role boundaries,
  sensitive routes, env-var exposure, CSP, and auth redirects. Prioritize the documented
  gaps: **strict CSP** (nonce-based; remove `'unsafe-eval'`, reduce `'unsafe-inline'`,
  add reporting endpoint), negative-path authorization tests in CI, dependency
  vulnerability scan stage. See [Security Hardening Notes](../22-phase-2-scaffold-review/security-hardening-notes.md)
  and [14 Security Standards](../14-security-standards/index.md).
- **Note (already observed):** a browser/server auth-cookie storage-key mismatch exists
  (see repo `AGENTS.md`); tightening CSP and session handling here should resolve it
  through the gate rather than ad hoc.
- **Status:** ✅ **Phase 1 implemented** — added HSTS, CSP violation reporting endpoint
  + `report-to`/`report-uri`, and a full cookie/session/headers/CSP review documented in
  [Security Review Findings](./security-review-findings.md). Enforced CSP left unchanged
  (report-only path first) to avoid Turbopack/HMR regressions; nonce-based strict CSP and
  the cookie storage-key fix are documented, gated follow-ups.

### 4.8 Production Health Dashboard

- **Problem:** Extend the existing System Health view to report subsystem status without
  exposing secrets.
- **Approach:** Define a health-probe contract (`{component, status, latency_ms,
  checked_at}`) with read-only, redacted indicators. Components: Database, Storage,
  Realtime, plus (as they exist) Notifications, Reporting, Facility, Financial, Background
  jobs, Provider connectivity. UI must follow Canopy ([06](../06-design-language/index.md))
  and Experience ([21](../21-experience-architecture/index.md)) — any new UI needs those
  gates too.
- **Status:** **Design-ready now** for Database/Storage/Realtime/Auth; other components
  **Deferred**.

### 4.9 Deployment Readiness

- **Problem:** Reproducible production deployment.
- **Approach:** **Documentation track**: env-var inventory (client vs server per
  `client-env.ts`/`server-env.ts`), domain config, Supabase redirect URLs, OneSignal
  origin (when integrated), caching, build settings, and a deployment runbook.
- **Status:** ✅ **Phase 1 implemented (runbook)** — see
  [Deployment Readiness Runbook](./deployment-readiness-runbook.md). Provider-specific
  items (OneSignal origin, etc.) **Deferred**.

---

## 5. Verification & Acceptance Mapping

The sprint's verification list (Desktop/Tablet/Mobile, production build, TypeScript
clean, ESLint clean, successful deployment) applies **per approved increment**, gated by
the standard CI ([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)) plus new
security/audit tests defined above. It cannot be satisfied "for EP-008 as a whole"
because much of EP-008 is Deferred.

---

## 6. Approval Required (before any implementation)

| Gate owner | Approves |
|---|---|
| Lead Architect | ADR-015 `Accepted`; this package `Approved`; provider/ADR choices (§4.1–4.4) |
| Security review | §4.5 audit schema + RLS, §4.7 security changes, §4.8 redaction |
| Product + Architect | Which **Design-ready now** slices enter the roadmap and when |
| UX / Canopy | Any new health-dashboard UI (§4.8) before primitives |

On approval, implement **only** the approved, Design-ready slices, each as its own
gated PR citing this doc. Deferred items are implemented when their module lands.

---

## 7. Readiness Scores

Phase 1 (Design-ready-now) slices are now implemented. Updated scores and rationale are
maintained in the [Production Readiness Assessment](./production-readiness-assessment.md).
Commercial readiness remains bounded by the unbuilt business modules on the roadmap;
scores continue to be reported per approved, implemented increment (phased program).
