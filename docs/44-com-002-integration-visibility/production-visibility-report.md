# Production Visibility Report

**Domain:** `https://www.my-property-assistant.com`  
**Checked:** 2026-08-08  
**Production SHA:** `81521ab`

## Live public route probe

| Route | HTTP | Visible today | COM-002 expectation (Slice E tip) |
|-------|------|---------------|-----------------------------------|
| `/` | 200 | Enterprise landing (PR #46) | Same + COM-002 nav/CTAs (demo/enterprise) |
| `/modules` | 200 | Choose Modules | Catalog-backed modules |
| `/pricing` | 200 | Pricing | Catalog offers / PM self-serve honesty |
| `/checkout` | 200 | Confirm Plan → account create | Confirm Plan → **Stripe Checkout** |
| `/demo` | **404** | Missing | Live Demo Platform (Slice B) |
| `/enterprise` | **404** | Missing | Enterprise contact / motion (Slice A+) |
| `/login` | 200 | Sign-in | + commerce claim handoff (Slice D) |
| `/commerce/continue` | **404** | Missing | Provisioning continue (Slice D) |
| `/checkout/success` | n/a on main | Missing | Stripe success (Slice C) |

## Current public routes on production (`main`)

```
/
/modules
/pricing
/checkout
/login
(+ authenticated app routes behind auth)
```

## Current production routes that look “commercial” but are not COM-002

- Landing product cards and Confirm Plan funnel from **BUG-003/004 / PR #46**
- “Enterprise” appears as **copy / intent links**, not as `/enterprise` page
- Checkout CTA creates **account**, does **not** start Stripe SaaS Checkout

## Why customers do not see COM-002

1. **Unmerged code** — Slices A–E not on `main`  
2. **Not a feature-flag hide** — `COM_002_FLAGS` file does not exist on `main` at all  
3. **Not a middleware block for marketing** — routes simply are not present  
4. **Not a wrong domain** — `www` is served by Production `m-p-a-web` successfully at `81521ab`  
5. Vercel Preview failures on COM-002 PRs do **not** block Production; they only affect PR previews

## After merge — visibility checklist (to re-run)

| Surface | Expected |
|---------|----------|
| Enterprise landing | Updated CTAs including Demo / Enterprise |
| Expanded feature catalog | `/modules` |
| Product comparison / pricing | `/pricing` |
| Confirm Plan | `/checkout` → Stripe when SaaS prices configured |
| Live Demo | `/demo` **200** |
| Enterprise contact | `/enterprise` **200** |
| Provisioning handoff | `/commerce/continue` after paid Checkout |

## Success definition (user)

Opening `www.my-property-assistant.com` shows the COM-002 commercial experience (including Demo + Enterprise surfaces), not only the PR #46 Confirm Plan funnel.
