# Vercel access retest after desktop MCP auth (2026-08-11)

## Result

**VERCEL PRODUCTION ACCESS BLOCKED — ENV WRITE CAPABILITY MISSING**

Desktop Vercel MCP authentication **succeeded** for read/inspect. Production **environment variable write** is still unavailable from this cloud agent.

## What now works

| Capability | Status |
|------------|--------|
| Vercel MCP `serverStatus` | **ready** (was `needsAuth`) |
| `list_teams` | **PASS** → `team_Dh1s7cYC7PuAc0PioeJqS80q` |
| `list_projects` / `get_project` | **PASS** → `m-p-a-web` (`prj_pZn4nRYNDeN4AlVz1RZqY4L8tfjL`) |
| Domains on project | www + apex confirmed |
| `list_deployments` | **PASS** |
| Current Production deployment | `dpl_H1i7NSFgBXKsyyMos7YBsUnTURbg` · SHA `f72ea4aac6db18164c0bc685506f397d3775c196` · READY |

## What remains blocked

| Capability | Status | Why |
|------------|--------|-----|
| Inspect Production env var **values** | **BLOCKED** | No MCP tool for env list/decrypt |
| Update Production `STRIPE_PRICE_*` | **BLOCKED** | No MCP tool for env create/update |
| Vercel CLI / REST API env upsert | **BLOCKED** | `VERCEL_TOKEN` not injected into cloud agent |
| Production redeploy after env change | **BLOCKED** | Depends on env write first |

### MCP tool catalog gap (authenticated but insufficient)

Available tools include projects/deployments/domains/logs — **not** environment variable CRUD.

Env updates require Vercel REST:

`POST /v10/projects/{id}/env?upsert=true&teamId=…`

with `Authorization: Bearer $VERCEL_TOKEN`.

## Stripe Prices (unchanged — verified)

All 8 NEW Prices still active at authorized amounts. **No new Prices created** this run.

## Exact secure action still required

### Fastest path to finish pricing cutover (no chat paste)

**Vercel Dashboard → `m-p-a-web` → Settings → Environment Variables → Production**

Set only:

```
STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY=price_1U31Z48jGrZYUXDteGv4gbSw
STRIPE_PRICE_PM_PROFESSIONAL_ANNUAL=price_1U31Z58jGrZYUXDt2d9wqG4p
STRIPE_PRICE_PM_BUSINESS_MONTHLY=price_1U31Z58jGrZYUXDtMKIvMBCo
STRIPE_PRICE_PM_BUSINESS_ANNUAL=price_1U31Z68jGrZYUXDtfHZfdUMI
STRIPE_PRICE_FO_PROFESSIONAL_MONTHLY=price_1U31Z68jGrZYUXDtxN4pEhmQ
STRIPE_PRICE_FO_PROFESSIONAL_ANNUAL=price_1U31Z68jGrZYUXDtZbyPva6V
STRIPE_PRICE_COMPLETE_PROFESSIONAL_MONTHLY=price_1U31Z78jGrZYUXDtZw1c648L
STRIPE_PRICE_COMPLETE_PROFESSIONAL_ANNUAL=price_1U31Z78jGrZYUXDtJuCrMN4V
```

Then **Redeploy** the current Production deployment (or promote/redeploy `main`) so runtime picks up env.

Verify `https://www.my-property-assistant.com/pricing` → PM **$59** / **$590**.

### Persistent agent write path (future tasks)

Inject into Cursor Cloud Agent environment secrets (dashboard UI, not chat):

- `VERCEL_TOKEN` (team-scoped token with project env write)
- `VERCEL_ORG_ID` = `team_Dh1s7cYC7PuAc0PioeJqS80q` (or team slug)
- `VERCEL_PROJECT_ID` = `prj_pZn4nRYNDeN4AlVz1RZqY4L8tfjL`

Then re-run the cutover agent so it can call the env upsert API + redeploy.

## Working permanent workflow (documented)

```
Cursor implement/test/commit
  → GitHub PR → merge main
  → Vercel Git integration auto-deploys Production (m-p-a-web)
  → Verify SHA + live routes
```

Privileged env ops:

```
Authenticated Vercel MCP (inspect) ✅
  + VERCEL_TOKEN (env write / redeploy) ❌ still missing in cloud agent
```

## Safety this run

- No additional Stripe Prices  
- No subscription modifications  
- No unrelated env changes  
- FO/Complete not enabled  

## STOP

Await Production env update (Dashboard) **or** `VERCEL_TOKEN` injection, then re-prompt for verification.
