# 05 — Entitlements & Security

**Package:** BILL-001  
**Status:** Draft — Ready for Approval

---

## Model

```
Auth (Supabase session)
  → AuthZ (org membership + capabilities)
    → Entitlements (plan limits / feature flags)
      → Domain mutation
```

**Do not** mix authentication with billing. A user can authenticate and still be blocked by entitlements.

---

## Rules

1. Every organization owns **exactly one** non-terminal SaaS subscription (or none — then limited/no commercial features).
2. Subscriptions determine feature access via `SubscriptionService.assertEntitled(orgId, capability)`.
3. Founder grants require Master Admin capability + audit event.
4. Capabilities proposed: `saas:read`, `saas:manage`, `saas:admin` (Master Admin metrics).

---

## One-subscription invariant

Enforced at:

- DB: partial unique on `organization_id` for non-terminal statuses  
- Service: refuse second Checkout if active/trialing/past_due exists  

---

## RLS

Org members see only their org’s `saas_*` rows. Master Admin metrics use service role / elevated plane with audit.
