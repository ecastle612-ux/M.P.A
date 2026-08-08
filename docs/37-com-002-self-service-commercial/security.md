# COM-002 — Security

**Parent:** [COM-002 Index](./index.md)  
**Status:** Approved  
**Amendments:** A2, A3, A6  

---

## Threat mitigations (binding)

| Threat | Mitigation |
|--------|------------|
| Forged webhooks | Dedicated SaaS endpoint + signature verify |
| FIN-OPS cross-talk | Separate endpoint from resident payments |
| Checkout email takeover | No module session until verified bind (A2) |
| Price tampering | Server Price allowlist |
| Enterprise Checkout leak | Reject non–self-serve offers at Session create (A6) |
| Demo → prod leak | Separate demo DB/project; separate secrets (A3) |
| Demo scrape/abuse | Caps, CAPTCHA, uploads off, sweeper |
| Trial abuse | No self-serve trials (A7) |
| Duplicate provision | Idempotency + unique session id |
| Operator abuse | Audited Enterprise provision |

---

## Secrets

Stripe secret + SaaS webhook secret + demo signing keys — server only; demo keys ≠ production.

---

## Entitlement integrity

Client cannot self-assign SKU. Plan changes via verified Stripe updates or audited Enterprise ops. Fail closed nav/API.

---

## Auth

Post-Checkout: verify email before `owner_bound`. Soft verify windows that grant modules are **forbidden**.
