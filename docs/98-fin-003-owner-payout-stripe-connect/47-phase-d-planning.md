# 47 — Phase D Planning

**Package:** FIN-003 — Owner Payouts via Stripe Connect  
**Phase:** D — Portal & notifications (visibility / UX polish)  
**Document type:** Phase plan (governance)  
**Date:** 2026-07-23  
**Authorization:** ✅ **AUTHORIZED** — [48](./48-phase-d-authorization.md)  
**Code:** 🔒 Until `BEGIN FIN-003 PHASE D IMPLEMENTATION`  
**Prerequisites:** Phase C ✅ **CERTIFIED PASS** ([46](./46-phase-c-pass-certification.md)) · PAY-001 ✅ Verified · OWNER-001 host surfaces ready

> **No transfer-engine redesign.** Phase D projects Phase C facts into Owner Portal / Settings / notifications.  
> **Phase E and Blocker 4 CLOSE remain out of scope.**

---

## 1. Purpose

Replace OWNER-001 payout placeholders with real, read-mostly owner visibility and PM console clarity for Phase C TransferIntents / PayoutRuns, and productize remittance / paid / failed notifications via the existing Notification Service — without new money-movement capabilities.

---

## 2. Authorized in-scope capabilities

| # | Capability | Notes |
|---|------------|-------|
| D1 | Owner payout history | Paid / failed / pending projections from TransferIntent (+ run context) |
| D2 | TransferIntent projections | Owner-scoped read models; no inventing amounts |
| D3 | Remittance notifications | Notify via existing Notification Service when remittance artifacts / paid events apply |
| D4 | Paid / failed payout notifications | Owner (+ PM as designed) honesty copy; no spam storms |
| D5 | Remittance UX | Surfaces / links for remittance visibility (D14 family); reuse Document Vault if already wired |
| D6 | PM payout run console improvements | Richer UX over existing Phase C run APIs — status, intents, failures, reconcile hints |
| D7 | Read-only payout visibility | Owners: `financial:read` / portal ACL; PMs: `payout:manage` or `financial:read` as today |

### Binding constraints

- **No new portal IA** — compose into OWNER-001 Financials / dashboard / Settings patterns ([01](./01-business-workflows.md) Workflow D).  
- **No new transfer / allocation / lease / execute semantics** — read + notify only (except reusing existing Phase C execute APIs in PM console).  
- **Honesty** — never show “paid” without TransferIntent / webhook-backed state.  
- **Reuse** — OwnerPayoutService projections, Notification Service, Connect audit, OWNER-001 shells.

---

## 3. Explicit exclusions (still forbidden)

| Forbidden | Reason |
|-----------|--------|
| Phase E / commercial hardening certification | Separate authorize |
| Blocker 4 CLOSE | Requires Phase E path |
| Commercial Launch | Not FIN-003 Phase D |
| New transfer engine functionality | Phase C is SoT; D does not extend money-out |
| Scheduling / automatic payout cadence | Deferred (not in this Authorize) |
| Auto-retry storms / reserve product | Out of Phase D |
| Platform-float payouts / BILL-001 merges | ADR-023/024 |

---

## 4. Architecture reuse

| System | Use in Phase D |
|--------|----------------|
| Phase C TransferIntent / PayoutRun / attempts | Source of truth for projections |
| OwnerPayoutService | Read APIs / projection helpers (extend read surface only) |
| OWNER-001 portal + Settings | Host UI |
| Notification Service | Remittance / paid / failed |
| RBAC | `financial:read`, `payout:manage`, owner portal ACL |
| `connect_audit_events` | Optional notify audits |

---

## 5. Acceptance themes (prove at implement / Phase D cert)

1. Owner sees accurate history for authorized properties only.  
2. Pending/paid/failed match TransferIntent states (no fabricated paid).  
3. Notifications fire for paid/failed (and remittance when applicable) with idempotent event keys.  
4. PM console improves run visibility without changing transfer safety controls.  
5. No Phase E / schedule / new `createTransfer` paths introduced.

---

## 6. Related

- [48 — Phase D authorization](./48-phase-d-authorization.md)  
- [46 — Phase C PASS certification](./46-phase-c-pass-certification.md)  
- [39 — Phase C completion (remaining D themes)](./39-phase-c-completion.md)  
- [01 — Business workflows](./01-business-workflows.md)  
- [OWNER-001](../104-owner-001-commercial-owner-portal/README.md)
