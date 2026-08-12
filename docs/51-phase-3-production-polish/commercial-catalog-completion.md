# Commercial catalog completion — official pricing

**Status:** **BLOCKED** on Vercel Production env write (Steps 3–5)  
**Date:** 2026-08-09  
**Authority:** Owner — AUTHORIZE COMMERCIAL CATALOG COMPLETION  
**Scope:** Stripe Products/Prices + Production env mapping only. No redesign. No checkout changes. FO_READY unchanged. Sprint 4 not started.

---

## Official pricing (Owner-approved)

| Product | Monthly | Annual (10×) |
| --- | --- | --- |
| Property Manager | $99 | $990 |
| Facility Operations | $99 | $990 |
| Complete Platform | $149 | $1490 |

---

## Step 1–2 — Stripe LIVE catalog (DONE)

Did **not** reuse Founder / Professional / Business / Enterprise products for FO or Complete.

| Product | Stripe Product ID | Status |
| --- | --- | --- |
| Property Manager | *(existing PM checkout mapping retained — see note)* | Unchanged |
| Facility Operations | `prod_V2T5R4aelXunHp` | **Created** |
| Complete Platform | `prod_V2T5DGZOhygqiH` | **Created** |

| Offer | Amount | Stripe Price ID | Lookup key |
| --- | --- | --- | --- |
| FO Monthly | $99 | `price_1U2O9M8jGrZYUXDtuoUU9jVQ` | `mpa_facility_operations__professional__monthly` |
| FO Annual | $990 | `price_1U2O9N8jGrZYUXDt28S1FwxK` | `mpa_facility_operations__professional__annual` |
| Complete Monthly | $149 | `price_1U2O9N8jGrZYUXDtqwDqgobS` | `mpa_complete_platform__professional__monthly` |
| Complete Annual | $1490 | `price_1U2O9N8jGrZYUXDtsAhAkcTD` | `mpa_complete_platform__professional__annual` |

Machine-readable: [`commercial-catalog-stripe-ids.json`](./commercial-catalog-stripe-ids.json)

### Property Manager note

LIVE Stripe still lists legacy tier products (`M.P.A. Founder` / `Professional` / `Business` / `Enterprise`). Property Manager self-serve already displays **$99 / $990** via existing `STRIPE_PRICE_PM_*` mappings. Per Owner instruction: **do not change Property Manager mappings** and do not reuse those legacy products for FO/Complete. No new Property Manager product was required for this completion.

---

## Step 3 — Vercel Production env (BLOCKED)

Required Production mappings (existing app keys — display-only for FO/Complete):

```
STRIPE_PRICE_FO_PROFESSIONAL_MONTHLY=price_1U2O9M8jGrZYUXDtuoUU9jVQ
STRIPE_PRICE_FO_PROFESSIONAL_ANNUAL=price_1U2O9N8jGrZYUXDt28S1FwxK
STRIPE_PRICE_COMPLETE_PROFESSIONAL_MONTHLY=price_1U2O9N8jGrZYUXDtqwDqgobS
STRIPE_PRICE_COMPLETE_PROFESSIONAL_ANNUAL=price_1U2O9N8jGrZYUXDtsAhAkcTD
```

Do **not** modify `STRIPE_PRICE_PM_*`.

### Blocker

This cloud agent has:

- LIVE `STRIPE_SECRET_KEY` (used successfully for Steps 1–2)
- **No** `VERCEL_TOKEN`
- Vercel MCP / Stripe MCP: `needsAuth` (interactive auth unavailable in this environment)
- Browser Vercel login: failed (no session / SSO)

**Owner unblock (one of):**

1. Authenticate the **Vercel** MCP server in Cursor desktop for this agent, **or**
2. Inject a Production-scoped `VERCEL_TOKEN` into the cloud agent secrets, **or**
3. Set the four env vars above on Vercel project `m-p-a-web` → Production, then Redeploy Production

Then re-authorize this agent to finish Steps 3–5 (env → redeploy → LIVE verify).

---

## Step 4 — Redeploy Production

**Not started** (blocked on Step 3).

| Field | Value |
| --- | --- |
| Deployment ID | — |
| Production SHA | still `bc893446f061452e338e0332b9478f6af99d2442` (Sprint 3 tip) |

---

## Step 5 — LIVE verify (current = FAIL for FO/Complete amounts)

URL: https://www.my-property-assistant.com/pricing

| Check | Result |
| --- | --- |
| Property Manager $99 / $990 | **PASS** (already live) |
| Facility Operations $99 / $990 | **FAIL** — Price ID env not set |
| Complete Platform $149 / $1490 | **FAIL** — Price ID env not set |
| FO CTA Request Early Access | **PASS** |
| Complete CTA Request Consultation | **PASS** |
| Enterprise sales motion | **PASS** |
| No checkout / FO_READY change | **PASS** |

Screenshot (pre-env): [`screenshots-catalog/live-pricing-before-env.png`](./screenshots-catalog/live-pricing-before-env.png)

---

## Regression (partial)

| Area | Result |
| --- | --- |
| PM Stripe Checkout still works | Expected unchanged (not re-exercised after Stripe FO/Complete create) |
| FO/Complete checkout still gated | Expected `enterprise_required` (FO_READY false) — not changed |
| Application code | **No code changes** in this workstream |

---

## Verdict

**FAIL** — Stripe catalog complete; Production display blocked until Vercel env + redeploy.

**STOP.** Do not begin Sprint 4. Await Owner LIVE acceptance after env unblock.
