# 08 — Open Questions

**Package:** PAY-001  
**Status:** 📝 Draft (amended · [11](./11-architecture-amendments.md))  
**Rule:** Binding design defaults below are in force for the Draft package. **Approve** still attests commercial rates and Stripe dispute-fee confirmation. Package remains **not Approved**.

---

## Closed for design (binding defaults — see [03](./03-payment-routing.md) · [05](./05-refunds-disputes.md))

| ID | Topic | Binding design answer |
|----|-------|------------------------|
| **Q1** | Legacy platform-balance payments | **Leave on platform**; no automatic sweep; never FIN-003-transferable; monitor unexpected legacy while enrolled |
| **Q2** | Kill switch when funding off | Destination-enrolled → **hard block** (no legacy fallback). Not enrolled → legacy allowed only as transitional coexistence |
| **Q3** | Application fee schedule | **Per-org config** (bps and/or flat cents); disclosed; computed at create; ledger on succeed; not BILL-001. **Commercial rate values** still set by Finance at/before Approve |
| **Q5** | ACH pending vs available | Stripe **available** only; pending ≠ transferable; ACH returns reverse books ([05](./05-refunds-disputes.md)) |
| **Q6** | Multi-property pooling | **Accept** pooled org Express cash; property allocation is ledger-side; reconcile runbooks must not invent property Stripe sub-balances |
| **Q7** | Package ID alias | **PAY-001** governing ID; extends API-005 |
| **Q8** | Phasing inside PAY-001 | Prefer Phase A (routing+mapping+readiness) then Phase B (refunds/disputes/ACH hardening) after Approve; both required before Verified |

---

## Remaining open (Approve attestation)

### Q4 — Dispute fee liability (attestation)

| Field | Content |
|-------|---------|
| **Question** | Confirm against live Stripe Connect docs: who pays dispute fees for destination charges with `transfer_data.destination` + `application_fee_amount`? |
| **Design default** | **Platform** bears dispute fees unless Stripe docs assign to connected account ([05](./05-refunds-disputes.md)) |
| **Needed by** | Approve — Finance/Security attestation recorded in decision log |
| **Blocks Approve?** | Yes (attestation), not design direction |

### Q3b — Commercial fee rates

| Field | Content |
|-------|---------|
| **Question** | Exact bps/flat values per plan/org |
| **Design default** | Config table exists; rates are commercial inputs |
| **Needed by** | Approve / ops config before production enable |
| **Blocks design?** | No — blocks production fee disclosure honesty |

---

## Intentionally deferred (not PAY-001)

| Item | Owner |
|------|-------|
| FIN-003 compensating transfers / clawbacks after payout | FIN-003 D9 |
| Owner transfer preflight execution | FIN-003 Phase C |
| One-time Finance-approved platform→settlement migration | Future Approve amendment only |
| Non-USD / international | Future Approve |
| Destination-to-owner shortcut | FIN-003 D13 |
| Full GL / trust accounting | ADR-010 |
| Scheduled reconcile jobs | Optional post-v1 ops |

---

## Decision log (design defaults — not package Approve)

| ID | Decision | Date | Notes |
|----|----------|------|-------|
| D-PAY-001-R1 | Lock destination charge API shape | 2026-07-23 | Architecture amendments ([11](./11-architecture-amendments.md)) |
| D-PAY-001-Q1 | Legacy leave-on-platform; never transferable | 2026-07-23 | Design default |
| D-PAY-001-Q2 | Enrolled hard-block; no legacy fallback | 2026-07-23 | Design default |
| D-PAY-001-Q3 | Per-org fee config model | 2026-07-23 | Rates at Approve |
| D-PAY-001-Q5 | Available ≠ pending | 2026-07-23 | Design default |
| D-PAY-001-Q6 | Pooled settlement accepted | 2026-07-23 | Design default |
| D-PAY-001-Q4 | Platform dispute fee default pending Stripe attestation | 2026-07-23 | Approve attestation required |
