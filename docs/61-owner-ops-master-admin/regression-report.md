# Regression Report — Owner Operations Master Admin

**Date:** 2026-08-10

## Scope of change

Master Admin / Owner Operations only. Customer-facing product surfaces were not redesigned.

## Protected surfaces (must remain unchanged)

- Property Manager workspaces
- Facility Operations workspaces
- Resident / tenant portal
- Mission Control customer UX
- Commercial public catalog / Stripe Checkout
- Provisioning engine semantics (extended with claim-link regenerate only)
- Document Intelligence customer flows
- Reporting
- Authentication login/reset UX

## Expected regressions to watch on LIVE

| Area | Check |
|---|---|
| Operator gate | Non-operators still redirected from `/admin` |
| Command Center load | Metrics still render with service-role / auth fallback |
| Org directory | Links open profiles; back-nav works |
| View As | Banner appears; exit clears cookies; read-only blocks customer API writes |
| Middleware `/api` | Public webhooks still succeed (no auth redirect for `/api`) |
| Planned workspaces | Show Not yet available, not Next 404 |
| Feature freeze | No leasing / screening / capital projects code paths introduced beyond support read models |

## Test plan before Owner LIVE acceptance

1. Operator login → `/admin` health + search  
2. Open org profile → resend invite (pending) / regenerate claim (non-ready)  
3. Start View As as Property Manager → banner → attempt mutation → blocked → Exit  
4. Click every Master Admin nav item → no 404  
5. Confirm PM/FO/Resident routes still behave for normal customers
