# WF-001 — Integration, UX, Data, QA

## Integration Report

| Integration | Status | Graceful failure |
| --- | --- | --- |
| Supabase Auth/DB/RLS | Required | Errors surface as API/UI messages |
| Storage / Media | Available | Upload failures shown in MediaUpload |
| OneSignal | Adapter + noop | notify() catches provider failures |
| Stripe sandbox | API-005 adapters | Unknown provider / missing keys fail closed with API errors |
| Dropbox Sign sandbox | API-004 | Noop/sandbox path; request failures return messages |
| Checkr sandbox | API-003 | Noop/sandbox path |
| Resend / Twilio | Not primary in these journeys | Notification service degrades to in-app |

## UX Improvements (polish only)

- Resident portal home is a real hub with next-step links
- Maintenance photo upload replaces “future module” placeholder copy
- Applicant next-steps panel clarifies convert → lease → signature
- Vendor portal shows assigned queue instead of foundation shell
- Empty states for maintenance/documents/notifications when linked data missing

## Data Integrity Report

- `tenants.user_id` added and linked on invite accept / email claim
- Convert creates tenant once; re-convert blocked
- Vault docs transferred on convert (existing)
- Charge/payment/maintenance events continue to write activity + notifications
- Migration lease import creates lease links when dependencies resolve
- Known residual risk: email-only vendor matching for portal queue (no `vendors.user_id` yet)

## Regression Tests Added

- `qa/e2e/tests/workflows/wf001-journeys.spec.ts` — destination coverage for all six workflows
- `qa/e2e/src/workflows/resident/submit-maintenance.ts` — helper for resident maintenance submit

## Files Changed (primary)

- `supabase/migrations/20260718015050_wf001_workflow_completion_foundation.sql`
- Setup: `apps/web/src/lib/setup/server.ts`
- Applicant/activation: `applicant-status-panel.tsx`, `applicant/server.ts`, invitations accept route
- Resident portal pages + components under `portal/tenant/**`, `components/portal/**`
- Maintenance notify + form media; vendor portal
- Financial charge notify + tenant user recipients
- Migration lease import
- QA-001 expansion under `qa/e2e/**`
- Docs: `docs/53-wf-001-workflow-completion/**`

## Remaining Known Issues

1. No public self-serve application intake URL
2. Vendor identity is email-matched (not first-class `vendors.user_id`)
3. Full Playwright mutate journeys still require seeded auth environments
4. Some advanced financial ops (disputes, real ACH settlement) remain sandbox-constrained
5. Hydration/console audits are environment-dependent and should be re-run in CI with auth seeds

## Recommended Next Steps

1. Apply migration `20260718015050_wf001_workflow_completion_foundation.sql` to all environments
2. Seed design-partner PM + resident + vendor users; smoke the six journeys manually once
3. Add authenticated Playwright create/mutate scenarios (not only destination loads)
4. Design → Document → Approve public applicant intake if partners need it
5. Add `vendors.user_id` if vendor portal scale requires stronger identity
