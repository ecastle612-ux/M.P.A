# CORE-002 — Commercial Launch Blocker Execution

**Status:** ✅ **Approved** · Blockers 1–3 **CLOSED (PASS)** · **Current focus: Blocker 4** (Owner Payouts / FIN-003)  
**Initiative ID:** CORE-002  
**Priority:** CRITICAL  
**Parent:** [CORE-001](../102-core-001-commercial-platform-gap-analysis/README.md) (**Approved**)  
**Date:** 2026-07-22  
**Last Updated:** 2026-07-23  
**Gate:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)

---

## Purpose

Close every remaining **Commercial Launch Blocker** so readiness moves from ~**8.3/10** toward **≥9.5/10**.

This is an **execution** package. It does not invent new product scope beyond the approved blocker list.

## Binding rules

| Rule | Binding |
|------|---------|
| Only the six blockers below | **Yes** |
| No P1/P2 outside this list | **Yes** — this list *is* the launch set |
| No new features / redesigns | **Yes** |
| Execute in order | **Yes** — do not skip ahead |
| Each blocker: commit → deploy → commercial cert → evidence | **Yes** |
| Real-device where applicable | **Yes** (push, mobile rent UX as needed) |
| Per-item Design→Document→Approve when new patterns | **Yes** (e.g. VENDOR-001 B, FIN-003, Owner Portal) |

## Approved execution order

| # | Blocker | Package / track | Gate note |
|---|---------|-----------------|-----------|
| **1** | Live Tenant Rent Collection Certification | EP-017 / API-005 | ✅ **CLOSED (PASS)** — [`02-blocker-1-live-rent-certification.md`](./02-blocker-1-live-rent-certification.md) |
| **2** | Vendor Payments | VENDOR-001 Phase B | ✅ **CLOSED (PASS)** — [18 Phase B cert](../101-vendor-001-zero-friction-vendor-experience/18-phase-b-commercial-certification.md) |
| **3** | Owner Portal | [OWNER-001](../104-owner-001-commercial-owner-portal/README.md) | ✅ **CLOSED (PASS)** — [Blocker-3-Closeout](./Blocker-3-Closeout.md) · [28 cert](../104-owner-001-commercial-owner-portal/28-owner-001-certification.md) |
| **4** | Owner Payouts | [FIN-003](../98-fin-003-owner-payout-stripe-connect/README.md) | ⏳ **Active** — Phase A ✅ **CERTIFIED** · Phase B ✅ **AUTHORIZED** · C–E 🔒 · [25](../98-fin-003-owner-payout-stripe-connect/25-phase-b-authorization.md) · [Blocker-4-Readiness](./Blocker-4-Readiness.md) |
| **5** | Push Notifications | PUSH-001 | 🔒 **Serial after Blocker 4** — package Approved; Blocker 5 closure waits for FIN-003 path |
| **6** | Performance | EP-019 | Resume after money/ops blockers or as cert-only if no code |

**Serial default (binding for commercial blocker closure):** `1 → 2 → 3 → 4 → 5 → 6`

| Rule | Binding |
|------|---------|
| Do not mark Blocker 5 **CLOSED** before Blocker 4 | **Yes** |
| PUSH-001 package may be Approved / Implement unlocked | **Yes** — does **not** authorize skipping serial blocker order |
| Parallel ops-only evidence (real devices, no schema) | **Allowed after Blocker 1 PASS** — may collect PUSH-001 evidence **without** claiming Blocker 5 CLOSED and **without** displacing FIN-003 Phase A as primary focus |

## Package contents (execution evidence)

| Doc | Purpose |
|-----|---------|
| [Blocker-3-Closeout.md](./Blocker-3-Closeout.md) | Blocker 3 formal closeout |
| [Blocker-4-Readiness.md](./Blocker-4-Readiness.md) | Blocker 4 planning checkpoint (no implement) |
| [02-blocker-1-live-rent-certification.md](./02-blocker-1-live-rent-certification.md) | Blocker 1 cert |
| [01-blocker-1-live-rent-plan.md](./01-blocker-1-live-rent-plan.md) | Blocker 1 plan |

## Closed blockers

### Blocker 1 — Live Tenant Rent Collection — ✅ CLOSED (PASS)

Evidence: [`02-blocker-1-live-rent-certification.md`](./02-blocker-1-live-rent-certification.md)

```
Resident → Stripe Checkout → Ledger → Property → Resident → Financial Activity → Notifications → Receipt → Reporting → Audit
```

### Blocker 2 — Vendor Payments — ✅ CLOSED (PASS)

Evidence: [`docs/101-vendor-001-zero-friction-vendor-experience/18-phase-b-commercial-certification.md`](../101-vendor-001-zero-friction-vendor-experience/18-phase-b-commercial-certification.md).

### Blocker 3 — Owner Portal — ✅ CLOSED (PASS)

| Item | Status |
|------|--------|
| OWNER-001 | ✅ **COMPLETE** |
| Certification | ✅ **PASS** — [28](../104-owner-001-commercial-owner-portal/28-owner-001-certification.md) |
| Commercial Readiness Review | ✅ **COMPLETE** — [29](../104-owner-001-commercial-owner-portal/29-commercial-readiness-review.md) |
| Closeout | ✅ **CLOSED** — [Blocker-3-Closeout.md](./Blocker-3-Closeout.md) |

No further OWNER-001 phase implementation. Material Owner Portal changes restart the Implementation Gate. Stripe Connect / FIN-003 remain Blocker 4.

## Current focus — Blocker 4 — Owner Payouts (FIN-003)

| Item | Status |
|------|--------|
| Readiness checkpoint | [Blocker-4-Readiness.md](./Blocker-4-Readiness.md) |
| ADR-023 | ✅ Accepted |
| FIN-003 design package | ✅ **APPROVED** — [16 Approval Summary](../98-fin-003-owner-payout-stripe-connect/16-approval-summary.md) |
| Approved By | Product Owner (2026-07-23) |
| Phase A | ✅ **AUTHORIZED** — [17](../98-fin-003-owner-payout-stripe-connect/17-phase-a-readiness.md) |
| Phases B–E | 🔒 **LOCKED** |
| Code start | 🔒 Wait for `BEGIN FIN-003 PHASE A IMPLEMENTATION` |

**Next action:** Await explicit `BEGIN FIN-003 PHASE A IMPLEMENTATION` before any Stripe/code/schema/API work. Phases B–E remain locked.

**Governance audit:** [Project Roadmap Status](../00-governance/project-roadmap-status.md) · [Closeout](../00-governance/governance-audit-closeout.md) (2026-07-23).  
**Master plan:** [Commercial Launch Master Plan](../00-governance/commercial-launch-master-plan.md).  
**Freeze:** [Development Freeze Checkpoint](../00-governance/development-freeze-checkpoint.md) — Phase A governance unlocked; code awaits begin phrase.

## Success

- Every listed blocker has commercial certification evidence.  
- Commercial readiness score re-measured ≥ **9.5**.  
- No new roadmap items until all six are addressed.
