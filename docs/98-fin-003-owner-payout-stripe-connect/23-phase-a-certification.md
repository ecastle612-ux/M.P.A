# 23 — Phase A Certification

**Package:** FIN-003 — Owner Payouts via Stripe Connect  
**Phase:** A — Connect foundation (onboarding & status only)  
**Document type:** Official post-implementation certification review  
**Date:** 2026-07-23  
**Reviewer role:** Engineering certification audit (docs + code inspection)  
**Evidence:** [21 — Verification](./21-phase-a-verification.md) · [22 — Completion](./22-phase-a-completion.md)  
**Architecture:** [ADR-023](../18-decision-log/adr-023-stripe-connect-express-owner-payouts.md) · [ADR-024](../18-decision-log/adr-024-saas-stripe-billing-separation.md)

> **No new functionality in this review.**  
> **Phase B is not authorized by this certification.**

---

## 1. Executive summary

FIN-003 Phase A was reviewed against the approved readiness/plan, verification report, completion attestation, and as-built code (ConnectProvider, migration, OwnerPayoutService, APIs, webhooks, Owner Portal / PM settings UI).

**Outcome: ✅ PASS**

Phase A delivers Stripe Connect Express **onboarding and status** only. Money movement, transfers, reserves, scheduling, allocation math, and Phase B–E surfaces are absent. ADR-023 layering and ADR-024 rail separation are respected. Quality gates recorded in [21](./21-phase-a-verification.md) passed (unit tests, typecheck, ESLint, production build).

**Phase B may not begin** until separately authorized under the Implementation Gate.

---

## 2. Architecture review

| Requirement (ADR-023 / package) | Evidence | Verdict |
|---------------------------------|----------|---------|
| `UI → OwnerPayoutService → ConnectProvider → Stripe adapter` | `lib/owner-payouts/service.ts` → `integrations/connect/*`; UI calls APIs only | ✅ PASS |
| No Stripe SDK in business modules | Stripe REST isolated in `stripe-connect-provider.ts`; contracts have no transfer APIs | ✅ PASS |
| Provider port mirrors PaymentProvider | `contracts` / `registry` / `noop` / `stripe` under `integrations/connect` | ✅ PASS |
| Express accounts for org settlement + owner | `purpose: org_settlement \| owner` + Account Links | ✅ PASS |
| Custody: platform does not hold rent float | Phase A creates accounts/links only — no balance/transfer ops | ✅ PASS |
| No redesign of OWNER-001 IA | Dashboard/financials composition + settings subnav item | ✅ PASS |

**ConnectProvider Phase A surface (inspected):**

- `createExpressAccount`
- `createAccountLink`
- `getAccount`
- `parseAccountWebhook`

**Absent from provider interface:** `createTransfer`, payout create/cancel, balance ops, schedule APIs.

---

## 3. Security review

| Control | Evidence | Verdict |
|---------|----------|---------|
| Connect webhook rail isolation | `/api/webhooks/connect/[provider]` — not payments/saas routers | ✅ PASS |
| Separate signing secret | `STRIPE_CONNECT_WEBHOOK_SECRET` (explicitly not `STRIPE_WEBHOOK_SECRET`) | ✅ PASS |
| Signature verify + skew window | HMAC + 5-minute skew in stripe Connect adapter | ✅ PASS |
| Idempotency / replay | `connect_webhook_events` unique `(provider, external_event_id)` | ✅ PASS |
| Money events ignored | `transfer.*` / `payout.*` / charge / PI / invoice → `ignored` | ✅ PASS |
| Return URL allowlist | `assertSafeReturnPath` — portal/settings prefixes only | ✅ PASS |
| RBAC least privilege | `payout:onboard` (owner onboarding), `payout:manage` (org settlement); status also via `financial:read` | ✅ PASS |
| Audit logging | `connect_audit_events` on link create, status sync, webhook apply | ✅ PASS |
| Feature flag / rollback | `FIN003_PHASE_A_ENABLED` — production requires explicit enable; disable → noop | ✅ PASS |
| RLS on Connect tables | Migration policies on `connect_accounts` / audit select | ✅ PASS |

**Note (accepted for Phase A):** Platform `STRIPE_SECRET_KEY` may be shared across Stripe product rails (same Stripe platform account). **Webhook secrets and handler routes remain separated** per ADR-024 — this is the binding isolation control.

---

## 4. Scope review

### In scope — validated present

| Capability | Location |
|------------|----------|
| Connect onboarding (Account Links) | Owner + org API routes + ConnectProvider |
| Account create/link persistence | `connect_accounts` migration + service inserts |
| Verification / eligibility status | `eligibility.ts` + mirrored columns + UI badges |
| Read-only payout status | Dashboard widget + Financials card + honesty copy (`pendingPayoutAvailable: false`) |

### Out of scope — validated absent

| Forbidden | Inspection result |
|-----------|-------------------|
| Money movement | No transfer/payout create methods or routes |
| Transfers | Provider ignores `transfer.*`; no TransferIntent tables/APIs |
| Reserve logic | No reserve schema or service logic |
| Payout scheduling | No schedule tables/routes/UI |
| Split ownership / allocation math | No allocation profiles or calc engines |
| Phase B leakage | No polish-only Phase B modules; B remains locked in package docs |

### ADR-024 / rail isolation

| Rail | Path | Touched by Phase A? |
|------|------|---------------------|
| API-005 rent payments | `integrations/payments` · `/api/webhooks/payments` | ❌ Unchanged |
| BILL-001 SaaS | `integrations/saas-billing` · `/api/webhooks/saas` | ❌ Unchanged |
| FIN-003 Connect | `integrations/connect` · `/api/webhooks/connect` | ✅ New, isolated |

---

## 5. Regression review

| Surface | Result |
|---------|--------|
| API-005 resident payments / webhooks | Not modified in Phase A diff set |
| BILL-001 SaaS billing | Not modified |
| OWNER-001 navigation / IA | Preserved; Connect card composed into Financials; settings subnav additive |
| Quality gates ([21](./21-phase-a-verification.md)) | Unit tests ✅ · Typecheck ✅ · ESLint ✅ · Production build ✅ |

---

## 6. Known limitations

| Limitation | Impact | Disposition |
|------------|--------|-------------|
| Production requires `FIN003_PHASE_A_ENABLED=true` | Connect UI/APIs disabled until explicitly enabled | By design (safe default) |
| Migration must be applied per environment | Tables/capabilities absent until migrate | Ops prerequisite |
| Generated `@mpa/supabase` types may lag `connect_*` tables | Service uses typed-any client pattern (same as billing) | Acceptable interim |
| Live Stripe Connect Design Partner E2E | Verification used unit/noop/sandbox adapter evidence | Recommended before commercial money-out (Phase C), not a Phase A fail |
| `payout:manage` granted to PM now | Broader than owner onboard; Phase A uses it only for org settlement onboarding | Acceptable per D10; tighten later if needed |
| Pending/paid payout amounts intentionally empty | Honesty copy only | Correct for Phase A |
| Noop accounts stay non-eligible unless `_eligible` suffix | Local demo nuance | Documented in provider tests |

---

## 7. Remaining Phase B work (NOT authorized)

Phase B (per package phase plan) remains **owner onboarding polish** — not started and **not unlocked** by this certification.

Illustrative future Phase B themes (planning only):

- UX polish for remediation / return flows  
- Optional PM nudge notifications  
- Copy / empty-state refinements  

**Still later (C–E):** allocation, transfers, schedules, paid/pending money UI, Blocker 4 full certification.

**Do not begin Phase B** without explicit Authorize → kickoff under the Implementation Gate.

---

## 8. Certification checklist

| Item | Result |
|------|--------|
| Phase A scope respected | ✅ |
| No money movement | ✅ |
| No transfers | ✅ |
| No reserve logic | ✅ |
| No payout scheduling | ✅ |
| No Phase B leakage | ✅ |
| ADR-023 compliance | ✅ |
| ADR-024 compliance | ✅ |
| Payment rail isolation | ✅ |
| Stripe Connect isolation | ✅ |
| RBAC | ✅ |
| Audit logging | ✅ |
| Feature flag | ✅ |
| Production readiness (Phase A) | ✅ — with env/migration enablement prerequisites |

---

## 9. Certification result

# ✅ PASS

**FIN-003 Phase A is CERTIFIED PASS** for commercial-spine Connect foundation (onboarding & status only).

| Field | Value |
|-------|-------|
| **Result** | **PASS** |
| **Phase A status** | COMPLETE · CERTIFIED |
| **Phases B–E** | 🔒 LOCKED |
| **Blocker 4 (full money-out)** | Not closed — requires later phases |
| **Phase B start** | **NO** — not authorized by this document |

---

## Related

- [17 — Phase A readiness](./17-phase-a-readiness.md)  
- [19 — Implementation plan](./19-phase-a-implementation-plan.md)  
- [20 — Engineering readiness](./20-phase-a-engineering-readiness.md)  
- [21 — Verification](./21-phase-a-verification.md)  
- [22 — Completion](./22-phase-a-completion.md)  
- [Implementation Gate](../00-governance/implementation-gate.md)
