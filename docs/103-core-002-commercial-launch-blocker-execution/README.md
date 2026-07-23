# CORE-002 — Commercial Launch Blocker Execution

**Status:** ✅ **Approved** · Blocker 1 **PASS** · Next: Blocker 2 (Vendor Payments)  
 
**Initiative ID:** CORE-002  
**Priority:** CRITICAL  
**Parent:** [CORE-001](../102-core-001-commercial-platform-gap-analysis/README.md) (**Approved**)  
**Date:** 2026-07-22  
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
| **1** | Live Tenant Rent Collection Certification | EP-017 / API-005 | **Active now** — supervised live E2E |
| **2** | Vendor Payments | VENDOR-001 Phase B | Unlock after #1 PASS; Phase B Approve before build |
| **3** | Owner Portal | New Owner Portal MVP package | After #2 or parallel only if #1 PASS and staffing allows — **default: after #2** |
| **4** | Owner Payouts | FIN-003 Phases B–E | Restore docs → Approve → implement; after portal foundation |
| **5** | Push Notifications | PUSH-001 | Real-device commercial PASS |
| **6** | Performance | EP-019 | Resume after money/ops blockers or as cert-only if no code |

**Serial default:** `1 → 2 → 3 → 4 → 5 → 6`  
**Parallel exception:** Ops-only certs that do not change schema may run beside an in-flight build **only after Blocker 1 PASS**.

## Current focus

### Blocker 1 — Live Tenant Rent Collection Certification

Certify:

```
Resident → Stripe → Ledger → Property → Notifications → Receipt → Reporting
```

No Vendor / Owner Portal / FIN-003 / Push / Performance implementation until Blocker 1 = **PASS**.

## Success

- Every listed blocker has commercial certification evidence.  
- Commercial readiness score re-measured ≥ **9.5**.  
- No new roadmap items until all six are addressed.
