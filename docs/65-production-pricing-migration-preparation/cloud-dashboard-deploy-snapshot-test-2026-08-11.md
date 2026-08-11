# CONTROLLED TEST — Cloud Dashboard deployment → Vercel env snapshot

**Date:** 2026-08-11  
**Agent:** `bc-c20c2b19-7843-4446-b86b-01ecafd805a1`  
**Mode:** Diagnostic only  
**Constraints honored:** No Production env edits · no Stripe Price edits · no subscription changes · no pricing/app code changes · no PR #115 merge · no Production promotion of this test

---

## STEP 1 — Exact Cloud Dashboard deployment path (no guessing)

Evidence from this Cloud Agent environment:

| Check | Result |
|-------|--------|
| `VERCEL_TOKEN` | **absent** |
| Local `.vercel` project link | **absent** |
| `vercel` CLI | **not installed / not used** |
| GitHub Actions (`.github/workflows/ci.yml`) | CI verify only — **no Vercel deploy step** |
| GitHub Deployments creator | **`vercel[bot]`** only |
| Production branch | `main` → GitHub → Vercel Git Integration → **Production** |
| Non-`main` branch / PR | GitHub → Vercel Git Integration → **Preview** |

**Exact path used by the current Cloud Dashboard / Cloud Agent workflow:**

```
Cursor Cloud Dashboard
  → Cloud Agent (this run)
    → Git commit + push (GitHub: ecastle612-ux/M.P.A)
      → Vercel Git Integration (vercel[bot] on project m-p-a-web)
        → Preview (feature branch) or Production (main only)
```

**Not used:** Cursor Cloud Dashboard → direct Vercel deployment (CLI/`vercel deploy`).

Cloud Agent secrets (`STRIPE_PRICE_*` injected into the agent VM) are **separate** from Vercel project env maps. They are not passed to Vercel by this path.

---

## STEP 2 — Safe test deployment

| Field | Value |
|-------|-------|
| Branch | `cursor/cloud-dashboard-deploy-snapshot-test-05a1` |
| Base | `main` @ `e3f6e83` (approved application code) |
| Trigger change | Docs + no-op stamp under `apps/web/ops/` only |
| Vercel project | `m-p-a-web` (`prj_pZn4nRYNDeN4AlVz1RZqY4L8tfjL`) |
| Team | `team_Dh1s7cYC7PuAc0PioeJqS80q` |
| Target | **Preview only** — Production left untouched |

---

## STEP 3 — Production left untouched

This test intentionally **does not** push to `main` and **does not** promote Preview → Production.

Live Production remains the prior deployment (`dpl_2kbmwcr…` / SHA `e3f6e83`) for comparison only.

---

## STEP 4 / 5 / 6 — Results (filled after Preview is live)

See sections below (updated by the same agent after Vercel Preview completes).

### Baseline — live Production (pre-test, not modified)

Probed `https://www.my-property-assistant.com` during this run:

| Check | Result |
|-------|--------|
| Catalog PM | **$99 / $990** (OLD class) |
| Catalog FO | **$99 / $990** (OLD class) |
| Catalog Complete | **$149 / $1,490** (OLD class) |
| PM Pro Checkout session Price | `price_1Tw3Cb…QwHvaXFW` / `price_1Tw3Cc…oMZ4ypxU` → **MISMATCH** vs expected `price_1U31Z…` |
| PM Business monthly | Stripe error `No such price: 'we_1Tw3Cg…'` → **MISMATCH** |
| PM Business annual | Stripe error `No such price: 'STRIPE_PRICE_PM_BUSINESS_ANNUAL'` → **MISMATCH** |
| FO / Complete Checkout | `enterprise_required` (409) — **gates intact** |

Expected NEW Stripe Prices exist in Stripe (read-only retrieve via agent key): PM $59/$590, Business $209/$2,450, FO $59/$590, Complete $109/$1,090 — all `active`.

### Cloud Agent injected secrets vs expected NEW

All eight `STRIPE_PRICE_*` secrets injected into **this Cloud Agent** → **MATCH** expected NEW Price IDs.

Conclusion for path isolation: wrong Production runtime values are **not** coming from the Cloud Agent secret store (those are already NEW).

### Preview test deployment

| Field | Value |
|-------|-------|
| Deployment ID | _pending_ |
| Preview URL | _pending_ |
| GitHub SHA | _pending_ |
| Price ID MATCH/MISMATCH | _pending_ |
| Pricing amounts | _pending_ |
| FO/Complete gating | _pending_ |

### Comparison verdict

_pending after Preview probe_
