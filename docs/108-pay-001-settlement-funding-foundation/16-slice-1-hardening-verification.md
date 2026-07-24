# 16 — Slice 1 Hardening Verification

**Package:** PAY-001 — Settlement Funding Foundation  
**Slice:** 1 hardening (cert remediation only)  
**Date:** 2026-07-23  
**Source:** [15 — Slice 1 certification](./15-slice-1-certification.md) (**CONDITIONAL PASS**)  
**Authority:** Does **not** begin Slice 2 · does **not** mark full PAY-001 Verified · does **not** authorize FIN-003 Phase C

---

## Scope

Implement **only** certification corrections required to elevate Slice 1 from CONDITIONAL PASS toward PASS. No Slice 2 features (refunds, disputes, ACH automation).

---

## Conditions addressed

| ID | Condition | Remediation |
|----|-----------|-------------|
| **C1** | No destination fiction without live `transfer_data` | `evaluateDestinationProviderCapability`; enrolled orgs hard-block with `destination_provider_incapable` when provider cannot apply destination; noop + keyless Stripe **reject** `destinationRouting`; fee ledger only after verified confirm |
| **C2** | Production config lock | Capable only when `PAYMENT_PROVIDER=stripe` + `STRIPE_SECRET_KEY` + `PAY001_DESTINATION_FUNDING_ENABLED` |
| **C3** | Adapter / settle re-bind | `verifyDestinationSettlementForConfirm` re-checks org `org_settlement` acct; retrieve Stripe PI `transfer_data.destination` when `pi_` + secret present; refuse confirm on mismatch/missing |
| **C4** | Mapping durability | Persist mapping **before** Stripe create; update after create; mark `failed` if create throws |
| **C5** | A21 alert honesty | Attempt metadata always records `destinationEnrolled` from settings (boolean); alert fires on `legacy_platform` + `destinationEnrolled === true` |
| **C6** | Ops attestation | Unchanged — Q3b / Q4 still required before production enable (docs) |

---

## Related findings closed

| Finding | Status |
|---------|--------|
| A-1 sandbox/noop destination fiction | ✅ Closed — refuse destination path |
| A-2 provider trust (partial) | ✅ Improved — settle re-bind + optional Stripe assert |
| A-3 mapping after create | ✅ Closed — pre-create mapping |
| M-1 invented Connect corpus | ✅ Closed for noop/keyless |
| M-5 dead A21 alert | ✅ Closed |
| M-3 settle without destination assert | ✅ Closed when PI id + secret available |

---

## Explicitly out of scope (not Slice 2)

| Item | Status |
|------|--------|
| Refund / dispute / ACH automation | Not implemented |
| Full A1–A21 package Verified | Not claimed |
| FIN-003 Phase C | Locked |

---

## Quality gates

| Gate | Result |
|------|--------|
| Unit tests | ✅ PASS (22) — capability flags, live payload/`transfer_data`, missing destination routing, noop refusal, keyless refusal, S8 mismatch, S6/S7 flags |
| Typecheck | ✅ PASS |
| ESLint (touched files) | ✅ PASS |
| Production build | ✅ PASS |

---

## Production enable checklist (still required)

| Check | Required |
|-------|----------|
| Migration applied | Yes |
| `PAYMENT_PROVIDER=stripe` | Yes |
| `STRIPE_SECRET_KEY` set | Yes |
| `PAY001_DESTINATION_FUNDING_ENABLED=true` | Yes |
| Org `destination_enrolled` + `funding_enabled` | Yes |
| Org settlement Connect ready (S1–S5) | Yes |
| Q3b fee rates recorded | Yes (ops) |
| Q4 dispute-fee attestation | Yes (ops) |

---

## Verdict (hardening pass)

| Field | Result |
|-------|--------|
| Hardening implementation | ✅ Complete for C1–C5 code conditions |
| Ready for final PASS re-certification | ✅ **Yes** — certification findings C1–C5 addressed; C6 remains ops attestation |
| Slice 2 | 🔒 Locked |
