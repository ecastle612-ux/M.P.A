# Error Handling Report

## Changes

1. **Global boundaries:** `app/error.tsx`, `app/global-error.tsx`
2. **Portal / auth / profile / settings:** error + loading segments
3. **Shared UI:** `FriendlyErrorState` — What happened / How to fix / Retry / Support
4. **Humanization:** expanded `humanizeErrorMessage` (SQL codes, stack leaks, Stripe/OneSignal/Checkr/Dropbox/storage/hydration)
5. **API internals:** `apiInternalError` recovery-oriented copy
6. **404 / 403 pages:** professional recovery language (not “Unauthorized” jargon)

## Surfaces covered

| Area | Before | After |
| --- | --- | --- |
| Root app crash | risk of white screen | Friendly retry + support |
| Layout crash | unhandled | `global-error.tsx` |
| Portals | gap | error + skeleton loading |
| Auth | gap | error + branded loading |
| Profile / settings | gap | error + loading |
| Ops modules | segment errors | retained + Ops uses FriendlyErrorState |

## Remaining risk

Not every client `catch` block in the entire tree uses `readApiError` yet. Priority forms (payments, lifecycle, migration, setup) do. A follow-up lint rule / codemod can close long-tail surfaces.
