# 09 — Error Handling

**Package:** ACQ-001  
**Status:** Draft — Ready for Approval

---

## Principles

1. Fail closed on money and tenancy — never create org without successful payment / Trial activation.  
2. Fail open on UX — always give a next step (retry, login, support).  
3. Idempotent provision — webhook retries must not duplicate orgs.  
4. No raw Stripe/stack traces on public pages.

---

## Recovery matrix

| Failure | Customer sees | System | Next step |
|---------|---------------|--------|-----------|
| Card declined | Stripe message | No org | Retry payment |
| Checkout canceled | Canceled page | No org | Return to pricing |
| Session expired | Error/expired page | No org | New Checkout |
| Webhook delayed | Success “provisioning” | Retry worker / Stripe retry | Poll; support after N minutes |
| Provision ledger conflict | Delayed/failed | Alert ops | Support; manual COM/AUTH recovery |
| Welcome email bounce | Success + “check spam / resend” | Delivery status | Resend credentials (AUTH) |
| First-login token expired | Login error | — | Resend / password reset |
| Duplicate open subscription | Blocked Checkout | Enforce one-sub | Log in → Billing |
| Enterprise Checkout attempted | Soft block | API reject | Contact Sales |
| Rate limit / abuse | Generic error | WAF / rate limit | Retry later |

---

## Support handoff

Public pages expose:

- Help email / contact  
- “Already paid? Log in”  
- Status correlation id on delayed provision (safe opaque id)

Staff use COM timeline + SaaS audit + AUTH recovery tools — no new backoffice required for ACQ V1.
