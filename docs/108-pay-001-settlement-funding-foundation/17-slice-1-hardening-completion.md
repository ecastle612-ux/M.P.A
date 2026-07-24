# 17 — Slice 1 Hardening Completion

**Package:** PAY-001 — Settlement Funding Foundation  
**Completed:** 2026-07-23  
**Trigger:** [15](./15-slice-1-certification.md) CONDITIONAL PASS → harden C1–C5  
**Slice 2:** 🔒 Not started

---

## Summary

Slice 1 hardening closes the certification money-safety gaps that blocked an unconditional PASS: noop/keyless providers can no longer invent destination settlement books; destination confirmation requires org settlement re-bind (and Stripe destination when retrievable); enrollment is recorded explicitly for the legacy-while-enrolled alert; mapping is persisted before create.

---

## Files touched

### Created

| File | Purpose |
|------|---------|
| `apps/web/src/lib/settlement-funding/capability.ts` | C1/C2 live destination capability gate |
| `docs/.../16-slice-1-hardening-verification.md` | Hardening verification |
| `docs/.../17-slice-1-hardening-completion.md` | This closeout |

### Modified

| File | Change |
|------|--------|
| `settlement-funding/service.ts` | Provider incapability hard-block; verify-before-confirm |
| `settlement-funding/contracts.ts` | `destination_provider_incapable` |
| `settlement-funding/index.ts` | Export capability + verify helpers |
| `settlement-funding/settlement-funding.test.ts` | Expanded cert coverage |
| `payments/stripe-provider.ts` | Refuse keyless destination; export payload builder + PI destination retrieve |
| `payments/noop-provider.ts` | Refuse destinationRouting |
| `payments/noop-provider.test.ts` | Align with C1 refusals |
| `billing/server.ts` | providerId gate; pre-create mapping; `destinationEnrolled` metadata; verified fee/confirm; A21 alert |

---

## Certification findings resolved

| ID | Resolved? |
|----|-----------|
| C1 | ✅ |
| C2 | ✅ |
| C3 | ✅ |
| C4 | ✅ |
| C5 | ✅ |
| C6 | ⏳ Ops (Q3b/Q4) — not a code defect |

---

## Quality evidence

| Gate | Result |
|------|--------|
| Unit tests | ✅ 22 passed |
| Typecheck | ✅ PASS |
| ESLint (touched) | ✅ PASS |
| Production build | ✅ PASS |

---

## Gate status

| Item | Status |
|------|--------|
| PAY-001 Approved | ✅ |
| Slice 1 | ✅ COMPLETE + **HARDENED** |
| Ready for final PASS certification review | ✅ **Yes** |
| Slice 2+ | 🔒 LOCKED |
| PAY-001 Verified (A1–A21) | ❌ Not yet |
| FIN-003 Phase C | 🔒 LOCKED |

---

## Recommended next governance step

Independent re-read of [15](./15-slice-1-certification.md) conditions against this hardening pass; if satisfied, record **Slice 1 PASS** (amend [15] or add `18-slice-1-pass.md`). Do **not** begin Slice 2 until explicitly authorized.
