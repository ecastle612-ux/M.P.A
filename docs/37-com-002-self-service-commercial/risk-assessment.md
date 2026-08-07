# COM-002 — Risk Assessment

**Parent:** [COM-002 Index](./index.md)  
**Status:** Draft  

---

## Risks

| ID | Risk | Severity | Mitigation |
|----|------|----------|------------|
| R1 | Conflating SaaS Stripe with FIN-OPS resident Stripe | High | Hard metadata boundary; separate handlers; cert regression |
| R2 | Half-provisioned orgs after payment | High | Idempotent jobs; success polling; reconciler; alerts |
| R3 | Demo escapes into production | High | Isolated data plane; separate secrets; automated isolation test |
| R4 | Entitlement fraud / client price tampering | High | Server allowlist of Prices; webhook as truth |
| R5 | Abuse of trials / demos | Medium | Carded trials; rate limits; CAPTCHA |
| R6 | Customer confusion vs interim Confirm Plan | Medium | Clear launch messaging; feature flag cutover |
| R7 | Enterprise buyers forced through Checkout | Medium | Distinct CTAs; plan page Enterprise path |
| R8 | Downgrade data surprise | Medium | Fail closed modules; retain data; warn UX |
| R9 | Scope creep into Capital / FO features | Medium | Hard stops in index; slice reviews |
| R10 | Tax/VAT misconfiguration | Medium | Stripe Tax; commercial review before live |
| R11 | Webhook outage | Medium | Retries; reconciler; status page |
| R12 | Multi-org account bind conflicts | Low–Med | Explicit bind policy at Approve |

---

## Open decisions (must resolve at Approve)

| # | Decision | Options |
|---|----------|---------|
| O1 | Public price amounts | Set Professional / Business monthly & annual |
| O2 | Seat & property limits per tier | Numeric caps |
| O3 | Trial length & card requirement | e.g. 14 days + card |
| O4 | Past-due grace length | e.g. 3–7 days |
| O5 | Seat model | Stripe quantity vs flat tier |
| O6 | Account-before-pay vs pay-before-account | Package recommends pay-before-account |
| O7 | Stripe Tax go-live timing | With Slice C or later |
| O8 | Customer Portal plan switching vs in-app only | Prefer in-app catalog control |
| O9 | Demo hosting | Same app route vs subdomain |
| O10 | Enterprise CRM | External vs in-app leads only for v1 |

---

## Residual risk after certification

Automation never eliminates support entirely. Target: **human time concentrates on Enterprise and Sev-1 commerce incidents**, not routine Pro/Business onboarding.
