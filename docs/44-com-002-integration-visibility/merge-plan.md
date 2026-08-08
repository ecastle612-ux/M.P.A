# COM-002 Merge Plan

**Goal:** Get Slices A–E onto `main` and deployed to Production `m-p-a-web` without rewriting completed work.

## Recommended order (simplest)

Because branches are **strictly stacked** and Slice E tip contains A–E:

| Step | Action | PR | Tip SHA |
|------|--------|----|---------|
| 1 | Merge **Slice E** into `main` | [#53](https://github.com/ecastle612-ux/M.P.A/pull/53) | `14d5fa5` |
| 2 | Close or supersede stacked PRs #48–#52 as included | #48–#52 | ancestors of #53 |
| 3 | Verify Production `m-p-a-web` deploy for merge SHA | — | TBD after merge |
| 4 | Apply Supabase migrations + confirm SaaS Stripe env | ops | — |
| 5 | Live visibility verification | docs/44 | — |

**Conflict check:** Dry-run merge of `origin/cursor/com-002-slice-e-f5dd` into `origin/main` on 2026-08-08 → **clean** (no conflicts).

## Alternative sequential order (if policy requires one PR per slice)

| Order | PR | Branch | Depends on |
|-------|-----|--------|------------|
| 1 | #48 | `cursor/com-002-self-service-commercial-f5dd` | `main` |
| 2 | #49 | `cursor/com-002-slice-a-f5dd` | #48 / docs |
| 3 | #50 | `cursor/com-002-slice-b-f5dd` | #49 |
| 4 | #51 | `cursor/com-002-slice-c-f5dd` | #50 |
| 5 | #52 | `cursor/com-002-slice-d-f5dd` | #51 |
| 6 | #53 | `cursor/com-002-slice-e-f5dd` | #52 |

Sequential merges are redundant if #53 is merged first (it already contains the stack). Prefer **single merge of #53**.

## Merge conflicts

| Pair | Result |
|------|--------|
| Slice E → `main` | **None** (dry-run clean) |
| Intermediate PRs vs `main` | Expect CLEAN or trivial once stack lands; do not rewrite Slice code |

## PR hygiene notes

- All COM-002 PRs show `mergeable: MERGEABLE`, `mergeStateStatus: UNSTABLE` due to **Vercel Preview FAILURE** (env), while GitHub Actions `verify` has been green on earlier slices.
- Preview red must **not** be treated as a production blocker (same pattern as PR #46).
- Do **not** merge Slice F/G — not authorized; flags remain false on Slice E tip.

## Required production deployment after merge

1. Auto-deploy Production `m-p-a-web` from `main`  
2. Confirm deploy **success** and record Production SHA  
3. Run migrations:  
   - `20260808010000_com_002_slice_c_saas_checkout.sql`  
   - `20260808020000_com_002_slice_d_provisioning.sql`  
   - `20260808030000_com_002_slice_e_lifecycle.sql`  
4. Ensure Production env for SaaS Stripe prices + `STRIPE_SAAS_WEBHOOK_SECRET`  
5. Public smoke: `/`, `/modules`, `/pricing`, `/checkout`, `/demo`, `/enterprise`

## Explicitly out of scope for this authorize

- Implementing Slice F (Billing Portal)  
- Implementing Slice G  
- Capital Projects  
- Recreating or rewriting Slice A–E code  

## Human action required

This agent cannot merge PRs (GitHub write merge is not available).  
**Owner must merge PR #53 (or the sequential stack) to `main`**, then confirm Production deploy.
