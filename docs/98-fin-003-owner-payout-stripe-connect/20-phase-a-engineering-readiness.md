# 20 — Phase A Engineering Readiness

**Package:** FIN-003  
**Phase:** A — Connect foundation (onboarding & status only)  
**Document type:** Engineering readiness audit (planning / validation only)  
**Date:** 2026-07-23  
**Audited plan:** [19 — Phase A implementation plan](./19-phase-a-implementation-plan.md)  
**Scope authority:** [17 — Phase A readiness](./17-phase-a-readiness.md)  
**Architecture:** [02](./02-system-architecture.md) · [ADR-023](../18-decision-log/adr-023-stripe-connect-express-owner-payouts.md) · [ADR-024](../18-decision-log/adr-024-saas-stripe-billing-separation.md)

> **No implementation.** No schema, APIs, Stripe SDK wiring, or UI.  
> **No governance / package status / authorization changes** from this audit.  
> **Code remains LOCKED** until explicit `BEGIN FIN-003 PHASE A IMPLEMENTATION`.  
> Commercial-spine development freeze remains in effect for application work until kickoff.

---

## 1. Readiness summary

| Dimension | Verdict |
|-----------|---------|
| Plan completeness (A1–A8) | **PASS** — each task has goal, reuse, deps, acceptance |
| Architecture alignment | **PASS** — mirrors PaymentProvider / ADR-023 layering; no new patterns |
| Dependency reuse | **PASS** — builds on payments, owner portal, RBAC, audit, webhook conventions |
| Scope discipline | **PASS** — money movement / transfers / schedules excluded |
| Residual engineering gaps | **Minor** — PM surface host page slightly underspecified; doc number collision for post-implement verification |
| Application implement authorization | 🔒 **LOCKED** (kickoff phrase required) |
| **Engineering Go / No-Go** | **GO** — ready to implement when kickoff is issued |

Phase A is engineering-ready. Remaining blockers are **authorization kickoff** and **ops** (Stripe Connect enabled in target env), not plan quality.

---

## 2. Plan task validation (A1–A8)

| Task | Clear objective | Reuses architecture | Dependencies defined | Measurable acceptance | Verdict |
|------|-----------------|---------------------|----------------------|----------------------|---------|
| **A1** ConnectProvider | ✅ Port + registry + noop + Stripe adapter surface | ✅ Payments integration pattern | ✅ Kickoff + Connect platform env | ✅ No Stripe in business modules; no transfer invoke in A | **PASS** |
| **A2** Persistence | ✅ Org + owner Connect refs + status fields | ✅ Org/owner identity; Approved migration approach | ✅ A1; D5/D10/D11 | ✅ Persist/read without transfer/allocation tables; RLS reviewed | **PASS** |
| **A3** Thin OwnerPayoutService | ✅ Authz + link + eligibility map only | ✅ Owner ACL + `evaluatePermission` | ✅ A1, A2; D10/D11 | ✅ Fail-closed capability; audit on link; no transfers | **PASS** |
| **A4** API routes | ✅ Status GET + onboarding-link POST | ✅ Existing `app/api` session patterns | ✅ A3 | ✅ No schedule/run/transfer routes; session rules; DTO-only | **PASS** |
| **A5** Account webhooks (optional) | ✅ Status mirror only | ✅ Payments webhook signature / raw-body | ✅ A1, A2; ops endpoint | ✅ Reject bad sig; idempotent; no money event handlers | **PASS** |
| **A6** Owner Portal UI | ✅ Live status + CTA; honest empty pending/paid | ✅ OWNER-001 placeholders / chrome | ✅ A4 | ✅ Copy honesty; mobile; no IA redesign | **PASS** |
| **A7** PM org status | ✅ Settlement onboarding status + continue KYC | ✅ Existing PM financial/settings (host TBD at implement) | ✅ A4 | ✅ Org onboard in test; no schedule UI | **PASS*** |
| **A8** Capabilities / audit / env / docs | ✅ Grants, audit, env docs, closeout reports | ✅ Capability matrix + module audit helpers | ✅ A1–A7 (soft: grants can start earlier) | ✅ A-S1–A-S7; rent/SaaS webhooks untouched | **PASS** |

\*A7 **PASS with note:** reuse target is correct (“do not invent a second console”) but the exact PM page/route is less concrete than A6. Resolve host surface in the first authorized implement day — not a No-Go.

### Plan hygiene note (non-blocking)

[19](./19-phase-a-implementation-plan.md) A8 referenced a future `20-phase-a-verification.md`. This audit occupies **20**. At implement time, create:

- `21-phase-a-verification.md`
- `22-phase-a-completion.md` (or equivalent)

Do not renumber this readiness doc.

---

## 3. Architecture validation

| Check | Result |
|-------|--------|
| Layering `UI → OwnerPayoutService → ConnectProvider → Stripe adapter` | ✅ Matches [02](./02-system-architecture.md) / ADR-023 |
| No Stripe SDK in business modules | ✅ Enforced by A1/A3 acceptance |
| Separate from API-005 PaymentProvider | ✅ New `integrations/connect` (parallel port, not merge) |
| Separate from BILL-001 saas-billing | ✅ Explicit; ADR-024 |
| No money-movement APIs in Phase A | ✅ A4/A5 acceptance + scope table |
| Owner Portal composition only | ✅ A6 — no IA redesign |
| Rollback levers defined | ✅ Flag / capability / webhook / UI ([19] §5) |

**Conclusion:** Phase A introduces **new modules within an existing architecture**, not a new architecture.

---

## 4. Dependency audit

### Per-task reuse map

| Task | Services reused | Components / libs reused | APIs reused | RBAC reused | Audit reused | New infrastructure? |
|------|-----------------|--------------------------|-------------|-------------|--------------|---------------------|
| **A1** | None (new port) | `integrations/payments/*` pattern; registry style; `saas-billing` as **anti-pattern** (do not share) | N/A | N/A | N/A | **New module files** under `integrations/connect/` — **not** new architecture |
| **A2** | Org/owner identity data access | Existing Supabase/org models | N/A | Org isolation / RLS patterns | Audit event shape later | **New migration + tables/columns** for Connect refs/status — **required** Phase A persistence |
| **A3** | Thin new domain service | `resolveOwnerPropertyScope`; `evaluatePermission` / `resolveAuthorizationContext`; optional Notification Service | N/A | Existing authz evaluators; **new capability string** `payout:onboard` | Module `writeAudit` pattern (billing/media/signature) | New service module; capability **registration** into existing RBAC |
| **A4** | A3 | Next.js route handlers; session auth helpers used by billing/media | **New routes** (conceptual in [10](./10-api-boundaries.md)); do **not** extend payments/saas webhook APIs | Session + A3 checks | Via A3 | New route files — same API conventions |
| **A5** | ConnectProvider parse | `webhooks/payments` & `webhooks/saas` raw-body / signature conventions | **New** Connect webhook route — separate secret | N/A (Stripe → platform) | Status update audit recommended | New webhook path + secret — **required if A5 chosen**; optional for MVP if poll/refresh-on-return suffices |
| **A6** | Status loader / A4 | Owner dashboard, financials placeholders, portal chrome (`owner-portal/*`, portal components) | Consumes A4 | `financial:read` + `payout:onboard` for CTA | Indirect | Small UI components only |
| **A7** | Org status / A4 | Existing PM financial or settings surfaces | Consumes A4 | PM org onboarding grant (Approved) | Indirect | Host page selection only — **no new console** |
| **A8** | Capability/seed systems; audit helpers | `.env.example` patterns from payments | N/A | Capability matrix / role grants | Audit event catalog | Docs only + grant seeds; verification docs **21+** |

### Existing systems confirmed present (as-built)

| System | Evidence / location (illustrative) | Phase A use |
|--------|-----------------------------------|-------------|
| PaymentProvider port | `apps/web/src/lib/integrations/payments/` | Template for ConnectProvider |
| SaaS billing isolation | `integrations/saas-billing/` + `api/webhooks/saas/` | Must remain untouched |
| Rent webhooks | `api/webhooks/payments/` | Must remain untouched |
| Owner portal ACL / authz | `lib/owner-portal/*`, `lib/auth/authorization` | Scope + permission checks |
| Owner payout placeholders | `lib/owner-portal/dashboard.ts` (FIN-003 copy) | A6 replacement target |
| Webhook raw-body pattern | Multiple `api/webhooks/**/route.ts` | A5 mirror |
| Module audit helpers | e.g. `lib/billing/server.ts`, `lib/media/server.ts` | A3/A8 audit events |

### Flags — where “new” is required vs forbidden

| Item | Classification |
|------|----------------|
| `integrations/connect/*` | **Required new files** — existing pattern |
| Connect account persistence migration | **Required new schema** (post-kickoff only) — Approved Phase A |
| `payout:onboard` capability | **Required new capability string** — existing RBAC machinery |
| Connect webhook route + secret | **Optional new endpoint** — existing webhook pattern; separate rail |
| Transfer / payout / schedule infra | **Forbidden** in Phase A |
| New notification product / reporting engine / second PM console | **Forbidden** |
| Shared Customers/webhooks with BILL-001 or API-005 | **Forbidden** (ADR-024) |

---

## 5. Risk matrix

Risk scale: **L** low · **M** medium · **H** high (for Phase A scope).

| Task | Technical | Security | Regression | Primary mitigations |
|------|-----------|----------|------------|---------------------|
| **A1** | **L** — copy proven provider pattern | **M** — Stripe secret handling | **L** — isolated new package | Keep SDK only in adapter; env isolation; unit-test noop; **omit** transfer methods from Phase A interface or leave unimplemented/unused |
| **A2** | **M** — schema design for org vs owner refs | **M** — RLS / cross-org leak | **L** — additive tables | Minimal columns; org_id + owner subject keys; RLS review gate; no transfer tables |
| **A3** | **L** — thin orchestration | **M** — capability breadth / ACL bypass | **L** | Fail closed; owner scope on every read; audit link create; no `payout:manage` money ops in A |
| **A4** | **L** | **M** — session + open redirect on return URLs | **L** | Allowlist return URLs to portal paths; mirror existing CSRF/session rules |
| **A5** | **M** — optional; idempotency | **H** — webhook forgery if miswired | **M** — accidental coupling to rent/SaaS handlers | **Separate** route + secret; reject unsigned; ignore money event types; do not import payments webhook router |
| **A6** | **L** | **L** | **M** — OWNER-001 IA / copy confusion | No nav redesign; copy review (Eligible ≠ paid); keep placeholders for pending/paid |
| **A7** | **M** — host surface TBD | **M** — PM over-grant | **M** — wrong PM page / dual console | Pick one existing settings/financial host day-1; grant only org onboarding |
| **A8** | **L** | **M** — over-granting roles | **L** | Seed narrowly; document env vars without secrets; verification against A-S1–A-S7 |

### Cross-cutting risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Scope creep into transfers | **H** (product) | Phase lock; refuse money APIs; regression checklist “no transfer symbols” |
| Owners believe money will arrive | **M** | Honesty copy gate in A6 manual QA |
| Ops: Connect not enabled in env | **M** | Pre-kickoff ops checklist; noop provider for local |
| Doc/freeze confusion vs kickoff | **L** | Code only after `BEGIN FIN-003 PHASE A IMPLEMENTATION` |

---

## 6. Phase A execution order

### Confirmed sequence (critical path)

```
A1 ConnectProvider
 → A2 Persistence
   → A3 OwnerPayoutService
     → A4 API routes
       → ┬─ A5 webhooks (optional, parallel)
         ├─ A6 Owner Portal UI (parallel)
         └─ A7 PM org status UI (parallel)
           → A8 closeout (capabilities may start earlier — see below)
```

This matches [19](./19-phase-a-implementation-plan.md) and is optimal: provider → data → domain → HTTP → surfaces → verify.

### Parallelization (after kickoff)

| Window | Parallel work |
|--------|----------------|
| **After A1 starts** | Draft capability registry entries / env.example comments (A8 slice); noop tests |
| **After A2** | Eligibility mapper unit tests; A5 design (route + secret names) without enabling prod webhook |
| **After A4** | **A5 ∥ A6 ∥ A7** — primary parallelization opportunity |
| **Throughout** | Docs stubs for 21/22; copy review checklist; regression watch on payments/saas paths |
| **End** | A8 verification gates, security review, completion attestation |

### Recommended team split (illustrative)

| Lane | Tasks |
|------|-------|
| Integrations | A1 → A5 |
| Domain / API | A2 → A3 → A4 |
| Portal | A6 + A7 (after A4 contracts stable) |
| Hardening | A8 + security review |

---

## 7. Go / No-Go recommendation

| Criterion | Met? |
|-----------|------|
| Phase A scope clear and exclusive of money movement | ✅ |
| A1–A8 objectives / deps / acceptance measurable | ✅ |
| Architecture reuse validated (no new architecture) | ✅ |
| Dependencies and required-new vs forbidden-new flagged | ✅ |
| Risks identified with mitigations | ✅ |
| Execution order + parallelism defined | ✅ |
| Testing + rollback + verification gates in [19] | ✅ |
| Application code still locked pending kickoff | ✅ |

### Recommendation

**GO (engineering)** — Phase A may proceed **when** implementation is explicitly authorized via:

`BEGIN FIN-003 PHASE A IMPLEMENTATION`

Until that phrase, recommendation is **NO-GO for coding** (freeze / lock holds).

This audit does **not** itself authorize implementation, change package status, or unlock Phases B–E.

---

## 8. Audit verification (this document)

| Check | Result |
|-------|--------|
| No implementation performed | ✅ |
| No governance changes | ✅ |
| No package status changes | ✅ |
| No authorization changes | ✅ |
| Repository remains in development freeze for app work | ✅ (docs-only readiness) |

---

## Related

- [19 — Phase A implementation plan](./19-phase-a-implementation-plan.md)  
- [17 — Phase A readiness](./17-phase-a-readiness.md)  
- [06 — Security](./06-security-and-compliance.md)  
- [10 — API boundaries](./10-api-boundaries.md)  
- [Development freeze checkpoint](../00-governance/development-freeze-checkpoint.md)
