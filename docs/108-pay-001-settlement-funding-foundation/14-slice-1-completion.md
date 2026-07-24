# 14 — Slice 1 Completion

**Package:** PAY-001 — Settlement Funding Foundation  
**Slice:** 1 — Destination routing + mapping + readiness  
**Completed:** 2026-07-23  
**Kickoff:** `BEGIN PAY-001 IMPLEMENTATION`

---

## Summary

Slice 1 establishes the settlement funding foundation: resident rent Checkout/PI creation can route as **destination charges** onto the organization settlement Stripe Connect Express account when the org is enrolled and S1–S8 ready; otherwise enrolled orgs **hard-block** (no legacy fallback). Durable charge→settlement mappings and funding audit events are persisted. Owner payouts, transfers, refunds automation, and disputes remain out of scope.

---

## Deliverables

| Artifact | Location |
|----------|----------|
| Schema | `supabase/migrations/20260723200000_pay001_slice1_settlement_funding.sql` |
| Settlement funding module | `apps/web/src/lib/settlement-funding/` |
| PaymentProvider destination routing | `apps/web/src/lib/integrations/payments/contracts.ts` · `stripe-provider.ts` |
| BillingService wiring | `apps/web/src/lib/billing/server.ts` |
| Unit tests | `settlement-funding.test.ts` · destination cases in `noop-provider.test.ts` |
| Verification | [13-slice-1-verification.md](./13-slice-1-verification.md) |
| This completion | [14-slice-1-completion.md](./14-slice-1-completion.md) |

---

## Systems reused

| System | Use |
|--------|-----|
| API-005 `PaymentProvider` / Stripe adapter | Destination + fee on create |
| API-005 BillingService | Resolve funding before create; settle confirm |
| API-005 ledger (`billing_ledger_entries`) | Payment + application fee facts |
| API-005 audit (`billing_audit_events`) | `funding.*` events |
| FIN-003 `connect_accounts` (`org_settlement`) | Readiness mirror (S1–S5) |
| RBAC capabilities | `funding:read` / `funding:manage` |
| Existing payments webhook rail | Settle path (no SaaS/Connect dispute authority) |

---

## Quality evidence

| Gate | Result |
|------|--------|
| Unit tests | ✅ 20 passed |
| Typecheck | ✅ PASS |
| ESLint (Slice 1 files) | ✅ PASS |
| Production build | ✅ PASS (`pnpm --filter @mpa/web build`) |

---

## Gate status after Slice 1

| Item | Status |
|------|--------|
| PAY-001 package | ✅ Approved |
| Slice 1 | ✅ **COMPLETE** |
| Slices 2+ | 🔒 **LOCKED** |
| PAY-001 Verified (A1–A21) | ❌ Not yet |
| FIN-003 Phase C | 🔒 Locked until PAY-001 Verified |

---

## Remaining Slice 2+ work

| Area | Notes |
|------|-------|
| Refund automation | Destination-charge refunds, underfunded fail-closed (A6, A17) |
| Dispute automation | Payments-rail dispute lifecycle (A7) |
| ACH return path | Reverse books; exclude from safe corpus (A16) |
| Ops runbooks | Reconcile / freeze-funding / underfunded-refund procedures (A12) |
| Balance SoT retrieve | Operable Stripe available vs pending (A8) |
| Legacy monitoring | Unexpected legacy-while-enrolled alert cert (A21) |
| Production attestations | Q4 dispute-fee · Q3b commercial fee rates |
| Full A1–A21 verification | Required before FIN-003 Phase C Authorize eligibility |

---

## Explicit non-claims

- Does **not** authorize FIN-003 Phase C  
- Does **not** close CORE-002 Blocker 4  
- Does **not** enable production destination charges without ops config (`PAY001_DESTINATION_FUNDING_ENABLED` + org enrollment + migration apply)  
- Does **not** implement owner transfers or allocation  
