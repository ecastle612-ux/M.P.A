# 56 — FIN-003 Operations Runbook

**Package:** FIN-003 — Owner Payouts via Stripe Connect  
**Phase:** E — Production operational readiness  
**Date:** 2026-07-23  
**Audience:** Property managers · platform ops · on-call  
**Status:** Phase E deliverable — supports Blocker 4 evidence (does not close Blocker 4)

---

## 1. Feature flags (fail closed)

| Flag | Default | Meaning |
|------|---------|---------|
| `FIN003_PHASE_A_ENABLED` / Phase A gate | Off unless configured | Connect foundation surfaces |
| `FIN003_TRANSFERS_ENABLED` | **Off** | Money-out kill switch — must be explicitly enabled for live transfers |

**Rule:** Never enable transfers without eligible org settlement + owner Connect accounts and PAY-001 destination funding verified.

---

## 2. Happy path — ad-hoc payout run

1. Confirm org settlement Express eligible (`/settings/payouts`).  
2. Confirm owners eligible (roster).  
3. `POST /api/payouts/org/runs` with property ids + period (creates allocations + intents; **does not** transfer).  
4. Review run in Settings → Owner payouts console.  
5. `POST …/runs/{runId}/execute` (requires `payout:manage` + kill switch on).  
6. Watch intent statuses: paid / failed / needs_reconcile / skipped.  
7. Owners see history + remittance on `/portal/owner/financials#payout-history`.

---

## 3. Failure / reconcile playbook

| Symptom | Action |
|---------|--------|
| Execute blocked — kill switch | Leave off until ready; do not bypass in code |
| Preflight balance insufficient | Wait for settlement funding; do not invent corpus |
| Intent `failed` | Review failure_reason; fix Connect eligibility; new attempt only via existing Phase C cycle rules |
| Intent `needs_reconcile` | **Do not supersede period.** Use provider retrieve / existing reconcile path; never open a second transfer for ambiguous money |
| Live execute lease held | Wait for lease expiry or completion; concurrent execute is denied by design |
| Owner missing remittance | Remittance is created at paid persistence (Phase E). Re-notify is idempotent; check `payout_remittance_records` + audits |

---

## 4. Webhooks

- Endpoint: `/api/webhooks/connect/[provider]`  
- Transfer events update TransferIntent and may notify paid/failed.  
- Duplicate events are ignored via `connect_webhook_events` external id.  
- Signature verification required (provider).

---

## 5. Notifications (honesty)

| Event key pattern | Meaning |
|-------------------|---------|
| `payout.transfer.paid:{intentId}:owner` | Paid transfer recorded |
| `payout.transfer.failed:{intentId}:owner` | Failed / reversed |
| `payout.remittance.issued:{intentId}:owner` | Remittance available |
| `payout.run.attention:{runId}:pm` | PM run needs attention |

Eligible Connect ≠ paid. Pending includes `executing` / `needs_reconcile`.

---

## 6. Audit

Look in `connect_audit_events` for:

- `transfer_intent.succeeded` / `.failed` / `.needs_reconcile` / `.webhook_applied`  
- `payout_remittance.issued`  
- `payout.notify.paid` / `.failed` / `.remittance`  
- `payout_run.completed`

---

## 7. Security notes (Phase E)

- Owners with `financial:read` see **only their** transfer intents / remittances (RLS).  
- Property managers / `payout:manage` / `financial:admin` retain org-wide read for console ops.  
- Mutations remain service-role / authorized APIs only.

---

## 8. Explicit non-ops

- No automatic payout scheduling in FIN-003 Phase E.  
- No SaaS billing rail merge (ADR-024).  
- Blocker 4 CLOSE requires independent commercial certification after this runbook + Phase E verification.
