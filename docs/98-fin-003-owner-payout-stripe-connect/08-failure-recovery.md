# 08 — Failure Recovery

**Package:** FIN-003  
**Status:** ✅ **Approved**

---

## Principles

1. **Fail closed** on money movement uncertainty.  
2. **Never double-pay** — idempotency over availability.  
3. **Human-readable** owner/PM states; no silent zeros.  
4. **Audited** manual paths only.  
5. Funds remain in Stripe Connect accounts — M.P.A. does not “hold and re-cut” failed payouts in a platform wallet.

---

## Failure classes

| Class | Examples | Auto-retry? |
|-------|----------|-------------|
| Transient | Timeouts, 5xx, rate limits | Yes (bounded) |
| Balance | Insufficient org settlement available balance | Delayed re-queue; alert PM |
| Account | Restricted, disabled, requirements due | No — Action required |
| Bank return | Payout returned | No auto until bank fixed |
| Validation | Bad split config, missing ownership % | No — PM fix |
| Poison | Unknown Stripe state | Manual ops + retrieve |

---

## Retry policy (proposed for Approve)

| Parameter | Proposal |
|-----------|----------|
| Max auto attempts | 3 |
| Backoff | Exponential with jitter |
| Idempotency | Same key per PayoutAttempt |
| New attempt after return | New PayoutAttempt ID + new key |
| Schedule interaction | Failed items may roll into next run only if policy says so (default: **manual or explicit requeue**) |

---

## Returned payouts

1. Webhook → status `returned`.  
2. Notify owner + PM.  
3. Require bank/KYC remediation.  
4. PM or system creates new attempt after Eligible restored.  
5. Prior attempt remains in history (immutable).

---

## Partial runs

If a PayoutRun succeeds for some owners and fails for others:

- Run status = `partial`  
- Successful transfers stay `paid` / `in_transit`  
- Failed remain retryable independently  
- PM sees blocked list  

---

## Manual intervention playbook

| Situation | Action |
|-----------|--------|
| Owner stuck in verification | Send Account Link; support uses Stripe Dashboard if needed |
| Wrong allocation before transfer | Cancel item; create adjustment; new run |
| Wrong allocation after paid | Compensating transfer / clawback policy — **Open Question**; never rewrite history |
| Webhook missed | Reconcile job retrieves Stripe objects by ID |
| Suspected double transfer | Halt retries; reconcile by idempotency + Stripe list; escalate |

---

## Reconciliation job (design)

Periodic job:

- For open TransferIntents, retrieve Stripe status  
- Converge internal mirrors  
- Emit audit `reconcile.apply`  

Does not create new transfers without run authority.

---

## Owner communication

Failed / returned / action_required messages must:

- Say what happened in plain language  
- Say what to do next  
- Avoid exposing other owners’ data or internal Stripe secrets  
