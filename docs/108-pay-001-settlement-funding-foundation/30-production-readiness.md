# 30 — Production Readiness Validation

**Package:** PAY-001 — Settlement Funding Foundation  
**Slice:** 3  
**Authority:** Ops checklist for destination enable · does **not** mark package Verified by itself · does **not** close Blocker 4  
**Helper:** `evaluatePay001ProductionReadiness` in `ops-readiness.ts`

---

## Purpose

Before enabling live destination charges in production, ops/finance must satisfy env + attestation checks. This document is the procedure; the helper evaluates the checklist in CI/ops tooling when flags are supplied.

---

## Checklist (PR1–PR6)

| ID | Requirement | How to satisfy |
|----|-------------|----------------|
| PR1 | `PAYMENT_PROVIDER=stripe` | Deploy env |
| PR2 | `STRIPE_SECRET_KEY` present (server-only) | Secrets manager — never commit |
| PR3 | `PAY001_DESTINATION_FUNDING_ENABLED` on | Env kill switch intentional |
| PR4 | `STRIPE_WEBHOOK_SECRET` present | Payments-rail webhook verification |
| PR5 | **Q3b** commercial fee rates attested | Finance records disclosed `application_fee_amount` policy vs live config |
| PR6 | **Q4** dispute-fee liability attested | Finance confirms Stripe dispute fee attribution against current Stripe docs |

`readyForProductionDestination === true` only when **all** PR1–PR6 pass.

---

## Q3b / Q4 attestation (ops)

| Item | Status for Slice 3 delivery | Note |
|------|----------------------------|------|
| Q3b fee-rate attestation | ⏳ **Ops/finance follow-up** | Slice 3 ships the checklist + helper; production enable requires recorded attestation |
| Q4 dispute-fee attestation | ⏳ **Ops/finance follow-up** | Same — do not claim auto-attested by code |

Slice 3 **does not** invent fee rates or dispute-fee policy. It provides the readiness gate that **requires** human attestation flags before production destination enable is considered ready.

---

## Operational reconciliation (production)

1. Prefer scheduled / on-demand money-in reconcile for high-value orgs ([29](./29-ops-runbooks.md) §1).
2. Alert on A21-class anomalies (enrolled + funding on + unexpected legacy/missing destination) using existing audit/alert paths from Slice 1.
3. Freeze funding ([29](./29-ops-runbooks.md) §6) on custody incidents before investigating.

---

## Commercial readiness support (CORE-002)

| Item | PAY-001 Slice 3 contribution |
|------|------------------------------|
| Money-in foundation operable | Runbooks + readiness + A1–A21 evidence matrix |
| Package Verified | Still requires independent package certification after Slice 3 closeout |
| Blocker 4 CLOSE | ❌ **Not closable** by PAY-001 — needs FIN-003 E path |
| FIN-003 Phase C | 🔒 Still locked until PAY-001 **Verified** + separate authorize |

---

## Related

- [08 — Open questions](./08-open-questions.md) (Q3b / Q4 / Q8)
- [09 — Approval checklist](./09-approval-checklist.md)
- [29 — Ops runbooks](./29-ops-runbooks.md)
- [31 — A1–A21 evidence](./31-a1-a21-evidence.md)
