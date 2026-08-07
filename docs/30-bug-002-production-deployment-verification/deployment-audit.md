# Deployment Audit — BUG-002

**Date:** 2026-08-07  
**Method:** Live HTTP probes + GitHub Deployments API + `origin/main` / PR #44 source inspection  
**Limitation:** Vercel MCP requires desktop authentication in this environment; domain→project binding is inferred from GitHub Production deployment success + live behavior matching that SHA’s source. DNS confirms Vercel hosting.

---

## 1. Which commit SHA is currently deployed to production?

**Production SHA (authoritative from GitHub Deployments):**

`a37e565111e10def38a85b239c72990e727f11ea`

| Field | Value |
|-------|-------|
| Environment | `Production – m-p-a-web` |
| Deployment id | `5787129587` |
| Created | `2026-08-07T01:22:49Z` |
| Status | **success** — “Deployment has completed” |
| GitHub status target | `https://m-p-a-gv8zwep4i-ecastle612-uxs-projects.vercel.app` |

**Live confirmation that production behaves like this SHA (not BUG-001):**

| Probe | Result |
|-------|--------|
| `GET https://www.my-property-assistant.com/` | **HTTP 307** `Location: /login`, `x-matched-path: /`, `x-vercel-cache: MISS` |
| Login JS chunk `0iua5err9g3hw.js` | Contains exact string **`Sign in to Property Manager`** |
| Source at `a37e565` `login-form.tsx` | Same string |
| Source at PR #44 tip `4968b4d` | Changed to **`Sign in to M.P.A.`** — not what production serves |

Next.js build id observed on the live domain: `ZYBB-l0anZV4MQtHEMetH` (`/_next/static/ZYBB-l0anZV4MQtHEMetH/_buildManifest.js` → 200).

---

## 2. Does the production deployment include PR #44 (BUG-001)?

**No.**

| Check | Result |
|-------|--------|
| `gh pr view 44` | `state: OPEN`, `mergedAt: null`, `mergeCommit: null` |
| Head | `4968b4dbb32bd9081951620c2da647867545721c` |
| Base | `a37e565` (current `main`) |
| Production SHA vs PR head | Production = base `main`, **not** PR head |

---

## 3. Does production contain `app/(marketing)/page.tsx`?

**No on the deployed tip (`main` @ `a37e565`).**

```text
origin/main tree:
  apps/web/src/app/page.tsx          ← present
  apps/web/src/app/(marketing)/…   ← absent
```

PR #44 adds `apps/web/src/app/(marketing)/page.tsx` and deletes `apps/web/src/app/page.tsx`, but that is not on `main` / production.

---

## 4. Does production `app/page.tsx` still `redirect("/login")`?

**Yes — on the SHA production is serving.**

From `a37e565` / `origin/main`:

```ts
if (user) {
  redirect("/launcher");
}

redirect("/login");
```

Live domain: anonymous `GET /` → **307 `/login`**.

---

## 5. Is the custom domain attached to the expected Vercel project?

**DNS:** `www.my-property-assistant.com` and apex resolve to **`76.76.21.21`** (Vercel).  
**Server:** responses include `server: Vercel` and `x-vercel-id`.

**Projects linked to this repo (from GitHub deployment environments):**

| Vercel project (GitHub env name) | Latest Production for `a37e565` |
|----------------------------------|----------------------------------|
| `m-p-a-web` (`Production – m-p-a-web`) | **success** |
| `mpa` (`Production – mpa`) | **failure** (`dpl_HKEYEjX4E3qzyUSGAvZkJxDyy9TF`) |

**Inference (evidence-based, not a Vercel Domains API listing):** the public domain is being served by the **successful** production project **`m-p-a-web`**, because:

1. Only `m-p-a-web` has a successful Production deployment for current `main`.  
2. Live root + login copy match that SHA’s source exactly.  
3. `mpa` Production for the same SHA **failed** and cannot be the healthy production alias.

**Gap:** Exact domain-assignment row in the Vercel dashboard was not readable here (Vercel MCP auth unavailable; deployment `.vercel.app` URLs are SSO-gated). Operator should confirm in Vercel → `m-p-a-web` → Domains that `www.my-property-assistant.com` is listed.

---

## 6. Is production pointing at the latest deployment?

**Yes — for `m-p-a-web`, production points at the latest successful Production deployment, which is also latest `main`.**

| Ref | SHA |
|-----|-----|
| `origin/main` | `a37e565111e10def38a85b239c72990e727f11ea` |
| Latest successful `Production – m-p-a-web` | `a37e565111e10def38a85b239c72990e727f11ea` |

Production is **not** stale relative to `main`. It is stale relative to **BUG-001**, because BUG-001 was never merged.

---

## 7. Did the latest deployment fail?

| Project | Latest Production @ `a37e565` | Result |
|---------|-------------------------------|--------|
| `m-p-a-web` | `5787129587` | **success** |
| `mpa` | `5787132460` | **failure** — inspect `dpl_HKEYEjX4E3qzyUSGAvZkJxDyy9TF` |

Additionally, PR #44 **Preview** deployments for both projects **failed** (does not affect current production content, but blocks preview validation of BUG-001 until fixed):

| Preview env | SHA | Status |
|-------------|-----|--------|
| `Preview – m-p-a-web` | `4968b4d` | failure (`dpl_6LHZysCVq3t3SeZ68eosQTDys4Fi`) |
| `Preview – mpa` | `4968b4d` | failure (`dpl_36h8bHx8PWELxVmCMDRH59mPyDcs`) |

---

## 8. Is CDN / cache serving an older deployment?

**No evidence of cache serving a pre-BUG-001 build instead of current `main`.**

| Observation | Meaning |
|-------------|---------|
| `GET /` → `x-vercel-cache: MISS`, `cache-control: private, no-cache, no-store` | Root redirect is computed live from current deployment |
| Behavior matches `a37e565` source | Current production code, not an ancient July alias |
| `GET /login` → `x-vercel-cache: HIT` (age ~16h) | Normal edge cache of the login document **after** redirect; still the current app’s login UI (“Sign in to Property Manager”) |

The domain is not “stuck on July.” It is correctly on **current main**, which still implements the legacy homepage redirect.

---

## Audit answer matrix

| # | Question | Answer |
|---|----------|--------|
| 1 | Production commit SHA | `a37e565111e10def38a85b239c72990e727f11ea` |
| 2 | Includes PR #44? | **No** |
| 3 | Has `(marketing)/page.tsx`? | **No** |
| 4 | Still `redirect("/login")`? | **Yes** |
| 5 | Domain on expected project? | DNS→Vercel; healthy Production project = **`m-p-a-web`** (confirm Domains UI) |
| 6 | Pointing at latest deployment? | **Yes** (latest successful `m-p-a-web` = latest `main`) |
| 7 | Latest deploy fail? | `m-p-a-web` **success**; sibling project `mpa` **failure** |
| 8 | CDN serving older deploy? | **No** for root; live miss matches current `main` behavior |
