# CORE-002 — Commercial Launch Blocker Execution

**Status:** ✅ **Approved** · Blockers 1–4 **CLOSED (PASS)** · **Current focus: Blocker 5** (Push Notifications / PUSH-001)  
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
| **4** | Owner Payouts | [FIN-003](../98-fin-003-owner-payout-stripe-connect/README.md) | ✅ **CLOSED (PASS)** — [Blocker-4-Closeout](./Blocker-4-Closeout.md) · [57 package cert](../98-fin-003-owner-payout-stripe-connect/57-fin003-package-certification.md) |
| **5** | Push Notifications | PUSH-001 | ⏳ **Active** — package Approved; Blocker 5 commercial closure in focus (serial after Blocker 4) |
| **6** | Performance | EP-019 | ⏳ **Queued** — [Blocker-6-Readiness](./Blocker-6-Readiness.md); Not Approved · Implement locked; after Blocker 5 |

**Serial default (binding for commercial blocker closure):** `1 → 2 → 3 → 4 → 5 → 6`

| Rule | Binding |
|------|---------|
| Do not mark Blocker 5 **CLOSED** before Blocker 4 | **Yes** |
| PUSH-001 package may be Approved / Implement unlocked | **Yes** — does **not** authorize skipping serial blocker order |
| Parallel ops-only FIN-003/PAY-001 production enable | **Allowed** — does not reopen Blocker 4; does not authorize Commercial Launch |

## Package contents (execution evidence)

| Doc | Purpose |
|-----|---------|
| [Blocker-3-Closeout.md](./Blocker-3-Closeout.md) | Blocker 3 formal closeout |
| [Blocker-4-Closeout.md](./Blocker-4-Closeout.md) | Blocker 4 formal closeout |
| [Blocker-4-Readiness.md](./Blocker-4-Readiness.md) | Blocker 4 readiness checkpoint (historical) |
| [Blocker-5-Readiness.md](./Blocker-5-Readiness.md) | Blocker 5 governance preflight (PUSH-001) |
| [Blocker-6-Readiness.md](./Blocker-6-Readiness.md) | Blocker 6 governance preflight (EP-019) |
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

No further OWNER-001 phase implementation. Material Owner Portal changes restart the Implementation Gate.

### Blocker 4 — Owner Payouts — ✅ CLOSED (PASS)

| Item | Status |
|------|--------|
| Closeout | ✅ **CLOSED** — [Blocker-4-Closeout.md](./Blocker-4-Closeout.md) |
| FIN-003 package cert | ✅ **PASS** — [57](../98-fin-003-owner-payout-stripe-connect/57-fin003-package-certification.md) |
| PAY-001 predecessor | ✅ **Verified** |

No further FIN-003 phase implementation required for Blocker 4. Live transfer enable remains ops/deployment (`FIN003_TRANSFERS_ENABLED`). Material new payout product features restart the Implementation Gate.

## Current focus — Blocker 5 — Push Notifications (PUSH-001)

| Item | Status |
|------|--------|
| Readiness preflight | [Blocker-5-Readiness.md](./Blocker-5-Readiness.md) |
| Package | [PUSH-001](../99-push-001-pwa-push-commercial-certification/README.md) — **Approved** · Implement unlocked |
| Commercial cert | ⏳ **PASS pending** real-device evidence (G1–G10) |
| Blocker 5 closure | ⏳ **OPEN** — serial commercial focus after Blocker 4 |
| Commercial Launch | ❌ Not authorized |

**Certification session (2026-07-24):** ❌ **FAIL** — [14](../99-push-001-pwa-push-commercial-certification/14-commercial-certification-report.md) (prod preflight only; no physical-device evidence).  

**Next action:** Humans complete [13](../99-push-001-pwa-push-commercial-certification/13-launch-readiness-execution.md) on real devices → `RESUME PUSH-001 REAL-DEVICE CERTIFICATION — evidence attached`. Do **not** claim package PASS without physical-device evidence. Do **not** close Blocker 5 without cert. Do **not** claim Commercial Launch. Do **not** skip to Blocker 6 closure as a substitute.

## Queued — Blocker 6 — Performance (EP-019)

| Item | Status |
|------|--------|
| Readiness preflight | [Blocker-6-Readiness.md](./Blocker-6-Readiness.md) |
| Package | [EP-019](../87-ep-019-performance-speed-certification/README.md) — **Paused** · ❌ Not Approved · Implement **locked** |
| UX-009 sequencing | ❌ Not package-COMPLETE (EP-019 pause still binds) |
| Blocker 6 closure | ⏳ **QUEUED** — after Blocker 5 CLOSE + `APPROVE EP-019` + measure/optimize/verdict |
| Commercial Launch | ❌ Not authorized |

**Do not** issue `APPROVE EP-019` while Blocker 5 remains the active commercial focus and UX-009 remains incomplete — see readiness note.

**Governance audit:** [Project Roadmap Status](../00-governance/project-roadmap-status.md) · [Closeout](../00-governance/governance-audit-closeout.md) (2026-07-23).  
**Master plan:** [Commercial Launch Master Plan](../00-governance/commercial-launch-master-plan.md).  
**Freeze:** [Development Freeze Checkpoint](../00-governance/development-freeze-checkpoint.md) — Blocker 4 CLOSED; focus Blocker 5.

## Success

- Every listed blocker has commercial certification evidence.  
- Commercial readiness score re-measured ≥ **9.5**.  
- No new roadmap items until all six are addressed.
