# BUG-006 — Production Verification

**Checked:** 2026-08-08  
**Domain:** `https://www.my-property-assistant.com`

## Code on main

| Item | Result |
|------|--------|
| PR #58 merge | `677d0242c9f910a24b493fe8d3261a327a59bfb0` |
| Lint hotfix PR #59 merge | `ad9dfa8` (tip of `main` at verification) |
| Shared tests / web typecheck | Pass prior to merge |

## Deploy

| Item | Result |
|------|--------|
| `Production – m-p-a-web` for BUG-006 SHAs | **Blocked** |
| Vercel GitHub status | `Deployment rate limited — retry in 24 hours.` |
| Latest successful Production `m-p-a-web` | still `71bc62f` (BUG-005) |

## Live www (at verification)

Still serving pre–BUG-006 commercial copy (Professional/Business, repeated Request Enterprise). Live URL matrix for the restored model **cannot** be signed Pass until Production redeploys `main`.

## Required follow-up

1. Wait for Vercel rate-limit window (or raise project deploy quota).
2. Redeploy `main` to Production `m-p-a-web`.
3. Re-run live checks:

| Check | Expect |
|-------|--------|
| `/` | Choose Your Platform; no Professional/Business; Enterprise Solutions once near bottom |
| `/pricing` | Three platforms × Monthly/Annual pricing |
| `/checkout?intent=mpa_property_manager` | Confirm Plan platform + cycle |
| `/enterprise` | Enterprise Solutions optional path only |

## Verdict

**Code merged · Production deploy blocked by Vercel rate limit · Live verification Incomplete.**
