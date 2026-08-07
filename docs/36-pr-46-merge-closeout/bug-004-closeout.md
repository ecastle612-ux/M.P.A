# BUG-004 Closeout — Commercial Acquisition Funnel

| Field | Value |
|-------|--------|
| Bug | Choose Modules / commercial path skipped authenticity of public funnel |
| Fix PR | [#46](https://github.com/ecastle612-ux/M.P.A/pull/46) — MERGED |
| Production SHA | `3d081ad` |
| Status | **CLOSED** |

## Resolution

Public pre-auth funnel is live:

```
/ → /modules → /pricing → /checkout (Confirm Plan) → /login?mode=sign_up
→ Guided Setup → Mission Control
```

No invented SaaS Stripe subscription checkout. Enterprise pricing and billing finalized during onboarding. FO/Complete activation honesty retained.

## Evidence

- Production verification: [production-verification-report.md](./production-verification-report.md)
- Prior package: [docs/31-bug-003-004-landing-acquisition](../31-bug-003-004-landing-acquisition/index.md)
