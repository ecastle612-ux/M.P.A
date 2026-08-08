# Infrastructure Verification Policy

**Status:** Binding  
**Established:** 2026-08-08  
**Parent:** [Implementation Gate](./implementation-gate.md)  

---

## Rule

Do **not** repeatedly request manual confirmation for infrastructure that has already been configured.

Assume the following remain valid unless implementation introduces **new** required variables or proof of failure:

- Vercel environment variables  
- Supabase secrets  
- Stripe secrets  
- Stripe webhooks  

## When to stop for operator action

Stop only when one of these is true:

1. A **brand-new** environment variable is introduced.  
2. A **new** database migration must be applied.  
3. Existing infrastructure is **proven** missing or invalid (runtime/config error, failed webhook delivery, failed deploy for missing secret, etc.).

## When not to stop

- Re-asking for secrets already supplied earlier in the program  
- Re-confirming Vercel/Stripe/Supabase configuration that has not changed  
- Speculative “please verify Production still has X” without evidence of failure  

## Reporting language

When infrastructure was previously configured and is not being re-requested, mark it explicitly:

```
Previously configured — not re-requested.
```

## Related

- [Implementation Gate](./implementation-gate.md)  
- [45 COM-002 Production Integration](../45-com-002-production-integration/index.md)  
