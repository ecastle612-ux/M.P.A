# WF-002 — Improvements, Bugs, Recommendations

## Workflow / UI improvements shipped in this sprint

| Fix | Why |
| --- | --- |
| Ensure `pgcrypto` / `gen_random_bytes` | Day 1 property create hard-failed with raw SQL error |
| Invite send timeout + API error text | “Sending…” hung indefinitely |
| Setup current-step skips optional Invite | Wizard jumped backward after property create |
| Applicant lifecycle actions filtered by status | Invalid “Run” actions caused confusing failures |
| API error payload reads `error` (not only `message`) | Generic failure copy |
| Signature notification href → applicant/lease | Dead `/signatures/:id` link |
| Property default status → Active | Design partners left Draft by accident |
| Maintenance detail “Attachments & notes” | Removed “Future modules” dead-end wording for photos |
| Screening copy no longer says “noop stub” | Trust / professionalism |

## Click reduction opportunities

1. Guided applicant next-action (one primary CTA)
2. Approve → lease → signature package as combined “Continue leasing”
3. Prefill lease rent/dates from unit + planned move-in
4. Auto-skip invite when skipped previously (persist server-side)
5. Unit create default occupancy Vacant Ready
6. Property create “essentials only” collapsed advanced fields
7. Collections row → tenant/charge deep link
8. Vendor “Complete job” primary button
9. Portal home “Pay rent” when balance due
10. Command Center pinned intents (“overdue”, “open WOs”)

## Automation opportunities

1. Welcome announcement + portal invite email on convert/activation  
2. Auto generate rent charges on lease activate  
3. Sync screening decision → applicant status  
4. Signature complete → lease signed/activated  
5. Vendor assignment → vendor notification  
6. WO complete → resident confirmation request  
7. Late fee schedule  
8. Owner statement period auto-generate + export  
9. Document request → applicant notify  
10. Setup invite email delivery confirmation

## Critical bugs

| ID | Bug | Status |
| --- | --- | --- |
| C1 | `gen_random_bytes` missing broke property create / invites | **Fixed** (migration + applied) |
| C2 | Invite UI hung without timeout | **Fixed** |
| C3 | Signature notification deep link 404 | **Fixed** |
| C4 | Applicant lifecycle UI ignored allowed transitions | **Fixed** |
| C5 | API `{error}` ignored by several UIs | **Fixed** (key surfaces) |

## Minor bugs / gaps

| ID | Item | Status |
| --- | --- | --- |
| M1 | Hydration error overlay in app shell | Documented |
| M2 | Push banner vs sticky search click interception | Documented |
| M3 | No org logo upload | Documented |
| M4 | No export reports / audit trail UI | Documented |
| M5 | Resident document upload missing | Documented |
| M6 | Resident WO confirmation missing | Documented |
| M7 | Welcome notification not automated | Documented |
| M8 | Role preset chips don’t clearly change role semantics | Documented |

## Recommendations (priority)

1. Persist setup invite skip server-side; keep optional steps from becoming traps  
2. Collapse Day 1 forms to essentials-first  
3. Ship org Audit Trail + CSV export for charges/payments (partner must-have)  
4. Automate welcome + invite email on resident activation  
5. Add resident confirm on completed work orders  
6. Kill hydration mismatch causing Next.js issue badge  
7. Design → Document → Approve public applicant intake if partners need self-serve apply  

## Files changed (WF-002)

- `supabase/migrations/20260718044500_wf002_ensure_pgcrypto.sql` (+ applied remotely)
- `apps/web/src/lib/setup/server.ts`
- `apps/web/src/components/setup/setup-wizard.tsx`
- `apps/web/src/lib/applicant/events.ts`
- `apps/web/src/components/applicant/applicant-status-panel.tsx`
- `apps/web/src/lib/signature/server.ts`
- `apps/web/src/components/property/property-form.tsx`
- `apps/web/src/app/(app)/maintenance/[workOrderId]/page.tsx`
- `apps/web/src/components/portal/resident-work-order-form.tsx`
- `apps/web/src/components/portal/vendor-portal-home.tsx`
- `docs/54-wf-002-daily-operations-simulation/**`
