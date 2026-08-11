# COM-002 — Risk Assessment (Amended)

**Parent:** [COM-002 Index](./index.md)  
**Status:** Approved  
**Amendments:** A1–A8 incorporated  

---

## Risks & status

| ID | Risk | Severity | Status after amendments |
|----|------|----------|-------------------------|
| R1 | SaaS vs FIN-OPS Stripe conflation | High | Mitigated — dedicated SaaS webhook |
| R2 | Half-provisioned orgs | High | Mitigated — checkpoints A5 |
| R3 | Demo escapes / cost explosion | High | Mitigated — overlay + separate DB A3 |
| R4 | Price tampering | High | Mitigated — allowlist + server unit-volume quote |
| R5 | Trial/demo abuse | Medium | Mitigated — trial only ≤500 units + card required; demo caps |
| R6 | Confirm Plan cutover confusion | Medium | Slice G messaging |
| R7 | Enterprise in Checkout | Medium | Mitigated — A6 |
| R8 | Downgrade surprise | Medium | Period-end + warn UX |
| R9 | FO oversell | High | Mitigated — A1 PM-only self-serve |
| R10 | Tax misconfig | Medium | Stripe Tax on at go-live |
| R11 | Webhook outage | Medium | Retries + reconciler |
| R12 | Account bind attacks | High | Mitigated — A2 |
| R13 | Dispute silent access | High | Mitigated — A4 fail closed |
| R14 | Unclaimed paid orgs | Medium | Day 7 suspend |

---

## Open decisions — closed by A7 / A8

| Former | Binding default |
|--------|-----------------|
| O1 Prices | Publish unit-capacity Prices before live Checkout; architecture unblocked |
| O2 Limits | **Managed units** — included 500 + Additional Unit Capacity blocks (A8) |
| O3 Trial | **30 days** if ≤500 units; **none** if >500; card required (A8) |
| O4 Grace | 7 days |
| O5 Seats / properties | **Removed** as commercial meters (A8) |
| O6 Account timing | Pay → provision → verify → access |
| O7 Tax | On at go-live |
| O8 Portal plans | In-app only |
| O9 Demo host | `demo.` separation |
| O10 CRM | External CRM + in-app lead v1 |

---

## Residual

Enterprise human work and Sev-1 commerce incidents remain. FO self-serve waits on FO-READY. Acceptable.
