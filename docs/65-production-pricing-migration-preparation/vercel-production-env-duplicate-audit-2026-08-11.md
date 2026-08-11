# Vercel Production Env Duplicate Audit — 2026-08-11

**Mode:** Audit only. No Vercel create/edit/delete. No redeploy. No Stripe/subscription changes.  
**Owner clarification:** NEW env entries were **added**; existing entries were **not** edited/removed — consistent with earlier instructions that emphasized creating NEW Stripe Prices and did not always make “edit value in place” the sole Dashboard action.

Do **not** treat this as Owner error.

---

## Access limits

| Method | Result |
|--------|--------|
| Vercel MCP | Project/deploy inspect only — **no** env list/decrypt |
| `VERCEL_TOKEN` | Absent |
| REST `GET .../env` | **403** `missingToken` |
| Dashboard values | **UNREADABLE** from this agent |

Duplicate **row counts** in the Dashboard cannot be enumerated here. Platform rules + runtime proof still constrain what is possible.

---

## Platform constraint (Vercel)

For a given project, Vercel does **not** allow two environment variables with the **same Name and same target Environment**.

Documented conflict behavior when adding a duplicate Production key:

- API: `ENV_ALREADY_EXISTS` / `ENV_CONFLICT`
- Message pattern: *Another Environment Variable with the same Name and Environment exists… Remove it or choose a different Name or Environment.*
- Correct mutation path for an existing Production key: **Edit / `env update` / create with `upsert=true`** — not a second Add of the same name+Production.

Therefore:

| Claim | Audit conclusion |
|-------|------------------|
| Two Production rows both named `STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY` | **Platform-forbidden** (not expected) |
| Same key on Production **and** Preview/Development as separate rows | **Allowed** — common when “Add” is used for another target |
| New keys with **different names** (app does not read) | **Allowed** — would not affect live Checkout/Pricing |
| Existing Production value replaced by Add without edit | **Not how Vercel works** without upsert/edit |

---

## Effective runtime (serving Production) — proven

Deployment: `dpl_2o619PF678iM8CxXKAEAtTR4RbBN` · SHA `8d7485c99fb6239ee2dbdf4203d2048be1dc6f1e`

App reads **only** these exact names via `process.env` (no fallbacks on this SHA).

| Env key | Effective runtime value | Status vs authoritative NEW |
|---------|-------------------------|-------------------------------|
| `STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY` | `price_1Tw3Cb8jGrZYUXDtQwHvaXFW` ($99) | **OLD** (not `price_1U31Z48…`) |
| `STRIPE_PRICE_PM_PROFESSIONAL_ANNUAL` | `price_1Tw3Cc8jGrZYUXDtoMZ4ypxU` ($990) | **OLD** (not `price_1U31Z58…2d9w`) |
| `STRIPE_PRICE_PM_BUSINESS_MONTHLY` | `we_1Tw3Cg8jGrZYUXDtp2lv6gY0` | **WRONG** (webhook id; not `price_1U31Z58…MKIv`) |
| `STRIPE_PRICE_PM_BUSINESS_ANNUAL` | `STRIPE_PRICE_PM_BUSINESS_ANNUAL` | **WRONG** (literal name; not `price_1U31Z68…fHZf`) |
| `STRIPE_PRICE_FO_PROFESSIONAL_MONTHLY` | Resolves to Stripe amount **$99** (9900) | **OLD amount** (NEW Price is $59) |
| `STRIPE_PRICE_FO_PROFESSIONAL_ANNUAL` | **$990** (99000) | **OLD amount** (NEW is $590) |
| `STRIPE_PRICE_COMPLETE_PROFESSIONAL_MONTHLY` | **$149** (14900) | **OLD amount** (NEW is $109) |
| `STRIPE_PRICE_COMPLETE_PROFESSIONAL_ANNUAL` | **$1,490** (149000) | **OLD amount** (NEW is $1,090) |

FO/Complete Price **IDs** are not echoed in public JSON (amounts only). Amounts match prior catalog Prices, not the NEW `$59/$590/$109/$1,090` Prices — so those Production keys still resolve to pre-cutover Prices at runtime.

---

## Per-key audit status

### PM Professional Monthly
- **Runtime effective:** OLD `$99` Price `price_1Tw3Cb8jGrZYUXDtQwHvaXFW`
- **Authoritative NEW:** `price_1U31Z48jGrZYUXDteGv4gbSw`
- **Dashboard duplicates:** UNREADABLE (row list unavailable)
- **Inference:** The Production binding for this **exact name** still supplies the old Price. Any newly added NEW Price ID is **not** what `process.env.STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY` returns on `dpl_2o619`.

### PM Professional Annual
- **Runtime effective:** OLD `$990` Price `price_1Tw3Cc8jGrZYUXDtoMZ4ypxU`
- **Authoritative NEW:** `price_1U31Z58jGrZYUXDt2d9wqG4p`
- Same inference as monthly.

### PM Business Monthly
- **Runtime effective:** WRONG webhook id `we_1Tw3Cg8jGrZYUXDtp2lv6gY0`
- **Authoritative NEW:** `price_1U31Z58jGrZYUXDtMKIvMBCo`
- NEW Price (if added under another name/target) is not effective for this key on Production runtime.

### PM Business Annual
- **Runtime effective:** WRONG literal `STRIPE_PRICE_PM_BUSINESS_ANNUAL`
- **Authoritative NEW:** `price_1U31Z68jGrZYUXDtfHZfdUMI`
- Same inference.

### FO Monthly / Annual
- **Runtime effective:** OLD display amounts $99 / $990
- **Authoritative NEW:** `price_1U31Z68…xN4p` / `price_1U31Z68…ZbyP` ($59 / $590)
- Checkout remains enterprise-gated (unchanged).

### Complete Monthly / Annual
- **Runtime effective:** OLD display amounts $149 / $1,490
- **Authoritative NEW:** `price_1U31Z78…Zw1c` / `price_1U31Z78…JuCr` ($109 / $1,090)
- Checkout remains enterprise-gated (unchanged).

---

## Were NEW values added as duplicates, or did Vercel replace?

| Scenario | Compatible with evidence? |
|----------|---------------------------|
| Production value **replaced** in place with NEW IDs | **No** — runtime would show NEW after redeploy; it does not |
| Second Production row same name (true duplicate) | **Platform-forbidden** — not expected |
| NEW values added under **same names** for Preview/Development only | **Plausible** — Production rows unchanged; matches “added, did not edit existing” |
| NEW values added under **different key names** | **Plausible** — app ignores them |
| Add to Production same name **rejected** by ENV conflict | **Plausible** — existing Production values unchanged |

**Determinable today:** Vercel did **not** replace the effective Production values for the eight app-read names (proven by runtime on post-edit redeploy `dpl_2o619`).  
**Not determinable without Dashboard/API:** exact row inventory (which of the plausible “add” paths occurred).

---

## Root cause (audit)

1. Live resolution uses exact `STRIPE_PRICE_*` names from Production runtime env — no app fallback.
2. Serving Production still receives **old/wrong** values for those names.
3. Owner **added** NEW configuration without editing/removing the existing Production bindings (per clarification; instructions emphasized NEW Prices and did not uniquely force in-place Edit).
4. Vercel will not silently run two Production values for one name; therefore the pre-existing Production bindings remain authoritative for the app, and any added NEW IDs are either on another target, under another name, or never applied to those Production keys.
5. `isSaasCheckoutReady()` only requires non-empty Business strings — so wrong Business values still unlock PM Pro Checkout.

---

## Production changes / deployment

**NONE** (this audit).

---

## Next required action (inspect only — no delete, no re-entry yet)

Owner (or token-enabled agent) performs a **read-only inventory** on:

**Vercel → `m-p-a-web` → Settings → Environment Variables**

For each of the eight names, record (no edits):

1. How many rows exist with that exact name  
2. Target(s) on each row (Production / Preview / Development)  
3. Whether Reveal (Production row only) shows OLD/WRONG vs NEW `price_1U31…`  
4. Whether any **extra** rows exist with similar but different names holding NEW Price IDs  

That inventory chooses the cleanup path later (edit Production value in place vs remove non-Production extras vs rename orphans). **Do not delete or re-enter in this step.**

---

## Future safety check (still not implemented)

Reject non-`price_…` readiness values (`we_…`, literal env names). Separate gated task after cutover.
