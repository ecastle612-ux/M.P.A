# 02 — Defect Register

**Package:** EP-016 · 2026-07-20

## Repaired during certification

| ID | Severity | Finding | Root cause | Fix | Verification |
| --- | --- | --- | --- | --- | --- |
| EP016-D1 | **P0** | Completing a work order via **vendor assignment → completed** left **no Facility Record**; property repair history empty until a later reopen/re-complete through `updateWorkOrder` | `updateVendorAssignmentStatus` set WO `status=completed` without calling `upsertFacilityRecordOnWorkOrderCompleted`. Subsequent WO `update` with `status=completed` was a no-op (already completed), so FAC-001 never ran | `apps/web/src/lib/vendor/assignments.ts` — on vendor `completed`, copy completion notes to WO `internal_notes` and call `upsertFacilityRecordOnWorkOrderCompleted` | New WO `f32902fb-…` vendor-completed → Facility Record `076e844b-…` created immediately |

## Observed issues — not repaired (scope / env / product gaps)

| ID | Severity | Finding | Classification | Notes |
| --- | --- | --- | --- | --- |
| EP016-O1 | P0 (Commercial) | Stripe live payment path not certified this run | Environment / safety | `PAYMENT_PROVIDER=stripe`, `STRIPE_MODE=live`, `STRIPE_ALLOW_SIMULATE=false`. Unattended live card charge refused |
| EP016-O2 | P0 (Commercial www) | Hosted production Resend secrets incomplete | Environment | Prior INT-303: Vercel Production missing `RESEND_API_KEY` / `EMAIL_FROM` / `EMAIL_REPLY_TO` (local Resend PASS) |
| EP016-O3 | P1 | Announcement publish with `pushRecipientCount=0` / `audienceUserCount=0` | Data / workflow | Resident created without portal `user_id` / enrollment. Product path works; delivery audience empty |
| EP016-O4 | P2 | No `maintenance_summary` report type | Missing capability | FIN-001 catalog has owner statement, P&amp;L, rent roll, cash flow, expense, delinquency only. Not invented during cert |
| EP016-O5 | P2 | Manual rent charge + lease activation auto-charges can stack | UX / operator confusion | Activation runs `generateRentChargesForActiveLease` → “Monthly rent” + “Security deposit”. Manual “EP-016 July rent” also created → outstanding $3,300. Duplicate *payments* blocked correctly |
| EP016-O6 | P2 | Master Admin surfaces not fully walked | Session limitation | Current user correctly denied; need `ecastle612@gmail.com` session for Provider Health / testing utilities deep cert |
| EP016-O7 | P3 | Full-name tenant search `"Cert Resident"` returned 0; single-token `"Cert"` / `"Resident"` returned 1 | Search UX | Tokenization / multi-word search weakness |

## Explicitly out of scope

- New features (Maintenance Summary report, Stripe test-mode switcher, etc.)
- Redesign / Canopy changes
- Production secret injection on Vercel (ops, not code)
