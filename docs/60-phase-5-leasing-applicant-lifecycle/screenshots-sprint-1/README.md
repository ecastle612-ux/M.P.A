# Phase 5 · Sprint 1 — Screenshots (Before / After)

## Capture notes

Operator auth is typically blocked in cloud agent environments (`AUTH_BLOCKED`).  
These notes document the intended visual delta for Owner LIVE verification.

## Before

| Shot | Surface | Observation |
| --- | --- | --- |
| B1 | `/pm/leasing` | Lease list + create wizard only; no applicant pipeline sections |
| B2 | Mission Control | Leasing attention limited to pending-signature leases / portal activation |
| B3 | Documents | No `application` entity type |

## After (Sprint 1)

| Shot | Surface | Observation |
| --- | --- | --- |
| A1 | `/pm/leasing` | Sections: Prospects, Applications, Approvals, Lease Signing, Move-ins, Renewals, Move-outs, All leases |
| A2 | Mission Control | Additional priorities: applications awaiting review, leases ready to sign, move-ins, renewals, screening pending |
| A3 | Documents filter | `application` entity available for linking without duplicate uploads |
| A4 | Application card | Actions: Submit, Enter screening (placeholder), Approve, Mark incomplete, Deny |

## Owner LIVE checklist

1. Open `/pm/leasing` as Property Manager — confirm pipeline sections match workspace language.  
2. Create or reuse one person through application → screening placeholder → approve → create lease.  
3. Confirm SignWell / offline path unchanged on lease detail.  
4. Confirm Mission Control shows leasing priorities without layout redesign.  
5. Confirm no second dashboard or duplicate person for the same email.

Place captured PNGs in this folder when available (`before-*.png`, `after-*.png`).
