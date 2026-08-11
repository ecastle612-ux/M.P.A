# Vercel Support Request Draft — DO NOT SUBMIT FROM AGENT

**Status:** Draft only. Owner (or authorized operator) may paste into Vercel Support.  
**Agent must not submit this ticket.**  
**No secrets below** (no Stripe secret keys, webhook secrets, or credentials).

---

## Subject

Production environment variables show NEW in Dashboard but OLD/WRONG values are injected into every new Production deployment

---

## Body (paste-ready)

Hello Vercel Support,

We need help investigating a Production environment-variable snapshot / injection mismatch on one project.

### Project

- Name: `m-p-a-web`
- Project ID: `prj_pZn4nRYNDeN4AlVz1RZqY4L8tfjL`
- Team ID: `team_Dh1s7cYC7PuAc0PioeJqS80q`
- Team slug: `ecastle612-uxs-projects`
- Production domains: `www.my-property-assistant.com`, `my-property-assistant.com`, `m-p-a-web.vercel.app`
- All three domains correctly map to this project’s current Production deployment.

### Affected Production deployments

All of the following are Production deployments of `m-p-a-web` and received the same OLD/WRONG runtime `STRIPE_PRICE_*` map:

1. `dpl_2o619PF678iM8CxXKAEAtTR4RbBN` — completed ~`2026-08-11T01:31:31Z`
2. `dpl_6zLALiQLDKskpqva9ssgMGBTbukf` — completed ~`2026-08-11T02:01:10Z`
3. `dpl_2kbmwcrEg1sCR41CJNUBWg9CFx3y` — completed ~`2026-08-11T02:12:39Z` (**current live**)

### What the Dashboard shows

The Owner has confirmed via Reveal that the **existing** Production environment variable rows for these eight keys contain the **NEW** authorized Stripe Price IDs:

- `STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY`
- `STRIPE_PRICE_PM_PROFESSIONAL_ANNUAL`
- `STRIPE_PRICE_PM_BUSINESS_MONTHLY`
- `STRIPE_PRICE_PM_BUSINESS_ANNUAL`
- `STRIPE_PRICE_FO_PROFESSIONAL_MONTHLY`
- `STRIPE_PRICE_FO_PROFESSIONAL_ANNUAL`
- `STRIPE_PRICE_COMPLETE_PROFESSIONAL_MONTHLY`
- `STRIPE_PRICE_COMPLETE_PROFESSIONAL_ANNUAL`

We are **not** asking Support to change these values in this ticket. We need an explanation of injection, then a precise fix.

### What Production runtime receives

On every new Production deployment above (including the live deployment created **after** the Owner confirmed Dashboard NEW values), the application’s Node `process.env` for those keys still resolves as:

- PM Professional monthly/annual: **OLD** Price IDs (prior catalog amounts)
- PM Business monthly: **WRONG** value shaped like a Stripe webhook endpoint id (`we_…`), not a `price_…`
- PM Business annual: **WRONG** literal string equal to the environment variable **name**
- FO / Complete display amounts: still the **OLD** amount class

This is observable via our public catalog endpoint and Checkout Session creation against Production (no customer subscription migration involved).

### What we have already ruled out

- Wrong project / wrong domain mapping
- Application hard-coded Price IDs or repository fallbacks on the serving SHA (`process.env["STRIPE_PRICE_*"]` only)
- GitHub Actions Stripe Price overrides (CI workflow has none)
- Unrelated PR #115 (not Stripe/pricing; not deployed)
- Cloud Agent / local `.env` / `.cursor/environment.json` affecting Vercel
- “Forgot to redeploy” — multiple **new** Production deployments were created after Dashboard work; the latest was explicitly after Owner confirmation of NEW values

Per your docs, environment variable changes apply only to **new** deployments. These deployments are new, yet they still receive the OLD/WRONG map.

### Requested investigation

Please inspect and report:

1. All project-level and team Shared environment variable rows for the eight `STRIPE_PRICE_*` keys (`id`, `target`, `type`, `createdAt`, `updatedAt`, Sensitive flag, linked projects).
2. The effective environment map for those keys on deployments `dpl_2o619…`, `dpl_6zLA…`, and `dpl_2kbmwcr…`.
3. Why Dashboard Production Reveal shows NEW while new Production deployments continue to inject OLD/WRONG values into `process.env`.
4. The single recommended corrective action on the platform side (preferably without requiring us to re-enter the eight values again).

Internal evidence package path (our repo docs):  
`docs/65-production-pricing-migration-preparation/vercel-environment-snapshot-escalation.md`

Thank you.

---

## Agent notes

- Do **not** attach Stripe secret keys, webhook secrets, or API tokens to the ticket.
- Do **not** redeploy or mutate env vars as part of opening the ticket.
- Owner action for variables: **NO VERCEL VARIABLE CHANGES REQUIRED** until Support advises.
