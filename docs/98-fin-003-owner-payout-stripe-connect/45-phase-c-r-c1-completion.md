# 45 — Phase C R-C1 Completion

**Package:** FIN-003 — Owner Payouts via Stripe Connect  
**Phase:** C — R-C1 exclusive execute lease  
**Completed:** 2026-07-23  
**Kickoff:** `BEGIN FIN-003 PHASE C R-C1 HARDENING`  
**Prior:** [43 — CONDITIONAL PASS](./43-phase-c-final-certification.md)

---

## Summary

R-C1 is closed with an **exclusive execution lease** on `payout_runs`. Parallel `executePayoutRun` callers cannot both hold authority while a lease is live, eliminating the concurrent M2 over-commit window. Crash recovery steals only after lease expiry; per-intent renew keeps long runs alive without deadlock. Transfer idempotency and reconciliation are unchanged.

---

## Deliverables

| Artifact | Location |
|----------|----------|
| Migration | `supabase/migrations/20260723240000_fin003_phase_c_execute_lease.sql` |
| Lease helpers | `apps/web/src/lib/owner-payouts/execute-lease.ts` |
| Execute wiring | `apps/web/src/lib/owner-payouts/transfers.ts` |
| Concurrency tests | `apps/web/src/lib/owner-payouts/phase-c-r-c1.test.ts` |
| Verification | [44-phase-c-r-c1-verification.md](./44-phase-c-r-c1-verification.md) |
| This completion | [45-phase-c-r-c1-completion.md](./45-phase-c-r-c1-completion.md) |

---

## R-C1 resolution

| Residual ([43](./43-phase-c-final-certification.md)) | Resolution |
|-----------------------------------------------------|------------|
| Soft CAS allowed parallel `running` executors | Live lease → **deny**; only one token holder |
| Concurrent M2 over-commit | Single authority ⇒ serial intent processing per run |
| Stuck `running` after crash | Steal when `execute_lease_expires_at` null/expired |
| Long batches | Renew lease (token-scoped) before each intent |

---

## Quality evidence

| Gate | Result |
|------|--------|
| Unit + concurrency tests | ✅ 44 passed |
| Typecheck | ✅ PASS |
| ESLint | ✅ PASS |
| Production build | ✅ PASS (`pnpm build` / `next build` — exit 0, 2026-07-23) |

---

## Gate status

| Item | Status |
|------|--------|
| Phase C R-C1 | ✅ **CLOSED** |
| Ready for final PASS cert | ✅ **Yes** — request independent re-cert (e.g. `46-phase-c-pass-certification.md`) |
| Phase D | 🔒 **LOCKED** — not authorized |
| Ops | Apply migration before relying on lease columns in each env |

---

## Related

- [43 — Final certification (CONDITIONAL PASS)](./43-phase-c-final-certification.md)  
- [44 — R-C1 verification](./44-phase-c-r-c1-verification.md)  
- [Implementation Gate](../00-governance/implementation-gate.md)
