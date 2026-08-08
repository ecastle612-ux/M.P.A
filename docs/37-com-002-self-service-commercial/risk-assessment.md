# COM-002 — Risk Assessment (Amended)

**Parent:** [COM-002 Index](./index.md)  
**Status:** Approved  
**Amendments:** A1–A7 incorporated  

---

## Risks & status

| ID | Risk | Severity | Status after amendments |
|----|------|----------|-------------------------|
| R1 | SaaS vs FIN-OPS Stripe conflation | High | Mitigated — dedicated SaaS webhook |
| R2 | Half-provisioned orgs | High | Mitigated — checkpoints A5 |
| R3 | Demo escapes / cost explosion | High | Mitigated — overlay + separate DB A3 |
| R4 | Price tampering | High | Mitigated — allowlist |
| R5 | Trial/demo abuse | Medium | Mitigated — no trials; demo caps |
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

## Open decisions — closed by A7

| Former | Binding default |
|--------|-----------------|
| O1 Prices | Publish before Slice C live (amounts commercial); architecture unblocked |
| O2 Limits | Pro 5/25 · Business 25/150 |
| O3 Trial | **None** self-serve |
| O4 Grace | 7 days |
| O5 Seats | Flat included — not metered |
| O6 Account timing | Pay → provision → verify → access |
| O7 Tax | On at go-live |
| O8 Portal plans | In-app only |
| O9 Demo host | `demo.` separation |
| O10 CRM | External CRM + in-app lead v1 |

---

## Residual

Enterprise human work and Sev-1 commerce incidents remain. FO self-serve waits on FO-READY. Acceptable.
