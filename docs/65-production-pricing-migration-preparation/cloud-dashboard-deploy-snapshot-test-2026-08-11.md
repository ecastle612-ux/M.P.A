# CONTROLLED TEST — Cloud Dashboard deployment → Vercel env snapshot

**Date:** 2026-08-11  
**Agent:** `bc-c20c2b19-7843-4446-b86b-01ecafd805a1`  
**PR:** https://github.com/ecastle612-ux/M.P.A/pull/116  
**Mode:** Diagnostic only  
**Constraints honored:** No Production env edits · no Stripe Price edits · no subscription changes · no pricing/app code changes · no PR #115 merge · no Production promotion of this test

---

## STEP 1 — Exact Cloud Dashboard deployment path (no guessing)

Evidence from this Cloud Agent environment:

| Check | Result |
|-------|--------|
| `VERCEL_TOKEN` | **absent** |
| Local `.vercel` project link | **absent** |
| `vercel` CLI deploy | **not used** (CLI only available via ad-hoc `npx`; no credentials) |
| GitHub Actions (`.github/workflows/ci.yml`) | CI verify only — **no Vercel deploy step** |
| GitHub Deployments creator | **`vercel[bot]`** only |
| Production branch | `main` → GitHub → Vercel Git Integration → **Production** |
| Non-`main` branch / PR | GitHub → Vercel Git Integration → **Preview** |

**Exact path used by the current Cloud Dashboard / Cloud Agent workflow:**

```
Cursor Cloud Dashboard
  → Cloud Agent (this run / prior stamp runs)
    → Git commit + push (GitHub: ecastle612-ux/M.P.A)
      → Vercel Git Integration (vercel[bot] on project m-p-a-web)
        → Preview (feature branch) or Production (main only)
```

**Not used:** Cursor Cloud Dashboard → direct Vercel deployment (`vercel deploy` / REST with agent token).

Cloud Agent secrets (`STRIPE_PRICE_*` injected into the agent VM) are **separate** from Vercel project env maps. They are **not** passed to Vercel by this path.

---

## STEP 2 — Safe test deployment

| Field | Value |
|-------|-------|
| Branch | `cursor/cloud-dashboard-deploy-snapshot-test-05a1` |
| Base | `main` @ `e3f6e83` (approved application code) |
| Trigger SHA | `f04c7b48e5c031192e8b41b3bfde5ea11e391c09` |
| Trigger change | Docs + no-op stamp under `apps/web/ops/` only |
| Vercel project | `m-p-a-web` (`prj_pZn4nRYNDeN4AlVz1RZqY4L8tfjL`) |
| Team | `team_Dh1s7cYC7PuAc0PioeJqS80q` |
| Target | **Preview only** |
| GitHub Actions CI | **success** (`31452716147`) |
| Vercel Preview | **FAILED** — `dpl_AKQJmDPB6vZLyKhnMphmP3sBsF5m` |

Build logs unreadable without `VERCEL_TOKEN` / authenticated Vercel MCP (`needsAuth` in Cloud Agent).

---

## STEP 3 — Production left untouched

| Check | Result |
|-------|--------|
| Pushed to `main`? | **No** |
| Promoted Preview → Production? | **No** (Preview never succeeded) |
| Live Production deployment | Still `e3f6e83` / GitHub Production deployment `5843175264` (`dpl_2kbmwcr…`) |
| Live catalog after test | Still OLD amounts ($99 / $990 / $149) |

---

## STEP 4 — Environment / Price ID verification

### 4A — Cloud Agent injected secrets (this Dashboard environment)

All eight expected NEW Price IDs → **MATCH** (suffix-checked; full secrets not printed).

| Key | Result |
|-----|--------|
| PM Professional Monthly | **MATCH** `…eGv4gbSw` |
| PM Professional Annual | **MATCH** `…2d9wqG4p` |
| PM Business Monthly | **MATCH** `…MKIvMBCo` |
| PM Business Annual | **MATCH** `…fHZfdUMI` |
| FO Professional Monthly | **MATCH** `…xN4pEhmQ` |
| FO Professional Annual | **MATCH** `…ZbyPva6V` |
| Complete Professional Monthly | **MATCH** `…Zw1c648L` |
| Complete Professional Annual | **MATCH** `…JuCrMN4V` |

### 4B — Stripe account (read-only retrieve; no mutations)

Expected NEW Prices exist and are `active` with expected amounts:

| Offer | Amount |
|-------|--------|
| PM Pro monthly / annual | $59 / $590 |
| PM Business monthly / annual | $209 / $2,450 |
| FO Pro monthly / annual | $59 / $590 |
| Complete Pro monthly / annual | $109 / $1,090 |

### 4C — Preview test deployment runtime

**UNAVAILABLE** — Preview build failed (`dpl_AKQJm…`). No runtime to probe.

Pattern: every recent Preview deployment sampled today is `failure`; every recent Production deployment is `success`/`inactive`. Preview failure is **systemic on this project right now**, not unique to this stamp.

### 4D — Live Production runtime (baseline; not modified by this test)

Safe probes only (Checkout session create / Stripe retrieve of that session; catalog JSON). No payment completed. Secrets not exposed.

| Mapping | Expected | Runtime | Verdict |
|---------|----------|---------|---------|
| PM Pro Monthly | `price_1U31Z48…eGv4gbSw` ($59) | `price_1Tw3Cb…QwHvaXFW` ($99) | **MISMATCH** |
| PM Pro Annual | `price_1U31Z58…2d9wqG4p` ($590) | `price_1Tw3Cc…oMZ4ypxU` ($990) | **MISMATCH** |
| PM Business Monthly | `price_1U31Z58…MKIvMBCo` ($209) | `we_1Tw3Cg…` (not a Price) | **MISMATCH** |
| PM Business Annual | `price_1U31Z68…fHZfdUMI` ($2,450) | literal `STRIPE_PRICE_PM_BUSINESS_ANNUAL` | **MISMATCH** |
| FO Monthly / Annual | `price_1U31Z68…` ($59 / $590) | catalog $99 / $990 | **MISMATCH** |
| Complete Monthly / Annual | `price_1U31Z78…` ($109 / $1,090) | catalog $149 / $1,490 | **MISMATCH** |

---

## STEP 5 — Pricing / gating on Production baseline (test Preview N/A)

| Surface | Expected | Observed on live Production |
|---------|----------|-------------------------------|
| Property Manager | $59/mo · $590/yr | **$99/mo · $990/yr** |
| PM Business | $209/mo · $2,450/yr | Checkout **502** (invalid Price strings) |
| FO | NOT ONLINE / ENTERPRISE-GATED | Checkout `enterprise_required` (409) — **gate intact**; list shows old $99 class |
| Complete | NOT ONLINE / ENTERPRISE-GATED | Checkout `enterprise_required` (409) — **gate intact**; list shows old $149 class |

---

## STEP 6 — Compare / hypothesis verdict

**Hypothesis:** Current Cursor Cloud Dashboard / Cloud Agent deployment workflow is responsible for the Vercel Production environment mismatch.

| Evidence | Implication |
|----------|-------------|
| Deploy path is GitHub → `vercel[bot]` only | Cloud Dashboard does **not** push env maps into Vercel |
| Agent `STRIPE_PRICE_*` secrets are already **NEW/MATCH** | Wrong Production runtime is **not** copied from Cloud Agent secrets |
| Same Cloud→Git→Vercel Production path earlier today (`e3f6e83`) still injected OLD/WRONG | Vercel attaches its own Production env snapshot at deploy time |
| This controlled Preview attempt failed; Production not overwritten | Cannot blame a new Production cutover from this test |

### Verdict

```
HYPOTHESIS NOT SUPPORTED
```

The current Cloud Dashboard / Cloud Agent workflow is **not** the source of the wrong Production Price IDs.

- It deploys **indirectly** via Git + Vercel Git Integration.
- Its own injected Price secrets are **correct (NEW)**.
- Production runtime continues to receive Vercel’s **OLD/WRONG Production env snapshot** (Dashboard Reveal ≠ runtime), consistent with prior escalation docs.

### What this test could not finish

1. Preview env snapshot MATCH/MISMATCH — Preview builds currently fail project-wide; logs require `VERCEL_TOKEN` or authenticated Vercel MCP.
2. A new Production deploy from this agent — **intentionally not performed** (Owner instruction: do not overwrite live site for the test).

### Recommended next (outside this controlled test)

1. Provide read-only `VERCEL_TOKEN` (or Desktop-auth Vercel MCP) to inspect `dpl_AKQJm…` failure + list Production env var **ids/values/targets**.
2. Continue Vercel Support escalation (Dashboard NEW ≠ injected runtime) — not another blind Owner paste/redeploy cycle.
3. Do **not** merge this PR to `main` for the diagnostic.
