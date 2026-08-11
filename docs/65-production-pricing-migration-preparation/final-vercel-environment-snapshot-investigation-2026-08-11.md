# Final Vercel Environment Snapshot Investigation — 2026-08-11

**Mode:** Investigation only. No deploy, no env mutation, no Stripe/code changes.  
**PR #115:** Confirmed unrelated (not investigated further here).

## Clarification: current live deployment

The prompt cites `dpl_6zLALiQLDKskpqva9ssgMGBTbukf` / `520f7c5`.  

**Live right now** (www, apex, `m-p-a-web.vercel.app`):

| Field | Value |
|-------|--------|
| Deployment | **`dpl_2kbmwcrEg1sCR41CJNUBWg9CFx3y`** |
| SHA | **`e3f6e83d9663a4629fd96acedef23b4b5e40a7d0`** |
| Completed | `2026-08-11T02:12:39Z` |

`dpl_6zLA…` is the **prior** Production deployment (`520f7c5`, completed `02:01:10Z`). Both received the **same class** of OLD/WRONG runtime Price values.

---

## 1. Deployment timeline (verified only)

| Deployment | SHA | Commit time (UTC) | Vercel status completed | GitHub Production deploy created |
|------------|-----|-------------------|-------------------------|----------------------------------|
| `dpl_2o619…` | `8d7485c` | (earlier stamp) | `01:31:31Z` | `01:31:31Z` |
| `dpl_6zLA…` | `520f7c5` | `02:00:10Z` | `02:01:10Z` | `02:01:11Z` |
| `dpl_2kbmwcr…` (live) | `e3f6e83` | `02:11:47Z` | `02:12:39Z` | `02:12:40Z` |

| Unknown | Status |
|---------|--------|
| Exact Vercel Dashboard “env value changed” timestamp | **UNAVAILABLE** — no env API (`VERCEL_TOKEN` absent); Vercel MCP unavailable/`needsAuth` |

Cannot prove whether Owner’s confirmed Dashboard save was before or after `dpl_6zLA` / `dpl_2kbmwcr` without that timestamp. Conversation order: Owner confirmed NEW → fresh snapshot deploy `e3f6e83` still OLD at runtime.

---

## 2. Environment snapshot timing (Vercel docs)

Authoritative Vercel behavior ([Environment variables](https://vercel.com/docs/environment-variables)):

> Any change you make to environment variables are **not applied to previous deployments**, they only apply to **new deployments**.

Implications:

| Question | Answer |
|----------|--------|
| Do env changes hot-reload a live deployment? | **No** |
| Required to pick up env changes | A **new deployment** (redeploy or new git Production deploy) |
| New build required? | New deployment typically runs a build; for server-only `process.env` (non-`NEXT_PUBLIC`), values are supplied to the Functions of **that** deployment |
| Build cache | Docs recommend clearing build cache when env changes matter for inlined/`NEXT_PUBLIC` vars; server-only vars should still come from the deployment’s env map |

For this app (`process.env["STRIPE_PRICE_*"]` in Node checkout/pricing): values must come from the **deployment’s** Production env map at create/runtime of that deployment — not from a later Dashboard edit of an older deployment.

**Required after Dashboard env change:** new Production deployment (we already performed multiple).

---

## 3. Deployment environment snapshot readability

| Deployment | Snapshot of injected `STRIPE_PRICE_*` values |
|------------|-----------------------------------------------|
| Any | **UNREADABLE** via API/MCP (no token; no env decrypt tools) |
| Inferred from runtime probes | **OLD/WRONG** for `dpl_2o619`, `dpl_6zLA`, and live `dpl_2kbmwcr` |

No Vercel “deployment env snapshot” payload was available to this agent.

---

## 4. Project configuration (from prior authenticated MCP + GitHub status URLs)

| Setting | Finding |
|---------|---------|
| Project | `m-p-a-web` / `prj_pZn4nRYNDeN4AlVz1RZqY4L8tfjL` |
| Team | `ecastle612-uxs-projects` / `team_Dh1s7cYC7PuAc0PioeJqS80q` |
| Framework | Next.js (prior `get_project`) |
| Git | `ecastle612-ux/M.P.A`, Production branch `main` (deploy meta) |
| Domains | www, apex, `m-p-a-web.vercel.app` on this project |
| `vercel.json` | Absent in repo |
| Root directory / build commands | Not re-fetched this turn (MCP down); no evidence of alternate project |

**Project configuration: PASS** (serving the intended `m-p-a-web` Production project).

**Shared env note (docs):** Team Shared Environment Variables exist; **project-level overrides shared** for same key+environment. Therefore if project Production rows are truly NEW, shared OLD cannot win. If runtime is OLD, either project Production effective bindings are not the rows Owner revealed, or Vercel is not attaching those project values to new deployments.

---

## 5. Domain mapping

| Host | `data-dpl-id` |
|------|----------------|
| `www.my-property-assistant.com` | `dpl_2kbmwcrEg1sCR41CJNUBWg9CFx3y` |
| `my-property-assistant.com` | same |
| `m-p-a-web.vercel.app` | same |

**Domain mapping: PASS**

---

## 6. Previous vs current deployments

| Deployment | Runtime PM Pro monthly | Runtime Business monthly |
|------------|------------------------|--------------------------|
| `dpl_2o619…` | old `price_1Tw3Cb…` | `we_1Tw3Cg…` |
| `dpl_6zLA…` | old `price_1Tw3Cb…` | `we_1Tw3Cg…` |
| `dpl_2kbmwcr…` (live) | old `price_1Tw3Cb…` | `we_1Tw3Cg…` |

**Previous deployment comparison:** All three Production deployments received **identical OLD/WRONG** runtime Price configuration class, despite Owner-confirmed Dashboard NEW and at least one deploy (`dpl_2kbmwcr`) created specifically after that confirmation.

That pattern indicates the mismatch is **not** explained by “forgot to redeploy.” It is a **Dashboard-visible Production values ≠ values injected into new Production deployments** problem on this project.

---

## Root cause (precise)

**Vercel is injecting an OLD/WRONG `STRIPE_PRICE_*` map into new `m-p-a-web` Production deployments (`process.env`), while the Owner-confirmed Dashboard Production UI shows NEW Price IDs. Application/CI/repo sources are ruled out. Env changes require a new deployment (done repeatedly); therefore the failure is in Vercel’s stored-vs-injected Production configuration path for this project (wrong effective binding vs UI, or platform snapshot defect)—not missing redeploys and not M.P.A. code.**

---

## Required fix (precise)

1. Obtain a **machine-readable dump** of all project + team Shared env rows for keys `STRIPE_PRICE_*` (id, target, type, updatedAt, value) via `VERCEL_TOKEN` / `vercel env ls` / Support — **read-only**.  
2. Open **Vercel Support** with: project `m-p-a-web`, live `dpl_2kbmwcr…`, Owner screenshots of Dashboard NEW vs runtime OLD/`we_`/literal after post-confirmation redeploy.  
3. Optional Owner Dashboard action (not env re-entry): one **Redeploy** with **“Use existing Build Cache” unchecked** — only after Support/token dump, if they recommend it.

---

## Owner action

**Do not edit/delete/recreate the eight Production Price variables again.**  

Optional: (a) check Team **Shared Environment Variables** for any `STRIPE_PRICE_*` (informational; project should override), (b) authorize read-only `VERCEL_TOKEN` for agent dump, or (c) file Vercel Support with the mismatch evidence.

---

## Production / deployment changes this investigation

**NONE**
