# Risk Assessment (Architecture Review) — COM-002

Supplements COM-002’s own risk list with reviewer-identified risks.

---

## Critical / High

| ID | Risk | Why COM-002 underestimates it | Mitigation (amendment) |
|----|------|-------------------------------|------------------------|
| RV1 | Self-serve FO/Complete oversell | Module activation ≠ feature completeness | **A1** catalog honesty gate |
| RV2 | Account bind takeover | Pay-before-account without hard verify | **A2** |
| RV3 | Demo cost explosion | Per-session clone ambiguity | **A3** |
| RV4 | Provisioning partial failure without compensation | Retry ≠ rollback checkpoints | **A5** |
| RV5 | FIN-OPS webhook cross-talk | Metadata-only routing fragile | Separate SaaS endpoint |
| RV6 | Chargeback silent access | Journey missing | **A4** |

---

## Medium

| ID | Risk | Mitigation |
|----|------|------------|
| RV7 | 12-price catalog ops error | Catalog service + deploy allowlist |
| RV8 | Enterprise leakage into Checkout | **A6** technical forbid |
| RV9 | Dunning under-communication | Define cadence |
| RV10 | CX abandonment from 3-axis funnel | Simplify default path |
| RV11 | Soft pause ambiguity | Explicit in/out |
| RV12 | Unclaimed paid orgs | TTL + suspend policy |

---

## Open decisions — reviewer’s required defaults

| Decision | Required before Approve | Suggested default |
|----------|-------------------------|-------------------|
| O2 Limits | **Yes** | Pro: e.g. seats/properties caps documented as placeholders with enforcement hooks |
| O5 Seats | **Yes** | Flat included seats; upgrade tier for more |
| O6 Account timing | **Yes** | Keep pay-before-account **with** A2 controls |
| O1 Prices | Before Slice C live | Commercial confidential OK at Approve if ranges exist |
| O3 Trial | Before Slice C | 14 days + card |
| O4 Grace | Before Slice E | 7 days |
| O7 Tax | Before live money | Stripe Tax on for US launch minimum |
| O8 Portal plans | Before Slice F | In-app plan changes only |
| O9 Demo host | Before Slice B | Subdomain `demo.` preferred |
| O10 CRM | Before Enterprise scale | External CRM + in-app lead capture v1 |

---

## Residual

Even a perfect COM-002 leaves Enterprise human work and support edge cases. That is acceptable. Selling unfinished FO via automation is not.
