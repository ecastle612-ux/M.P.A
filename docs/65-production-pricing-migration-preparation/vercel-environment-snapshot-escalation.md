# Vercel Production Environment Escalation Package — 2026-08-11

**Classification:** Evidence / Support package only  
**Production changes:** NONE  
**Vercel env mutations:** NONE  
**Deployments:** NONE  
**Stripe / subscriptions / application code:** NONE  

Related prior investigation: [final-vercel-environment-snapshot-investigation-2026-08-11.md](./final-vercel-environment-snapshot-investigation-2026-08-11.md)  
Support request draft (do **not** submit from agent): [vercel-support-request-draft.md](./vercel-support-request-draft.md)

---

## 1. Identity

| Field | Value |
|-------|--------|
| Project name | `m-p-a-web` |
| Project ID | `prj_pZn4nRYNDeN4AlVz1RZqY4L8tfjL` |
| Team ID | `team_Dh1s7cYC7PuAc0PioeJqS80q` |
| Team slug | `ecastle612-uxs-projects` |
| Git repository | `ecastle612-ux/M.P.A` |
| Production branch | `main` |
| Live deployment | `dpl_2kbmwcrEg1sCR41CJNUBWg9CFx3y` |
| Live SHA | `e3f6e83d9663a4629fd96acedef23b4b5e40a7d0` |

### Domains (all correct project)

| Domain | Maps to |
|--------|---------|
| `www.my-property-assistant.com` | live `dpl_2kbmwcr…` on `m-p-a-web` |
| `my-property-assistant.com` | same |
| `m-p-a-web.vercel.app` | same |

**Domain / project association: PASS** (not a wrong-project issue).

---

## 2. Affected deployments

| Deployment ID | SHA (prefix) | Vercel GitHub status “completed” (UTC) | Role |
|---------------|--------------|----------------------------------------|------|
| `dpl_2o619PF678iM8CxXKAEAtTR4RbBN` | `8d7485c` | `2026-08-11T01:31:31Z` | Prior Production |
| `dpl_6zLALiQLDKskpqva9ssgMGBTbukf` | `520f7c5` | `2026-08-11T02:01:10Z` | Prior Production |
| `dpl_2kbmwcrEg1sCR41CJNUBWg9CFx3y` | `e3f6e83` | `2026-08-11T02:12:39Z` | **Current live Production** |

Each was a **new** Production deployment on `m-p-a-web` after Owner work on Production `STRIPE_PRICE_*` rows.  
`dpl_2kbmwcr…` was created **after** Owner confirmed Dashboard Production values are **NEW**.

**Runtime class on all three (when each served Production aliases):** identical **OLD / WRONG** `STRIPE_PRICE_*` injection.

---

## 3. Claim under investigation

| Source | State |
|--------|--------|
| Owner-confirmed Vercel Dashboard → Project `m-p-a-web` → Environment Variables → **Production** (Reveal) for the eight `STRIPE_PRICE_*` keys | **NEW** (authorized Price IDs) |
| `process.env` observed via live Pricing catalog + Checkout Session line items / Stripe errors on Production | **OLD / WRONG** |

This package proves the mismatch is **not** explained by application code, GitHub Actions, wrong domain/project, missing redeploy, PR #115, or Cloud Agent local env.

---

## 4. Machine-readable env inventory

| Capability | Status |
|------------|--------|
| `VERCEL_TOKEN` in agent environment | **Absent** |
| Vercel MCP | **`needsAuth`** (cannot authenticate interactively in this cloud agent) |
| Unauthenticated `GET /v9/projects/{id}/env` | **403** missing token |
| CLI `~/.local/share/com.vercel.cli/auth.json` | Placeholder only (no token) |

**Machine-readable env inventory: UNAVAILABLE**

### Eight keys — metadata matrix (API)

For each key below, **id / type / createdAt / updatedAt / target row count / decrypted value class from API** = **UNREADABLE**.

| Variable name | Project ID | Team ID | API metadata | Value class (API) | Value class (runtime on live Production) |
|---------------|------------|---------|--------------|-------------------|------------------------------------------|
| `STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY` | `prj_pZn4nRYNDeN4AlVz1RZqY4L8tfjL` | `team_Dh1s7cYC7PuAc0PioeJqS80q` | UNREADABLE | UNREADABLE | **OLD** |
| `STRIPE_PRICE_PM_PROFESSIONAL_ANNUAL` | same | same | UNREADABLE | UNREADABLE | **OLD** |
| `STRIPE_PRICE_PM_BUSINESS_MONTHLY` | same | same | UNREADABLE | UNREADABLE | **WRONG** (webhook-endpoint id shape `we_…`, not a Price) |
| `STRIPE_PRICE_PM_BUSINESS_ANNUAL` | same | same | UNREADABLE | UNREADABLE | **WRONG** (literal env **name** string) |
| `STRIPE_PRICE_FO_PROFESSIONAL_MONTHLY` | same | same | UNREADABLE | UNREADABLE | **OLD** (catalog display amount class) |
| `STRIPE_PRICE_FO_PROFESSIONAL_ANNUAL` | same | same | UNREADABLE | UNREADABLE | **OLD** (catalog display amount class) |
| `STRIPE_PRICE_COMPLETE_PROFESSIONAL_MONTHLY` | same | same | UNREADABLE | UNREADABLE | **OLD** (catalog display amount class) |
| `STRIPE_PRICE_COMPLETE_PROFESSIONAL_ANNUAL` | same | same | UNREADABLE | UNREADABLE | **OLD** (catalog display amount class) |

**Multiple rows for same name?** — **UNREADABLE** from API. Owner previously reported attempting to **add** NEW rows while existing rows remained (Vercel `ENV_ALREADY_EXISTS` for same name+Production). Agent cannot enumerate row ids without token.

**No Stripe secret keys, webhook secrets, or credential values are included in this package.**

---

## 5. Shared / team variables

### Platform capability (docs)

Vercel supports:

- **Project** environment variables  
- **Team Shared** environment variables (linkable to projects)  
- Integration-managed variables  
- Per-environment targets: Production / Preview / Development  
- Preview branch-specific overrides  

Authoritative precedence ([Shared environment variables](https://vercel.com/docs/environment-variables/shared-environment-variables)):

> When a project-level and a Shared Environment Variable share the same key and environment, the **project-level environment variable always overrides** the Shared Environment Variable.

### Implication for this incident

| If… | Then… |
|-----|--------|
| Owner-revealed **project** Production rows are truly NEW | Shared OLD values **cannot** win over those project rows for the same key+Production |
| Runtime still receives OLD/WRONG | Effective injection ≠ Owner-confirmed project UI rows **or** the UI rows Owner revealed are not the bindings actually attached to new Production deployments |

### Agent finding this run

| Check | Result |
|-------|--------|
| List team Shared env for `STRIPE_PRICE_*` | **UNREADABLE** (no API auth) |
| List project env including linked Shared | **UNREADABLE** |
| Prove Shared overrides project | **Contradicted by Vercel docs** if project row exists for same key+env |
| Shared/team variable conflict explaining OLD over NEW project rows | **UNREADABLE** empirically; **docs say project wins** → conflict alone does **not** explain Dashboard-NEW + runtime-OLD if project Production rows are NEW |

**Shared/team variable conflict: UNREADABLE** (cannot inventory); **docs precedence: project overrides shared**.

---

## 6. Variable targets

| Question | Result |
|----------|--------|
| Production / Preview / Development targets for the eight keys | **UNREADABLE** via API |
| Multiple target rows per key | **UNREADABLE** via API |
| Does Preview env affect Production deployment `process.env`? | **No** under normal Vercel rules — Production deployments use Production-targeted vars |
| Live www uses Production target | **Yes** (`VERCEL_ENV=production` path; aliases on Production deployments) |

**Duplicate target conflict: UNREADABLE**

---

## 7. Deployment comparison

| Dimension | `dpl_2o619…` | `dpl_6zLA…` | `dpl_2kbmwcr…` (live) |
|-----------|--------------|-------------|------------------------|
| Project | `m-p-a-web` | `m-p-a-web` | `m-p-a-web` |
| Target | Production | Production | Production |
| Trigger | Git `main` stamp | Git `main` stamp | Git `main` stamp after Owner NEW confirmation |
| Env snapshot via API | UNREADABLE | UNREADABLE | UNREADABLE |
| Runtime `STRIPE_PRICE_*` class | OLD/WRONG | OLD/WRONG | OLD/WRONG |

**Finding:** All three Production deployments behave as if they received the **same** OLD/WRONG Production env map. Fresh deployments did **not** pick up Owner-confirmed Dashboard NEW values.

Per Vercel docs, env changes apply only to **new** deployments — these **are** new deployments. Therefore the failure is in **stored-vs-injected** Production configuration for this project, not “forgot to redeploy.”

---

## 8. Eliminated causes

| Cause | Status | Evidence |
|-------|--------|----------|
| Wrong Vercel project / domain | **Eliminated** | www/apex/`m-p-a-web.vercel.app` → `dpl_2kbmwcr` on `m-p-a-web` |
| Application hard-coded old Price IDs | **Eliminated** | Serving path reads `process.env["STRIPE_PRICE_*"]` only (`server-env.ts` / `saas-stripe/client.ts`); no `price_1Tw3…` / `price_1U31…` fallbacks in that library |
| GitHub Actions Stripe Price override | **Eliminated** | Only `.github/workflows/ci.yml`; no `STRIPE_PRICE_*` / Price ID injection |
| PR #115 | **Eliminated** | Unrelated; not Stripe/pricing; not deployed |
| Cloud Agent `.cursor/environment.json` / `install.sh` | **Eliminated** | Cannot affect Vercel Production injection |
| Gitignored `apps/web/.env` | **Eliminated** | Local agent only |
| Missing redeploy after Dashboard change | **Eliminated** | Multiple new Production deploys including post-confirmation `dpl_2kbmwcr` |
| Repository committed production `.env` / `vercel.json` env | **Eliminated** | No production env file; no `vercel.json` |

---

## 9. Runtime proof method (no secrets)

Reproduced against live Production (`https://www.my-property-assistant.com`), deployment `dpl_2kbmwcr…`:

1. `GET /api/commerce/catalog-prices` → display unit amounts classify FO/Complete/PM Pro as **OLD** amount class (not EXPECTED NEW).  
2. `POST /api/commerce/checkout` with Property Manager `professional` + `monthly`/`annual` → Stripe Checkout Session line items classify as **OLD** Price IDs (compared privately to expected NEW set; **values not pasted here as a secret dump** — classification only in support narrative).  
3. Same for `business` monthly/annual → Stripe API errors prove **WRONG** shapes: webhook-endpoint id (`we_…`) and literal environment variable **name**.

FO/Complete checkout remain enterprise-gated (`409 enterprise_required`) — availability unchanged; display envs still OLD class.

**No Stripe secret keys or webhook secrets are logged in this report.**

---

## 10. Exact reproduction steps (for Vercel Support)

1. Open Vercel Dashboard → team `ecastle612-uxs-projects` → project **`m-p-a-web`** (`prj_pZn4nRYNDeN4AlVz1RZqY4L8tfjL`).  
2. Settings → Environment Variables → filter **Production** → Reveal the eight `STRIPE_PRICE_*` keys listed in §4.  
3. Owner records: values are the **NEW** authorized Stripe Price IDs.  
4. Observe current Production deployment **`dpl_2kbmwcrEg1sCR41CJNUBWg9CFx3y`** aliased to `www.my-property-assistant.com`.  
5. Call live catalog + checkout endpoints as in §9.  
6. Observe runtime classifications: PM Pro **OLD**; PM Business **WRONG**; FO/Complete display **OLD**.  
7. Note prior Production deployments `dpl_2o619…` and `dpl_6zLA…` exhibited the **same** runtime class when live.  
8. Confirm application SHA has no hard-coded Price fallbacks and CI has no Stripe Price env injection.

---

## 11. Expected vs actual behavior

| Expected (per Vercel docs + Owner Dashboard) | Actual |
|-----------------------------------------------|--------|
| New Production deployments receive current project Production env values shown in Dashboard | New Production deployments continue to inject **OLD/WRONG** `STRIPE_PRICE_*` into `process.env` |
| After Owner confirms NEW Dashboard values and a new deploy completes, checkout uses NEW Prices | Checkout still uses OLD Prices / invalid Business strings |
| Project-level Production rows (if NEW) override Shared | Runtime still OLD/WRONG regardless |

---

## 12. Requested Vercel investigation

Please investigate **Production environment-variable snapshot / injection** for project `m-p-a-web` (`prj_pZn4nRYNDeN4AlVz1RZqY4L8tfjL`):

1. Dump all project + team Shared rows for the eight `STRIPE_PRICE_*` keys: `id`, `key`, `target`, `type`, `createdAt`, `updatedAt`, linked projects, and whether Sensitive.  
2. Dump the **effective env map** attached to deployments `dpl_2o619…`, `dpl_6zLA…`, and `dpl_2kbmwcr…` for those keys (classification or redacted compare to Dashboard).  
3. Explain why Dashboard Production Reveal shows NEW while every new Production deployment’s `process.env` remains OLD/WRONG.  
4. Advise the **single** corrective platform action (without requiring the Owner to re-enter the eight values yet again, if possible).

---

## 13. Owner action

**NO VERCEL VARIABLE CHANGES REQUIRED** for this escalation package.

Do **not** edit, delete, recreate, or add the eight `STRIPE_PRICE_*` variables as part of this package.  
Do **not** redeploy until Vercel Support (or a machine-readable dump) explains the injection path.

Optional later (Owner-controlled, not performed by agent): authorize a read-only `VERCEL_TOKEN` so an agent can attach the missing metadata matrix; submit the draft in [vercel-support-request-draft.md](./vercel-support-request-draft.md).

---

## 14. Change log for this package

| Action | Result |
|--------|--------|
| Production changes | **NONE** |
| Vercel changes | **NONE** |
| Stripe changes | **NONE** |
| Deployment | **NONE** |
| Code | **Documentation only** |

**STOP.**
