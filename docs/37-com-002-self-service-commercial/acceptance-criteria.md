# COM-002 — Acceptance Criteria

**Parent:** [COM-002 Index](./index.md)  
**Status:** Draft  

---

## Package-level acceptance (before Approve)

| # | Criterion |
|---|-----------|
| D1 | Journeys for self-serve, demo, and Enterprise are documented and non-conflicting |
| D2 | SaaS Stripe vs FIN-OPS resident Stripe boundary is explicit |
| D3 | Professional / Business automated; Enterprise human path explicit |
| D4 | Demo isolation and conversion rules documented |
| D5 | Slices A–G are independently testable with entry/exit criteria |
| D6 | No Capital Projects scope creep |
| D7 | ADR-018 Proposed and linked |

---

## Implementation acceptance (after slices — summary)

### Self-service

| # | Criterion |
|---|-----------|
| S1 | Customer can select Product → Plan → Cycle → pay via Stripe Checkout |
| S2 | Successful payment/trial creates org + entitlements with zero operator action |
| S3 | Customer reaches Guided Setup then Mission Control |
| S4 | Failed payment does not grant modules |
| S5 | Upgrade/downgrade/cancel/reactivate work without operators |
| S6 | Customer Portal reachable from Billing |
| S7 | No customer-visible engineering jargon |

### Demo

| # | Criterion |
|---|-----------|
| M1 | Three product demos runnable without account/payment |
| M2 | Role switch works; reset restores snapshot |
| M3 | Demo data cannot read/write production |
| M4 | Convert CTA carries product into subscribe flow |

### Enterprise

| # | Criterion |
|---|-----------|
| E1 | Request Enterprise does not enter Checkout |
| E2 | Lead notifies sales |
| E3 | Operator can provision Enterprise org with audit |

### Integrity

| # | Criterion |
|---|-----------|
| I1 | Webhooks signature-verified and idempotent |
| I2 | FIN-OPS resident webhooks unaffected |
| I3 | Capital Projects still not sold |
| I4 | Master Admin remains non-SKU |

---

## Certification gate

Slice G may certify only when S1–S7, M1–M4, E1–E3, I1–I4 pass in a production-like environment.
