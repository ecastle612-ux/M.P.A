# Vercel Production access — connection required

**Date:** 2026-08-11  
**Status:** **VERCEL PRODUCTION ACCESS BLOCKED — OPERATOR CONNECTION REQUIRED**  
**Project:** `m-p-a-web`  
**Stripe Prices:** Already created (do **not** create more)

## Connection methods inspected

| Method | Result |
|--------|--------|
| Vercel MCP | **`needsAuth`** — interactive auth only works in **Cursor desktop IDE**, not cloud agents |
| `VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` | **MISSING** from cloud-agent injected secrets |
| Vercel CLI auth (`~/.local/share/com.vercel.cli/auth.json`) | **Absent** |
| `.vercel/project.json` link | **Absent** |
| Link MCP Vercel tools | **None** |
| GitHub → Vercel integration | **Present** for auto-deploy on `main` merge (`vercel[bot]` Production deploys) — does **not** grant env-var write from this agent |
| Stripe production | **Working** (`sk_live` injected) |

No credentials were invented, exposed, or written to source.

## Exact secure setup required (choose one)

### Option A — Preferred for Cursor agents: Vercel MCP (desktop)

1. Open this repository in **Cursor Desktop**.  
2. Open **Settings → MCP** (or the Vercel MCP server entry).  
3. Authenticate the **Vercel** MCP server with the account that owns project **`m-p-a-web`**.  
4. Re-run the pricing cutover agent **from desktop** (or re-prompt the cloud agent after MCP is linked to the team) so it can:
   - list Production env on `m-p-a-web`
   - update only the eight `STRIPE_PRICE_*` variables
   - trigger Production redeploy  
5. Do **not** paste tokens into chat.

### Option B — Cloud Agent secret injection (persistent for this environment)

In **Cursor Dashboard → Cloud Agents → Environment**  
`https://cursor.com/dashboard/cloud-agents/environments/e/82cc2069-839c-11f1-a7d1-d6b4613131ce`

Add **injected secrets** (never commit to git):

| Secret | Purpose |
|--------|---------|
| `VERCEL_TOKEN` | Vercel token with env write + deploy on `m-p-a-web` (prefer restricted / scoped token) |
| `VERCEL_ORG_ID` or `VERCEL_TEAM_ID` | Team/org that owns the project |
| `VERCEL_PROJECT_ID` | Project id for `m-p-a-web` |

Then rebuild/restart a cloud agent so secrets inject, and re-run cutover.

Create the token in Vercel Dashboard → Account/Team → Tokens (scope to the team; do not paste into chat — only into Cursor environment secrets UI).

### Option C — Manual one-time cutover in Vercel Dashboard (unblocks pricing now)

1. Vercel → project **`m-p-a-web`** → Settings → Environment Variables → **Production**.  
2. Set **only** these eight values (already created in Stripe):

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

3. Redeploy Production (Deployments → … → Redeploy latest Production, or merge any approved PR to `main` after env save so the new env is picked up).  
4. Verify `https://www.my-property-assistant.com/pricing` shows PM **$59** / **$590**.

Options A/B restore agent authority for **future** approved env ops; Option C completes the immediate pricing cutover without agent write access.

## Required capabilities after connection

- Read/write **Production** environment variables on `m-p-a-web`
- Trigger Production redeploy
- Confirm deployment SHA / success

## What must NOT change

- Do not create additional Stripe Prices  
- Do not modify/archive old Prices  
- Do not migrate existing subscriptions  
- Do not rotate Stripe secret keys / Supabase / auth / unrelated env  

## Live state right now (pre-env cutover)

| Check | Result |
|-------|--------|
| `/pricing` PM amount | Still **$99** / **$990** (old env Price IDs) |
| NEW Stripe Prices | Active at authorized targets |
| Existing PM subs | Still on `price_1Tw3Cb8jGrZYUXDtQwHvaXFW` |
| `FO_READY` | `false` — FO/Complete enterprise-gated |

## Permanent deployment workflow (target)

```
Cursor (implement + test)
        ↓
Commit / Push / PR
        ↓
GitHub merge to main
        ↓
Vercel Git integration auto-deploys Production (m-p-a-web)
        ↓
Verify Production SHA + live routes
        ↓
DONE
```

**Privileged ops** (Stripe Price creation, Vercel env Price-ID updates):

```
Cursor agent
        ↓
Secure connected credentials
  - Stripe: already via cloud-agent injected secrets (working)
  - Vercel: MCP desktop auth OR injected VERCEL_TOKEN + project/org ids
        ↓
API/MCP mutation (env update / redeploy)
        ↓
Live verify
```

Application code must **not** hard-code live Price IDs; keep env-injected mappings (`STRIPE_PRICE_*`) as today.

## STOP

No v2.0.2. No FO/Complete enablement. No Capital Projects. No RentRedi. No more Stripe Prices.
