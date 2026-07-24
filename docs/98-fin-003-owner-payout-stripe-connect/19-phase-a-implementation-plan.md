# 19 — Phase A Implementation Plan

**Package:** FIN-003  
**Phase:** A — Connect foundation (onboarding & status only)  
**Document type:** Engineering plan only  
**Status:** 🔒 **Code LOCKED** — governance package ✅ Approved · Phase A governance-authorized · **no application work** until explicit `BEGIN FIN-003 PHASE A IMPLEMENTATION`  
**Date:** 2026-07-23  
**Authoritative scope:** [17 — Phase A readiness](./17-phase-a-readiness.md)  
**Approval:** [13](./13-approval-checklist.md) · [16](./16-approval-summary.md)  
**Architecture:** [02](./02-system-architecture.md) · [ADR-023](../18-decision-log/adr-023-stripe-connect-express-owner-payouts.md) · [ADR-024](../18-decision-log/adr-024-saas-stripe-billing-separation.md)

> **This document does not start implementation.**  
> No application code, APIs, schema, Stripe SDK wiring, or UI ships from this plan alone.  
> Begin engineering only after the explicit kickoff phrase: `BEGIN FIN-003 PHASE A IMPLEMENTATION` (per package README / [13](./13-approval-checklist.md)).

---

## 1. Executive summary

Phase A delivers the **Connect onboarding and status foundation** for owner payouts — without moving money.

After Phase A is complete (post-authorization), the platform will be able to:

1. Create/link **organization settlement** Stripe Connect Express accounts  
2. Create/link **owner** Express accounts  
3. Drive owners (and PMs for org settlement) through **Account Link** onboarding  
4. Persist and display **connection**, **verification**, and **eligibility** status  
5. Show **read-only** payout/onboarding status in Owner Portal (and org status for PMs) with honest copy that eligibility ≠ money scheduled  

Phase A **proves** the `OwnerPayoutService` → `ConnectProvider` boundary and custody posture (no platform float) **without** transfers, schedules, or allocation math.

**Phases B–E remain out of scope** for this plan.

---

## 2. Scope

### In scope (ONLY)

| Capability | Meaning |
|------------|---------|
| Stripe Connect onboarding | Account Link (or Approve-selected embedded) for org + owner Express |
| Connect account creation/linking | Persist Connect account refs for org settlement + owners |
| Verification status | Mirror Stripe requirements / KYC state |
| Eligibility status | Derive Eligible / Action required / Restricted / etc. (**no** transfer) |
| Read-only payout status | Portal surfaces: onboarding/eligibility; pending/paid empty or “not available until payouts enabled” |

### Explicitly excluded

| Exclude | Deferred to |
|---------|-------------|
| Money movement | Phase C |
| Transfers (settlement → owner) | Phase C |
| Scheduled payouts | Phase C+ |
| Reserve logic | Phase C (D2) |
| Split ownership / allocation profiles | Phase C (D1) |
| Financial calculations / allocation math | Phase C |
| Payout execution / run console | Phase C+ |
| Transfer/payout money webhooks | Phase C+ |
| Instant / international / 1099 | Deferred decisions |
| Phase B–E functionality | Later authorize |

### Architecture / governance constraints (this plan)

| Constraint | Confirmation |
|------------|--------------|
| No new architecture patterns | Reuse API-005-style **provider port** (`PaymentProvider` → mirror as `ConnectProvider`) |
| No governance status changes | This plan does not alter Approve / phase unlock records |
| No implementation | Planning text only — no app/schema/API/Stripe code |
| No authorization changes | Does not unlock B–E; does not itself start Phase A coding |

---

## 3. Engineering work breakdown

*Illustrative paths — final filenames chosen at implement time within these areas. Do not create files until authorized.*

### Task A1 — ConnectProvider contracts + registry

| Field | Content |
|-------|---------|
| **Goal** | Define `ConnectProvider` port (accounts, Account Links, getAccount/status parse) + registry/noop + Stripe adapter **stub surface** matching payments integration style |
| **Reuse** | `apps/web/src/lib/integrations/payments/{contracts,registry,stripe-provider,noop-provider}.ts` pattern; keep **separate** from BILL-001 `saas-billing` |
| **Likely files** | `apps/web/src/lib/integrations/connect/contracts.ts`, `registry.ts`, `noop-provider.ts`, `stripe-connect-provider.ts` (or equivalent under `lib/integrations/`) |
| **Dependencies** | Approved Phase A unlock; Stripe Connect platform enabled in target env (ops) |
| **Acceptance** | No business module imports Stripe SDK; noop usable in tests; registry selection env-driven; **no** `createTransfer` / payout create methods invoked in Phase A code paths |

---

### Task A2 — Persistence for Connect account refs + status

| Field | Content |
|-------|---------|
| **Goal** | Store org settlement + owner Connect account ids and mirrored verification/eligibility fields needed for status UI |
| **Reuse** | Existing org/tenant/owner identity models; audit patterns; follow Approved schema approach (migration only when Phase A authorized) |
| **Likely files** | New migration under repo migrations path (when authorized); thin data access in `lib/owner-payouts/` or `lib/connect/`; types co-located |
| **Dependencies** | A1 contracts; D5/D10/D11 from [15](./15-decision-record.md) |
| **Acceptance** | Can persist and read status without transfer tables; no allocation/split tables required for A; RLS/org isolation reviewed |

---

### Task A3 — Thin OwnerPayoutService (status + onboarding orchestration only)

| Field | Content |
|-------|---------|
| **Goal** | Domain service: authz (`payout:onboard` / PM org onboarding), create Account Link, map provider account → eligibility; **no** createTransfer |
| **Reuse** | `resolveOwnerPropertyScope` / owner-portal ACL; existing authz `evaluatePermission`; Notification Service optional nudge only |
| **Likely files** | `apps/web/src/lib/owner-payouts/service.ts` (or `lib/payouts/`), capability registration where other capabilities live |
| **Dependencies** | A1, A2; D10/D11 |
| **Acceptance** | Owners cannot call transfer APIs (none exist); missing capability fails closed; audit on link create |

---

### Task A4 — Owner + org onboarding/status API routes

| Field | Content |
|-------|---------|
| **Goal** | Session-authenticated routes for status GET + onboarding-link POST (owner + org/PM), per [10](./10-api-boundaries.md) Phase A subset only |
| **Reuse** | Existing Next.js `app/api/**` auth patterns from billing/media; **do not** attach to API-005 or BILL-001 webhook routers |
| **Likely files** | e.g. `app/api/owner/payouts/status/route.ts`, `.../onboarding-link/route.ts`, `app/api/payouts/org/onboarding-link/route.ts` (names illustrative) |
| **Dependencies** | A3 |
| **Acceptance** | No schedule/run/transfer routes; CSRF/session rules match platform; returns Account Link URL + status DTOs only |

---

### Task A5 — Optional account-status webhooks

| Field | Content |
|-------|---------|
| **Goal** | If implemented: Connect **account.updated** (or equivalent) → verify signature → idempotent status mirror only |
| **Reuse** | Signature/raw-body patterns from `integrations/payments/stripe-provider`; **separate** webhook secret + route from rent + SaaS |
| **Likely files** | e.g. `app/api/webhooks/stripe-connect/route.ts`; Connect provider `parseAccountWebhook` |
| **Dependencies** | A1, A2; ops webhook endpoint config |
| **Acceptance** | Invalid signatures rejected; duplicate events safe; **no** handlers for `transfer.*` / `payout.*` money events in Phase A |

---

### Task A6 — Owner Portal read-only status UI

| Field | Content |
|-------|---------|
| **Goal** | Replace non-executing payout placeholders with live onboarding/eligibility status + CTA to start Account Link; honest empty for pending/paid |
| **Reuse** | OWNER-001 surfaces: dashboard payout attention, financials placeholders, settings if needed — **no IA redesign** ([02](./02-system-architecture.md)) |
| **Likely files** | `apps/web/src/lib/owner-portal/dashboard.ts` (payout message), financial experience components, small status card component under `components/portal/` or `components/payouts/` |
| **Dependencies** | A4 |
| **Acceptance** | Copy never implies money is scheduled/paid; Eligible ≠ payout run; mobile-usable; uses existing portal chrome |

---

### Task A7 — PM org settlement status surface

| Field | Content |
|-------|---------|
| **Goal** | Minimal PM/org view: settlement Express onboarding status + link to continue KYC |
| **Reuse** | Existing PM financial/settings areas — do not invent a second console |
| **Likely files** | PM settings or financial page hooks under `apps/web/src/app/(portals)/` / related components |
| **Dependencies** | A4 |
| **Acceptance** | Org can start/complete settlement onboarding in test; no schedule UI |

---

### Task A8 — Capabilities, audit, env, docs closeout

| Field | Content |
|-------|---------|
| **Goal** | Register `payout:onboard` (and PM grant for org onboarding as Approved); audit events; env docs for Connect keys; Phase A verification + completion reports |
| **Reuse** | Existing capability/RBAC registration; audit log helpers; secrets patterns from payments (isolated Connect env vars) |
| **Likely files** | Capability matrices / seed grants; `.env.example` comments only (no secrets committed); `docs/98-.../21-phase-a-verification.md` + `22-phase-a-completion.md` (created at implement time; **20** is engineering readiness) |
| **Dependencies** | A1–A7 |
| **Acceptance** | A-S1–A-S7 from [17](./17-phase-a-readiness.md); BILL-001 and API-005 webhook code untouched |

---

### Task dependency graph

```
A1 ConnectProvider
 ↓
A2 Persistence
 ↓
A3 OwnerPayoutService (thin)
 ↓
A4 API routes
 ├─→ A5 Account webhooks (optional)
 ├─→ A6 Owner Portal UI
 └─→ A7 PM org status UI
       ↓
     A8 Capabilities / audit / verification docs
```

---

## 4. Testing plan

### Unit testing

| Area | Focus |
|------|--------|
| ConnectProvider noop | Account create/link/status mapping without network |
| Eligibility mapper | Stripe requirements → Eligible / Action required / Restricted |
| OwnerPayoutService authz | Missing `payout:onboard` fails; ACL respected |
| Webhook parser (if A5) | Invalid signature throws; duplicate event id no-op |

### Integration testing

| Area | Focus |
|------|--------|
| Onboarding-link route | Authenticated owner receives URL; unauthenticated 401 |
| Status route | Returns persisted mirror after mock provider update |
| Org vs owner isolation | Owner cannot read other org’s Connect refs |
| Rail isolation | Connect webhook route does not share BILL-001 / API-005 secrets |

### Manual QA

| Scenario | Expect |
|----------|--------|
| Owner starts onboarding | Redirect/Account Link; return to portal; status updates |
| Incomplete KYC | Action required / restricted shown honestly |
| Eligible owner | Eligible displayed; **no** pending payout amount inventing money |
| PM org settlement | Org can onboard; status visible |
| Copy review | No “paid” / “depositing” language in Phase A |

### Failure scenarios

| Failure | Expect |
|---------|--------|
| Stripe API down | User-visible soft error; no partial corrupt status without audit |
| Invalid webhook signature | 4xx; no DB write |
| User lacks capability | 403; no Account Link |
| Return URL misuse | Safe redirect allowlist to portal paths only |

### Regression checklist

| Check | Pass? |
|-------|-------|
| API-005 rent checkout / webhooks unchanged | ☐ |
| BILL-001 SaaS billing unchanged | ☐ |
| OWNER-001 nav/IA unchanged | ☐ |
| No transfer/payout create symbols in Phase A diff | ☐ |
| Typecheck / build clean for touched packages | ☐ |

---

## 5. Rollback plan

Phase A must be **safely disableable** without data corruption or money risk (no money paths exist).

| Lever | Action |
|-------|--------|
| **Feature flag / env** | Disable Connect provider selection (force noop) or `FIN003_PHASE_A_ENABLED=false` (name illustrative) → UI shows prior honest placeholder / “coming soon” |
| **Capability revoke** | Remove `payout:onboard` grants → APIs fail closed |
| **Webhook** | Disable endpoint / rotate secret → stop status updates; UI shows last known or “unavailable” |
| **UI** | Revert status cards to OWNER-001 non-executing copy if needed |
| **Data** | Retain Connect refs (harmless); do **not** delete Stripe accounts automatically on rollback |
| **Communicate** | Owners: onboarding paused; no funds were moved by Phase A |

Rollback does **not** require undoing Phases B–E (they must not have shipped).

---

## 6. Verification gates

Before Phase A may be marked **complete** (after authorized implement):

| Gate | Requirement |
|------|-------------|
| Typecheck | `@mpa/web` (and affected packages) pass |
| ESLint | Scoped lint on touched paths pass |
| Production build | `apps/web` production build pass |
| Security review | Secrets, webhook verify, RBAC, rail isolation reviewed |
| Documentation update | README / gate registry Phase A progress; [17] success criteria annotated |
| Verification report | New Phase A verification doc (evidence for A-S1–A-S7) |
| Phase completion report | Completion note + explicit “no money movement” attestation |
| Regression checklist | §4 regression items all ☑ |

Optional but recommended: Design Partner sandbox walk of owner + org onboarding.

---

## 7. Plan verification (this document)

| Check | Result |
|-------|--------|
| Introduces no new architecture | ✅ Provider port mirrors PaymentProvider; ADR-023 layering |
| No governance status changes | ✅ Plan only; does not rewrite Approve / signature records |
| No implementation | ✅ Planning only |
| No authorization changes | ✅ Does not unlock B–E; code remains locked until kickoff phrase |

---

## Authorization reminder

| State | Meaning |
|-------|---------|
| **Now** | Application implementation **LOCKED** — wait for `BEGIN FIN-003 PHASE A IMPLEMENTATION` |
| **After kickoff** | Execute this plan within [17](./17-phase-a-readiness.md) boundaries only |
| **Phases B–E** | Require separate authorize — **not** covered here |

---

## Related

- [17 — Phase A readiness](./17-phase-a-readiness.md)  
- [13 — Approval checklist](./13-approval-checklist.md)  
- [10 — API boundaries](./10-api-boundaries.md)  
- [06 — Security](./06-security-and-compliance.md)  
- [Development Freeze](../00-governance/development-freeze-checkpoint.md) · resume after Approve
