# 11 — Acceptance Criteria

**Package:** FIN-003  
**Status:** ✅ **Approved**  
**Alignment:** CORE-002 Blocker 4 — Owner Payouts

FIN-003 / Blocker 4 is **PASS** only when criteria below are **PASS** after Approve + Implement + commercial cert. This document defines the bar; **Implement remains locked** until Approved + authorized phase.

---

## A. Custody & separation

| ID | Criterion | PASS | FAIL |
|----|-----------|------|------|
| A1 | M.P.A. never holds customer rent float | Destination charges + Connect transfers only | Platform balance redistribution |
| A2 | Stripe Connect performs money movement | Transfers/payouts via ConnectProvider | In-house bank rails |
| A3 | SaaS billing independent | Separate webhooks/customers | Shared with BILL-001 |
| A4 | Property accounting remains SoR for rent facts | Allocations reconcile to ledger | Parallel invented ledger of truth |

---

## B. Onboarding & eligibility

| ID | Criterion | PASS | FAIL |
|----|-----------|------|------|
| B1 | Owner can complete Express onboarding from Owner Portal | Account Link flow works | Dead-end / PM-only only |
| B2 | Verification / bank states visible | States match [09](./09-user-experience.md) | Opaque errors |
| B3 | Ineligible owners blocked from transfer | No transfer created | Pays restricted accounts |

---

## C. Payout lifecycle

| ID | Criterion | PASS | FAIL |
|----|-----------|------|------|
| C1 | Scheduled or manual run creates allocations | Run + intents exist | Manual spreadsheet only |
| C2 | Pending visible to authorized owners | Dashboard/Financials live | Placeholder remains in production claim |
| C3 | Paid history accurate | Matches Stripe + internal status | Wrong amounts / other owners |
| C4 | Failed / returned paths work | Notify + retry/action | Silent failure |
| C5 | Idempotent transfers | Replay does not double-pay | Duplicate transfers |

---

## D. Security

| ID | Criterion | PASS | FAIL |
|----|-----------|------|------|
| D1 | Webhook signatures validated | Invalid rejected | Open webhook |
| D2 | Event replay safe | Dedupe by event.id | Double apply |
| D3 | Owner ACL on reads | Property-scoped | Cross-owner leak |
| D4 | Audit on sensitive actions | Evidence present | No trail |

---

## E. Experience

| ID | Criterion | PASS | FAIL |
|----|-----------|------|------|
| E1 | OWNER-001 placeholders replaced without IA redesign | Same nav | New portal shell |
| E2 | Action required states actionable | Stripe remediation link | Dead ends |
| E3 | Mobile usable | Phone viewport | Desktop-only |

---

## F. Quality gates

| ID | Criterion | PASS | FAIL |
|----|-----------|------|------|
| F1 | Typecheck / build | Exit 0 | Failures |
| F2 | Money-path tests | Coverage for idempotency + ACL | None |
| F3 | Commercial cert evidence under CORE-002 / FIN-003 | Linked note | “Done” without evidence |

---

## Certification protocol (post-Implement)

1. Org settlement Express ready in test/live as Authorized.  
2. Owner completes onboarding with test identity.  
3. Seed collected rent → allocation → transfer → payout.paid.  
4. Negative tests: restricted account, replay webhook, cross-owner read.  
5. Record evidence; mark Blocker 4 PASS only if A–F pass.
