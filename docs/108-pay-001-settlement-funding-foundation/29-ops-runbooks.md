# 29 — Operational Runbooks (A12)

**Package:** PAY-001 — Settlement Funding Foundation  
**Slice:** 3 — Ops / production readiness  
**Authority:** Satisfies [07](./07-acceptance-criteria.md) **A12** · does **not** authorize FIN-003 Phase C · does **not** enable owner transfers  
**Code registry:** `PAY001_OPS_RUNBOOK_IDS` in `apps/web/src/lib/settlement-funding/ops-readiness.ts`

---

## Custody rules (every procedure)

1. Stripe Connect Express **available** balance is cash SoT for destination corpus — ledger is not cash.
2. **Never** invent Express cash. **Never** call `createTransfer` under PAY-001.
3. Platform must **not** cover underfunded destination refunds with platform float.
4. Funding kill switch (`PAY001_DESTINATION_FUNDING_ENABLED` + org settings) is independent of FIN-003 transfer enablement.
5. Use **payments** rail for rent refunds/disputes/ACH; do not collapse with SaaS or Connect onboarding rails.

---

## RBAC (ops)

| Action | Typical permission |
|--------|-------------------|
| Money-in reconcile read | `financial:read` |
| Money-in reconcile apply (audit) | `financial:write` (org-scoped) |
| Operator refund | Existing billing refund permission path |
| Freeze funding | Org admin / platform ops with funding settings write |

---

## 1. Reconcile money-in (`reconcile_money_in`)

**When:** Suspected mismatch between Stripe settlement facts and M.P.A. ledger / attempt metadata.

**Steps:**

1. Identify `payment_attempt_id` + `organization_id`.
2. `GET /api/billing?reconcile=1&settlementAttemptId=…` (or BillingService `getMoneyInSettlementReconcile`).
3. Compare:
   - Connect **available** vs **pending** (pending ≠ transferable / refundable corpus).
   - Ledger fee / refund / ACH / dispute facts for that attempt.
4. If books need correction: apply **billing adjustment** APIs first; then `applyMoneyInSettlementReconcile` for audit trail (`settlement_reconcile_apply`).
5. Stop if tempted to invent balance or transfer to owners — escalate to Finance; FIN-003 only after package Verified + Phase C authorize.

**Exit:** Reconcile report + audit; no new Stripe cash invented.

---

## 2. Destination refund (`refund_destination`)

**When:** Resident / PM requests refund of a destination-routed rent charge.

**Steps:**

1. Confirm charge is destination-mapped (`loadSettlementMappingForAttempt`).
2. Preflight via `preflightDestinationRefund` / BillingService refund path — checks Express **available** balance (A17).
3. If underfunded → follow **underfunded refund** runbook; do **not** force refund from platform.
4. On success: payments-rail refund webhook (or sync apply) updates cumulative refunded cents, fee reversal facts, charge outstanding restore as designed in Slice 2.
5. Verify correction audit / `funding.*` events as applicable.

**Exit:** Refund succeeded or fail-closed with clear reason; ledger reflects cumulative refund.

---

## 3. Underfunded refund (`underfunded_refund`)

**When:** Refund preflight fails because org Express available < requested refund.

**Steps:**

1. Record failure reason (insufficient settlement available).
2. Do **not** route refund through platform balance as cover.
3. Ops options (business, not product invent):
   - Wait for pending → available settlement.
   - Reduce refund amount to available (partial) if policy allows.
   - Escalate to Finance / org for external settlement of shortfall **outside** inventing platform float.
4. Re-run preflight after balance change.

**Exit:** No refund applied until safe; no platform float used as corpus.

---

## 4. Dispute lifecycle (`dispute_lifecycle`)

**When:** Card dispute / chargeback on a rent payment (payments rail).

**Steps:**

1. Ingest via payments webhook → BillingService dispute apply (Slice 2).
2. Treat disputed / lost funds as **unsafe corpus** — exclude from safe settlement corpus for FIN-003 handoff signals.
3. Confirm Q4 dispute-fee liability attribution against current Stripe docs (ops attestation in [30](./30-production-readiness.md)).
4. Do not “win” books by inventing Express cash.
5. On win/loss transitions, verify ledger + metadata updates and audits.

**Exit:** Books match webhook facts; unsafe cash not treated as transferable corpus.

---

## 5. ACH return (`ach_return`)

**When:** ACH return / failed bank debit after success-looking payment.

**Steps:**

1. Payments-rail ACH return webhook → BillingService apply (Slice 2).
2. Confirm principal eligibility gates (hardening C1) — do not double-reverse improperly.
3. Exclude returned principal from safe corpus; restore charge outstanding as designed.
4. Notify via existing failed-payment notification patterns (no new clawback product).
5. Reconcile if ledger vs Stripe still diverge.

**Exit:** Principal reversed in books; safe corpus exclusion applied.

---

## 6. Freeze funding (`freeze_funding`)

**When:** Incident, readiness failure, or ops need to stop destination routing without enabling transfers.

**Steps:**

1. Set `PAY001_DESTINATION_FUNDING_ENABLED` off (env kill switch) **and/or** disable org settlement funding settings.
2. Confirm enrolled orgs fail closed on new charges (A3 / A20) — no silent platform fallback.
3. Leave FIN-003 transfer flags untouched (must remain off under PAY-001).
4. Document incident + time window; re-enable only after [30](./30-production-readiness.md) PR1–PR6 satisfied.
5. Optional: run money-in reconcile on in-flight attempts.

**Exit:** New destination charges blocked; no owner transfer enablement as side effect.

---

## Related

- [03 — Payment routing](./03-payment-routing.md)
- [05 — Refunds and disputes](./05-refunds-disputes.md)
- [06 — Security and compliance](./06-security-and-compliance.md)
- [30 — Production readiness](./30-production-readiness.md)
- [31 — A1–A21 evidence](./31-a1-a21-evidence.md)
