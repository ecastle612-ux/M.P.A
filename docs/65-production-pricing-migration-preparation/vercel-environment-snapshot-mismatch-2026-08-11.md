# VERCEL ENVIRONMENT SNAPSHOT MISMATCH — 2026-08-11

## Confirmed facts

| Fact | Evidence |
|------|----------|
| Owner: Dashboard Production `STRIPE_PRICE_*` = NEW Price IDs | Owner confirmation (Reveal) |
| Fresh Production deploy after that confirmation | SHA `e3f6e83d9663a4629fd96acedef23b4b5e40a7d0` |
| Deployment ID | `dpl_2kbmwcrEg1sCR41CJNUBWg9CFx3y` |
| Completed | `2026-08-11T02:12:39Z`–`02:12:40Z` (GitHub Vercel status) |
| Project | `m-p-a-web` (`https://vercel.com/ecastle612-uxs-projects/m-p-a-web/2kbmwcrEg1sCR41CJNUBWg9CFx3y`) |
| Production aliases | www, apex, `m-p-a-web.vercel.app` all serve `dpl_2kbmwcr…` |
| App path | `process.env["STRIPE_PRICE_*"]` only; no code fallbacks on this SHA |
| Runtime still receives | OLD PM Prices + Business `we_…` + literal env name |

## Verdict

```
VERCEL ENVIRONMENT SNAPSHOT MISMATCH
```

Dashboard Production values (Owner-confirmed NEW) ≠ values injected into the serverless runtime of the fresh Production deployment.

**STOP criteria met:** Do not ask Owner to edit Vercel again. Do not redeploy repeatedly.

## Runtime proof (this deployment)

| Key | Expected NEW | Runtime |
|-----|--------------|---------|
| PM Pro monthly | `price_1U31Z48jGrZYUXDteGv4gbSw` ($59) | `price_1Tw3Cb8jGrZYUXDtQwHvaXFW` ($99) |
| PM Pro annual | `price_1U31Z58jGrZYUXDt2d9wqG4p` ($590) | `price_1Tw3Cc8jGrZYUXDtoMZ4ypxU` ($990) |
| PM Business monthly | `price_1U31Z58jGrZYUXDtMKIvMBCo` | `we_1Tw3Cg8jGrZYUXDtp2lv6gY0` (502) |
| PM Business annual | `price_1U31Z68jGrZYUXDtfHZfdUMI` | literal `STRIPE_PRICE_PM_BUSINESS_ANNUAL` (502) |
| FO display amounts | $59 / $590 | $99 / $990 |
| Complete display amounts | $109 / $1,090 | $149 / $1,490 |

FO/Complete checkout remain `enterprise_required` (gates intact).  
Subscriptions: 6 active still on old Prices; 0 on new; old Prices still `active`.

## Deployment ↔ environment relationship (investigation)

What is **ruled out**:

- Wrong project/domain (www = `m-p-a-web` = this dpl)
- Application hard-coded old IDs (absent on SHA)
- GitHub Actions injecting Stripe Price IDs (`ci.yml` has none)
- `vercel.json` / committed `.env` production files

What remains (must be resolved outside repeated Owner edits):

1. **Vercel injects a different env map than the Dashboard Production rows Owner Revealed**  
   (e.g. Shared Environment, Custom Environment mislabeled, branch-linked vars, duplicate UI rows with different internal ids, Sensitive vs displayed row confusion).

2. **Build artifact / Turborepo cache serving a bundle that does not re-read live `process.env` for these keys**  
   (less likely with bracket `process.env["…"]` + Node runtime, but not disproven without inspecting the deployment’s serverless bundle / disabling Turbo remote cache for one build).

3. **Platform bug:** deployment created after Dashboard save still snaps prior encrypted values.

Agent cannot list/decrypt Vercel env (MCP `needsAuth`; no `VERCEL_TOKEN`).

## Recommended next actions (not executed here)

1. Owner (or token-enabled agent): export/list Production env via `vercel env ls production` / REST **and** compare **env var ids** + targets for each key (screenshots of full row metadata, not only revealed value).  
2. Open Vercel Support with: project `m-p-a-web`, dpl `dpl_2kbmwcr…`, evidence Dashboard NEW vs runtime OLD/`we_`/literal.  
3. Optional controlled experiment (Product Owner approved): one Production build with Turbo remote cache disabled / “Redeploy” with “Use existing Build Cache” **unchecked** in Dashboard — still **no** env re-entry.

## Changes this step

- One no-op stamp commit on `main` to create the fresh deploy (required for pipeline).  
- No env create/edit/delete. No Stripe/subscription/app behavior changes. No further redeploys after mismatch confirmed.
