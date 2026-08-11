# M.P.A. VERCEL /ENV FORENSIC RESULT — 2026-08-11

**Mode:** READ-ONLY  
**Agent:** `bc-c20c2b19-7843-4446-b86b-01ecafd805a1`  
**Mutations:** NONE (no env add/rm/edit, no deploy, no Stripe/subscription/app changes, no merge of #115/#116)

---

## Tooling reality (critical)

| Capability | Result |
|------------|--------|
| Vercel MCP authentication | **PASS** (`list_teams`, `get_project`, `list_deployments`, `get_deployment`, build/runtime logs) |
| Local project link (`.vercel/project.json`) | **MISSING** |
| Vercel CLI credentials | **MISSING** (`VERCEL_TOKEN` absent; CLI auth.json empty) |
| MCP env-var tools (`list`/`decrypt`/`diff`) | **NOT PRESENT** in authenticated Vercel MCP tool surface |
| REST `GET /v10/projects/.../env` | **403** `missingToken` |

Therefore **`/env list` and `/env diff` could not be executed** in this Cloud Agent, even though MCP project/deploy access works.

---

## STEP 1 — /status (MCP equivalent)

CLI `/status` blocked (project not linked). MCP read-only status:

| Field | Value |
|-------|-------|
| Project | `m-p-a-web` (`prj_pZn4nRYNDeN4AlVz1RZqY4L8tfjL`) |
| Team | `ecastle612-uxs-projects` (`team_Dh1s7cYC7PuAc0PioeJqS80q`) |
| Framework | Next.js |
| Node | `24.x` |
| Git | `ecastle612-ux/M.P.A` (Git Integration; Production branch `main`) |
| Domains | `www.my-property-assistant.com`, `my-property-assistant.com`, `m-p-a-web.vercel.app`, git-main alias |
| Live Production deployment | `dpl_2kbmwcrEg1sCR41CJNUBWg9CFx3y` · READY · `target=production` · SHA `e3f6e83` |
| Production aliases | www + apex + `m-p-a-web.vercel.app` all on that dpl |
| Latest deployment overall | Preview ERROR (`dpl_NwaKSM…`, PR #116) — does **not** replace Production |
| Other team projects | `mpa-setup-gate-850c168`, `mpa-deploy-pmx6-r1`, `mpa-ux007-clean-1784586434` exist; **www is not aliased to them** |
| Protection | SSO protection enabled for `all_except_custom_domains` |
| `vercel.json` | None in repo — framework defaults |

**/status: PASS** (via MCP)

---

## STEP 2–5 — /env LIST / DIFF / VALUE VERIFY

| Check | Status |
|-------|--------|
| `/env list` | **FAIL** — CLI unauthenticated; MCP has no env list tool |
| `/env diff` | **UNAVAILABLE** |
| Eight `STRIPE_PRICE_*` Production records (id/target/updatedAt/value class) | **UNREADABLE** via authenticated tooling this run |
| Duplicate Production records | **UNREADABLE** |
| Shared/team env inheritance for those keys | **UNREADABLE** |
| Target conflict for those keys | **UNREADABLE** (see Preview signal below) |

### Preview target signal (not Price IDs, but proves target-specific maps)

Failed Preview `dpl_AKQJm…` build logs (MCP `get_deployment_build_logs`) show Zod missing:

- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SESSION_COOKIE_NAME`

Production builds succeed with those present. So **Preview ≠ Production env map** for core vars. This does **not** prove the eight Price keys’ Production stored values; it only proves target-specific configuration exists on this project.

---

## STEP 6 — Live runtime (re-verified this run)

Serving: `dpl_2kbmwcr…` / `main` / `e3f6e83`

| Mapping | Expected NEW | Live runtime | Class |
|---------|--------------|--------------|-------|
| PM Pro Monthly | `price_1U31Z48…eGv4gbSw` | `price_1Tw3Cb…QwHvaXFW` | **OLD** |
| PM Pro Annual | `price_1U31Z58…2d9wqG4p` | `price_1Tw3Cc…oMZ4ypxU` | **OLD** |
| PM Business Monthly | `price_1U31Z58…MKIvMBCo` | `we_…` | **WRONG** |
| PM Business Annual | `price_1U31Z68…fHZfdUMI` | literal env name | **WRONG** |
| FO / Complete display | NEW amounts | $99 / $149 class | **OLD** |
| FO / Complete Checkout | gated | `enterprise_required` | gate intact |

**Whether /env would show those OLD/WRONG strings in Production config: UNKNOWN** — env inventory blocked.

---

## STEP 7 — Classification

**Primary: H — tooling gap blocks definitive A–G for the eight Price keys.**

Ruled out / constrained with evidence:

| Class | Status |
|-------|--------|
| E (wrong project serving www) | **Ruled out** — MCP shows www aliases on `m-p-a-web` / `dpl_2kbmwcr` |
| D (target mismatch generally) | **Partially confirmed** for Preview vs Production core vars; **unproven** for Price keys |
| A / B / C / F / G for `STRIPE_PRICE_*` | **Cannot classify** until `vercel env ls` / REST env inventory decrypts Production rows |

Owner Dashboard Reveal (prior) claimed Production UI = NEW. Live runtime = OLD/WRONG. Without API env list we still cannot say whether stored Production rows are NEW (→ F/G) or OLD (→ A) or duplicated (→ B).

---

## REQUIRED FIX (DO NOT EXECUTE IN THIS RUN)

1. Add a **read-only** `VERCEL_TOKEN` (or complete CLI `vercel login` + `vercel link` to `m-p-a-web`) into this Cloud Agent.  
2. Re-run **only**:
   - `vercel env ls` (and `vercel env ls production`)
   - REST `GET /v10/projects/prj_pZn4nRYNDeN4AlVz1RZqY4L8tfjL/env?teamId=team_Dh1s7cYC7PuAc0PioeJqS80q` (+ decrypt for the eight keys only)
   - optional team shared-env list  
3. Compare each Production record’s **id / target / updatedAt / value class (NEW|OLD|WRONG)** to runtime — still **no edits, no redeploy**.

---

## Safety checklist

| Item | Status |
|------|--------|
| Production changes | **NONE** |
| Stripe changes | **NONE** |
| Deployments initiated | **NONE** |
| Env mutations | **NONE** |
| PR #115 / #116 merges | **NONE** |
