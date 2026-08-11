# M.P.A. Final Commercial Production Release — 2026-08-11

## Merge

| PR | Result | Merge commit |
|----|--------|--------------|
| #129 Legacy commercial path cleanup | **MERGED** | `16ae489886a231aa1d5d1d75448f479c848527c4` |
| #130 Pricing page complete transparency | **MERGED** | `1571eccaab98c91166c0ec04a4e16de185398cca` |

Order: #130 did **not** contain #129 → merged **#129 first**, then **#130**.  
PR #126 / #121: **not** merged.

## Production deployment

| Field | Value |
|-------|--------|
| Commercial merge tip | `1571eccaab98c91166c0ec04a4e16de185398cca` (PR #129 + #130) |
| Production SHA (live) | `5df8b750a19efc6b75226c7821e2923ba4f9644a` (docs release record on same commercial tree) |
| Vercel deployment (live) | `dpl_5GPduPhDDCfDfmPKgWTMkET42nfk` |
| Prior commercial deploy | `dpl_BZrknTQLJ7rkpJLPtmqxePdFjUSt` @ `1571ecc` |
| GitHub deployment (live) | `5851397475` |
| Status | success · Deployment has completed |
| Aliases | `www.my-property-assistant.com`, `my-property-assistant.com`, `m-p-a-web.vercel.app` (all same live dpl) |

## Safety

| Item | Status |
|------|--------|
| Stripe Prices | **UNCHANGED** (all 8 verified Price IDs still active at expected amounts) |
| Existing subscriptions | **UNCHANGED** |
| Vercel environment variables | **UNCHANGED** |

## Validation (main tip)

| Check | Result |
|-------|--------|
| @mpa/shared tests | **184 PASS** |
| @mpa/web tests | **51 PASS** |
| TypeScript | **PASS** |
| Lint | **PASS** |
| Production build | **PASS** |

## Production smoke

See agent run evidence: pricing content, quote math 500/501/1000/1001 for PM/FO/Complete, Checkout line items match authorized Price IDs, legacy checkout rejected, browser journeys to Confirm Plan for all three products, mobile/desktop.
