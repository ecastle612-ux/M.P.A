# 52 — Phase E Planning

**Package:** FIN-003 — Owner Payouts via Stripe Connect  
**Phase:** E — Hardening, ops readiness & commercial certification  
**Document type:** Phase plan (governance)  
**Date:** 2026-07-23  
**Authorization:** ✅ **AUTHORIZED** — [53](./53-phase-e-authorization.md)  
**Code:** 🔒 Until `BEGIN FIN-003 PHASE E IMPLEMENTATION`  
**Prerequisites:** Phase A/B/C ✅ **CERTIFIED PASS** · Phase D ⚠️ **CERTIFIED CONDITIONAL PASS** ([51](./51-phase-d-certification.md)) · PAY-001 ✅ Verified · FIN-003 ✅ Approved

> **Hardening + residual closeout + Blocker 4 evidence path.**  
> **No new money-out product features.** Scheduling / auto-cadence remain **out of this Authorize**.  
> **Blocker 4 CLOSE** requires Phase E delivery + independent commercial cert — not this plan alone.

---

## 1. Purpose

Close Phase D residuals **R-D1–R-D4**, complete final commercial / operational hardening for owner payouts (Connect Express money-out as already built in Phase C), publish production runbooks, and produce Blocker 4 closeout evidence via final commercial certification — without expanding transfer, settlement, or payment product surface.

---

## 2. Why R-D1–R-D4 belong in Phase E

| ID | Finding | Phase E fit |
|----|---------|-------------|
| **R-D1** | Org-wide `financial:read` RLS on remittance / intents (owner-row gap) | Security hardening — owner-row RLS or constrained RPC |
| **R-D2** | Remittance coupled to paid notify path | Reliability hardening — remittance at paid persistence boundary |
| **R-D3** | Financials history capped at 20 properties | Completeness hardening — uncapped (or explicitly complete) projection |
| **R-D4** | Remittance / notify audit gap | Ops hardening — `connect_audit_events` (or equivalent) |

These are **not** new payout products. They remediate CONDITIONAL PASS visibility/security/ops gaps so Phase D can graduate toward absolute commercial readiness alongside Blocker 4 evidence.

---

## 3. Authorized in-scope capabilities

| # | Capability | Notes |
|---|------------|-------|
| E1 | Final commercial hardening | Kill-switch, webhook, reconcile, lease, idempotency posture review + residual fixes |
| E2 | R-D1–R-D4 remediation | Binding closeout targets from [51](./51-phase-d-certification.md) |
| E3 | Production operational readiness | Env flags, Connect webhook ops, failure / needs_reconcile playbooks |
| E4 | Final runbooks | PM execute, owner visibility honesty, remittance, attention notifications |
| E5 | Final commercial certification | Independent Phase E / Blocker 4 evidence package |
| E6 | Blocker 4 evidence | Map to [11](./11-acceptance-criteria.md) / CORE-002 Blocker 4 CLOSE path |

### Binding constraints

- **No new transfer engine** — reuse Phase C create/execute/lease/reconcile.  
- **No new allocation / settlement / payment capabilities** — PAY-001 + Phase C remain SoT.  
- **No scheduling / automatic payout cadence** in this Authorize (still deferred).  
- **No inventing paid** — honesty rules from Phase D remain binding.  
- **Blocker 4 CLOSE** only after Phase E cert PASS (separate closeout record).

---

## 4. Explicit exclusions (still forbidden)

| Forbidden | Reason |
|-----------|--------|
| New transfer features / `createTransfer` semantics | Phase C SoT |
| Scheduling / auto cadence | Not in this Authorize |
| New payment / settlement funding capabilities | PAY-001 / API-005 ownership |
| Platform-float / BILL-001 rail merge | ADR-023/024 |
| Commercial Launch / GA | Beyond Blocker 4 |
| Claiming Blocker 4 CLOSE without Phase E cert | Gate integrity |

---

## 5. Acceptance themes (prove at implement / Phase E cert)

1. **R-D1** closed — owners cannot SELECT other owners’ remittance/intent rows via RLS (or equivalent enforced boundary).  
2. **R-D2** closed — remittance records exist for paid/in_transit intents even if notify fails; remittance notify remains idempotent.  
3. **R-D3** closed — Owner Financials payout history covers authorized owner intents without silent 20-property omission.  
4. **R-D4** closed — remittance issue / paid/failed notify outcomes auditable.  
5. Runbooks + ops readiness published; commercial certification PASS; Blocker 4 CLOSE path documented with evidence.  
6. No scheduling / new money-out features introduced.

---

## 6. Related

- [53 — Phase E authorization](./53-phase-e-authorization.md)  
- [51 — Phase D certification](./51-phase-d-certification.md)  
- [46 — Phase C PASS certification](./46-phase-c-pass-certification.md)  
- [11 — Acceptance criteria](./11-acceptance-criteria.md)  
- [Blocker-4-Readiness](../103-core-002-commercial-launch-blocker-execution/Blocker-4-Readiness.md)
