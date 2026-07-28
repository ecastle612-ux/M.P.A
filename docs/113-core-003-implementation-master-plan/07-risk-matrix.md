# 07 — Risk Matrix

**Package:** CORE-003

Likelihood × Impact scored **1–5**. **Score** = L × I. Ranked highest first among in-scope units.

---

## Matrix

| ID | Unit | L | I | Score | Category | Mitigation |
|----|------|---|---|-------|----------|------------|
| R1 | FIN-003 Phase C | 3 | 5 | 15 | Money / custody | PAY-001 Verified; Phase C prerequisites P1–P10; dual control; kill switch; no parallel transfer paths |
| R2 | AUTH-001 Slice A | 3 | 5 | 15 | Identity | Feature flag login path; session cert suite; no public signup; staged rollout |
| R3 | PAY-001 remainder / Verified | 3 | 5 | 15 | Money / custody | Destination-charge cert; no FIN-C until A1–A21 |
| R4 | OPS-001 Slice A | 3 | 4 | 12 | Platform contract | Freeze event envelope early; versioned topics; migration plan before broad emitters |
| R5 | AUTH-001 Slice B + COM-001 A handoff | 3 | 4 | 12 | Provisioning | Single idempotency key; Won↛org without Payment Successful; audit every provision |
| R6 | PMX-004 Phase 7 offline | 3 | 4 | 12 | Client reliability | Package rollback; scoped outbox; never cache auth HTML aggressively |
| R7 | PMX-004 Phase 1 Final PASS gap | 4 | 3 | 12 | Evidence / ops | Device lab schedule; treat as M1 exit; do not claim native COMPLETE |
| R8 | OPS-001 Slice D (AI/auto) | 3 | 4 | 12 | Automation blast | Human-in-loop defaults; kill switches; dry-run mode |
| R9 | AUTH-001 Slice E recovery | 2 | 5 | 10 | Privileged access | Master Admin only; immutable audit; dual approval for L3 |
| R10 | OPS-001 Slice B notify | 3 | 3 | 9 | Spam / trust | Preference center; rate limits; reuse API-001/EML-001 |
| R11 | COM-001 Slice D offboarding | 2 | 4 | 8 | Data retention | No surprise purge; export-first; legal hold hooks |
| R12 | UX-012 Slice C false-done | 3 | 2 | 6 | Product claim | Block “Command Center COMPLETE” until OPS-E data |
| R13 | UX-012 Slice A/B | 2 | 2 | 4 | Visual debt | Token-only; design review gate |

---

## Highest risk (executive)

1. **Money path** — PAY-001 → FIN-003 C  
2. **Identity** — AUTH-A (and B handoff)  
3. **Event bus** — OPS-A  
4. **PWA offline / SW** — PMX evidence + Phase 7  

---

## Regression blast radius

| Change area | Likely collateral |
|-------------|-------------------|
| AUTH login | All portals, PMX standalone, push deep links |
| OPS bus | Every module emitter/consumer |
| FIN transfer | Owner portal financials, Stripe webhooks, settlement balances |
| PMX SW | Offline, push, install, update UX |
| UX tokens | Global visual regressions |

---

## Rollback posture by tier

| Tier | Units | Rollback |
|------|-------|----------|
| Critical | FIN-C, AUTH-A/B, PAY | Feature flags + provider kill switches; prefer forward-fix with freeze over silent revert of ledger |
| High | OPS-A/B/C/D, PMX-7, AUTH-E | Versioned contracts; dual-run old path briefly |
| Med | COM slices, UX-C/D, PMX-2–4 | Standard deploy revert |
| Low | UX-A/E polish | Revert CSS/tokens |
