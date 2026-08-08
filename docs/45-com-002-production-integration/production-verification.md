# Production Verification — COM-002 on live www

**Checked:** 2026-08-08 (post deploy `097a1a7`)  
**Domain:** `https://www.my-property-assistant.com`

## Deploy

| Check | Result |
|-------|--------|
| Merge to `main` | Pass — `097a1a7` includes `14d5fa5` |
| `Production – m-p-a-web` | **success** (`5804016617`) |
| Production SHA matches merge | Pass — `097a1a7` |

## Public routes (no 404s)

| Route | HTTP | Signals |
|-------|------|---------|
| `/` | 200 | Live Demo, Enterprise, Confirm Plan, Property Manager |
| `/modules` | 200 | Choose Modules |
| `/pricing` | 200 | Pricing |
| `/checkout` | 200 | Confirm Plan |
| `/demo` | 200 | Live Demo |
| `/enterprise` | 200 | Request Enterprise / Contact |
| `/commerce/continue` | 200 | Preparing your workspace / Automatic provisioning |
| `/checkout/success` | 200 | Purchase Successful |
| `/checkout/cancel` | 200 | Checkout Canceled |
| `/login` | 200 | Sign-in |

## Landing CTAs now present

- `/demo`
- `/enterprise?intent=…`
- `/modules`, `/pricing`, `/checkout?intent=mpa_property_manager`

## Visibility verdict

**Pass for public commercial experience.**  
www now reflects COM-002 landing, demo, acquisition funnel, enterprise routing, and provisioning entry surfaces.

## Remaining non-UI gaps

See [migration-and-environment.md](./migration-and-environment.md):

- SaaS Stripe / Vercel / Supabase secrets: **Previously configured — not re-requested.**  
- COM-002 C/D/E SQL migrations: **new migrations** — apply in order when not yet applied to production DB.
