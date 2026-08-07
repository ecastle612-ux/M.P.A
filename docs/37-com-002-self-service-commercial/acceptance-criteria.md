# COM-002 — Acceptance Criteria (Amended)

**Parent:** [COM-002 Index](./index.md)  
**Status:** Draft  

---

## Package acceptance (Approve gate)

| # | Criterion | Met? |
|---|-----------|------|
| D1 | Self-serve, demo, Enterprise journeys non-conflicting; Enterprise before Checkout | Yes (A6) |
| D2 | SaaS vs FIN-OPS boundary + dedicated webhook | Yes |
| D3 | Pro/Business automated; Enterprise human | Yes |
| D4 | Demo overlay scale model | Yes (A3) |
| D5 | Slices A–G testable | Yes |
| D6 | No Capital Projects | Yes |
| D7 | ADR-018 Proposed + amendments incorporated | Yes |
| D8 | A1 honesty — PM-only self-serve until FO-READY | Yes |
| D9 | A2 identity binding documented | Yes |
| D10 | A4 lifecycle complete (incl. SCA/dispute/invite/transfer/pause=out) | Yes |
| D11 | A5 provisioning checkpoints + compensation | Yes |
| D12 | A7 binding defaults (no TBD architecture) | Yes |

---

## Implementation acceptance (post-slices — summary)

| # | Criterion |
|---|-----------|
| S1 | PM Pro/Business Checkout works |
| S2 | FO/Complete cannot Checkout until FO-READY |
| S3 | Enterprise never hits Checkout Session create |
| S4 | Provisioning checkpoints + no access before verify |
| S5 | Demo overlay isolation proven |
| S6 | Lifecycle: fail, SCA, dispute, cancel, reactivate, invite |
| S7 | Portal + in-app Billing |
| S8 | FIN-OPS regression Pass |
| S9 | No customer-visible engineering jargon |
