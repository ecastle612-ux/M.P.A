# M.P.A. VERCEL ENVIRONMENT SNAPSHOT INVESTIGATION — 2026-08-11

**Mode:** Investigation only.  
**Production changes:** NONE  
**Deployment changes:** NONE  
**Env mutations:** NONE  
**Stripe / subscription / application code changes:** NONE  

Constraints honored: no Owner re-edit request for the eight Production Price variables; no create/delete of Vercel vars; no deploy.

---

## Live vs cited deployment

The prompt cites Production as `dpl_6zLALiQLDKskpqva9ssgMGBTbukf` / SHA `520f7c5`.

**Live Production right now** (re-verified this investigation):

| Field | Value |
|-------|--------|
| Deployment | `dpl_2kbmwcrEg1sCR41CJNUBWg9CFx3y` |
| SHA | `e3f6e83d9663a4629fd96acedef23b4b5e40a7d0` |
| Vercel status completed | `2026-08-11T02:12:39Z` |
| GitHub Production deployment created | `2026-08-11T02:12:40Z` |

`dpl_6zLA…` is the **prior** Production deployment for SHA `520f7c5` (completed `02:01:10Z`). Runtime fingerprints for that deployment (when it was aliased to www) and for live `dpl_2kbmwcr` are the **same OLD/WRONG class**.

---

## Dashboard vs runtime (confirmed)

**Dashboard Production values:** CONFIRMED NEW (Owner Reveal — do not re-edit).

**Current runtime values** (www → `dpl_2kbmwcr`, probed `2026-08-11T02:19Z`–`02:22Z` UTC):

| Key / offer | Runtime |
|-------------|---------|
| PM Professional Monthly | `price_1Tw3Cb8jGrZYUXDtQwHvaXFW` ($99) |
| PM Professional Annual | `price_1Tw3Cc8jGrZYUXDtoMZ4ypxU` ($990) |
| PM Business Monthly | `we_1Tw3Cg8jGrZYUXDtp2lv6gY0` (Stripe webhook endpoint id) |
| PM Business Annual | literal `STRIPE_PRICE_PM_BUSINESS_ANNUAL` |
| Catalog FO / Complete display | still $99 / $149 class (old display Price envs) |

Checkout proof (live www, no charge beyond creating Checkout Session):

- Professional monthly session line item → `price_1Tw3Cb8jGrZYUXDtQwHvaXFW`
- Business monthly → `502 No such price: 'we_1Tw3Cg8jGrZYUXDtp2lv6gY0'`
- Business annual → `502 No such price: 'STRIPE_PRICE_PM_BUSINESS_ANNUAL'`

---

## 1. Vercel deployment timeline (no guessing)

| Event | `dpl_2o619…` (`8d7485c`) | `dpl_6zLA…` (`520f7c5`) | `dpl_2kbmwcr…` (`e3f6e83`, live) |
|-------|--------------------------|-------------------------|----------------------------------|
| Git commit time (UTC) | `2026-08-11T01:30:31Z` | `2026-08-11T02:00:10Z` | `2026-08-11T02:11:47Z` |
| Vercel GitHub status “Deployment has completed” | `2026-08-11T01:31:31Z` | `2026-08-11T02:01:10Z` | `2026-08-11T02:12:39Z` |
| GitHub Deployments API Production record created | `2026-08-11T01:31:31Z` | `2026-08-11T02:01:11Z` | `2026-08-11T02:12:40Z` |
| Build started (Vercel `buildingAt`) | **UNAVAILABLE** (API requires auth token; MCP `needsAuth`) | same | same |
| Exact Dashboard env `updatedAt` for Production `STRIPE_PRICE_*` | **UNAVAILABLE** | **UNAVAILABLE** | **UNAVAILABLE** |

Sources used: GitHub Commits API, Commit Statuses (`context=Vercel`), Deployments API.  
Sources **not** available this run: Vercel REST (`403 missingToken`), Vercel MCP (`needsAuth`), CLI token file empty.

**Whether deploys occurred after env changes**

- Exact Dashboard save timestamp: **unknown**.
- Conversation order (non-timestamp): Owner confirmed existing Production rows show NEW → then SHA `e3f6e83` / `dpl_2kbmwcr` was created specifically to load that map → **runtime still OLD/WRONG**.
- Therefore: “deploy before env edit” **does not** explain the live deployment.

Deployment-specific `*.vercel.app` URLs for the three dpls are behind **Deployment Protection** (401); prior Production-alias probes remain the runtime evidence for `dpl_2o619` and `dpl_6zLA`.

---

## 2. Environment snapshot timing (Vercel docs)

Authoritative ([Environment variables](https://vercel.com/docs/environment-variables)):

> Any change you make to environment variables are **not applied to previous deployments**, they only apply to **new deployments**.

| Question | Finding |
|----------|---------|
| When are project env vars bound? | To **new deployments** (immutable per deployment). Not hot-reloaded onto a running deployment. |
| Build time vs runtime | Build Step and Function execution both read the env map for **that** deployment. Server-only vars (`STRIPE_PRICE_*`, non-`NEXT_PUBLIC`) are read via `process.env` at Function runtime from the deployment’s env map. |
| Does changing Dashboard alone update Production traffic? | **No** — requires a **new** Production deployment. |

**After an env change, what is required?**

| Option | Required? |
|--------|-----------|
| A) Redeploy | Yes (or equivalent new Production deploy) |
| B) New build | Typically yes for a normal git/redeploy path (new deployment runs a build) |
| C) New deployment | **Yes — mandatory** |
| D) All of the above | Effectively **yes** for this Git→Vercel Production path |

Blind additional redeploys without resolving **which** env map is injected are **not** useful (already done multiple times).

---

## 3. Deployment environment source for `dpl_6zLA…` / live

| Check | Result |
|-------|--------|
| Vercel deployment env snapshot via API/MCP | **UNREADABLE** |
| Inferred from Production runtime when `dpl_6zLA` was live | **OLD/WRONG** |
| Inferred from live `dpl_2kbmwcr` runtime | **OLD/WRONG** |
| Created with Dashboard-confirmed NEW values? | **No evidence it was** — runtime proves injected map ≠ Owner-confirmed NEW |

---

## 4. Project settings (read-only)

| Setting | Finding |
|---------|---------|
| Project | `m-p-a-web` (`prj_pZn4nRYNDeN4AlVz1RZqY4L8tfjL`) |
| Team | `ecastle612-uxs-projects` (`team_Dh1s7cYC7PuAc0PioeJqS80q`) |
| Framework | Next.js (`apps/web`: `next build`) |
| Build / install | App scripts `next build` / monorepo install (no `vercel.json` in repo) |
| Root directory | `apps/web` (Vercel project for `m-p-a-web`; not re-fetched this turn — MCP down) |
| Git repository | `ecastle612-ux/M.P.A` |
| Production branch | `main` (stamp commits auto-deployed) |
| Alternate project serving www? | **No** — Vercel status URLs and domains point at `m-p-a-web` |

**Project configuration: PASS**

Note: team Shared Environment Variables can exist; project-level same key+Production **overrides** shared. If project Production rows are truly NEW, shared OLD cannot win. Persistent OLD injection therefore means the **effective** Production binding Vercel attaches to new deployments is not the NEW rows Owner Revealed (UI/id mismatch or platform defect)—not “wrong project.”

---

## 5. Domain mapping

| Host | Serves |
|------|--------|
| `www.my-property-assistant.com` | `dpl_2kbmwcrEg1sCR41CJNUBWg9CFx3y` |
| `my-property-assistant.com` | same |
| `m-p-a-web.vercel.app` | same |

**Domain mapping: PASS**

---

## 6. Previous vs cited/current deployments

| Deployment | When Production | Runtime class |
|------------|-----------------|---------------|
| `dpl_2o619PF678iM8CxXKAEAtTR4RbBN` | ~`01:31Z` | OLD Pro Prices + Business `we_` + literal annual |
| `dpl_6zLALiQLDKskpqva9ssgMGBTbukf` | ~`02:01Z` | **identical** OLD/WRONG class |
| `dpl_2kbmwcrEg1sCR41CJNUBWg9CFx3y` (live) | ~`02:12Z` (after Owner NEW confirmation) | **identical** OLD/WRONG class |

**Previous deployment comparison:** Both cited deployments (`dpl_2o619`, `dpl_6zLA`) and the later live deployment received the **same OLD/WRONG environment snapshot class**, despite Dashboard NEW confirmation before the latest deploy. That rules out “forgot to redeploy” and points to **Dashboard-visible Production ≠ injected Production env map**.

---

## Scorecard (requested format)

```
M.P.A. VERCEL ENVIRONMENT SNAPSHOT INVESTIGATION

Dashboard Production values:
CONFIRMED NEW

Current runtime values:
OLD/WRONG

Deployment:
dpl_6zLALiQLDKskpqva9ssgMGBTbukf (cited; prior Production)
Live now: dpl_2kbmwcrEg1sCR41CJNUBWg9CFx3y (same runtime class)

Deployment environment snapshot:
UNREADABLE (API/MCP); inferred OLD/WRONG from runtime

Environment snapshot timing:
Bound to NEW deployments only (not hot-reload). Env change ⇒ new deployment (+ typical rebuild). Exact Dashboard updatedAt unavailable. Live deploy after Owner NEW confirmation still OLD.

Previous deployment comparison:
dpl_2o619, dpl_6zLA, and live dpl_2kbmwcr all received identical OLD/WRONG STRIPE_PRICE_* injection class

Project configuration:
PASS

Domain mapping:
PASS

Root cause:
Vercel injects an OLD/WRONG Production STRIPE_PRICE_* map into new m-p-a-web deployments’ process.env while Owner-confirmed Dashboard Production rows show NEW — not app/CI/repo and not missing redeploy.

Required fix:
Obtain a machine-readable dump of all project + team Shared STRIPE_PRICE_* rows (id, target, type, updatedAt, value) and escalate to Vercel Support with Dashboard NEW vs runtime OLD/we_/literal on post-confirmation dpl_2kbmwcr — do not re-edit the eight Price vars again.

Owner action:
Do not edit/delete/recreate the eight Production Price variables. Optional: authorize read-only VERCEL_TOKEN for dump and/or open Vercel Support with mismatch evidence. Optional later (only if Support recommends): one Redeploy with build cache disabled — not another blind redeploy.

Production changes:
NONE

Deployment changes:
NONE

STOP.
```

---

## Ruled out (unchanged)

- PR #115 (unrelated; not Stripe/pricing; not deployed)
- `.cursor/environment.json` / `install.sh` affecting Vercel
- `apps/web/.env` (Cloud Agent–only, gitignored)
- GitHub Actions Stripe Price override
- Application Price ID fallbacks on Production SHA
- Wrong domain / wrong Vercel project
