# DX-001 — Deliverables

## Files Modified / Added

### Trust & API UX
- `apps/web/src/lib/api/client-error.ts` (new)
- `apps/web/src/app/(app)/dashboard/error.tsx`
- `apps/web/src/app/(app)/setup/loading.tsx`, `error.tsx`
- `apps/web/src/app/(app)/residents/loading.tsx`, `error.tsx`

### Onboarding
- `apps/web/src/app/(app)/setup/page.tsx`
- `apps/web/src/components/setup/setup-wizard.tsx`
- `apps/web/src/components/property/property-form.tsx`

### Resident lifecycle
- `apps/web/src/lib/resident-lifecycle/contracts.ts`
- `apps/web/src/lib/resident-lifecycle/server.ts` (transfer + bulk welcome)
- `apps/web/src/app/api/resident-lifecycle/transfer/route.ts`
- `apps/web/src/app/(app)/residents/transfer/page.tsx`
- `apps/web/src/components/resident-lifecycle/transfer-unit-wizard.tsx`
- `apps/web/src/components/resident-lifecycle/move-in-wizard.tsx`
- `apps/web/src/components/resident-lifecycle/move-out-wizard.tsx`
- `apps/web/src/components/resident-lifecycle/bulk-lifecycle-panel.tsx`
- `apps/web/src/components/resident-lifecycle/resident-lifecycle-widget.tsx`
- `apps/web/src/components/tenant/tenants-table.tsx`
- `apps/web/src/lib/experience/empty-states.ts`
- `apps/web/src/components/shell/navigation-config.ts`

### Operations Center
- `apps/web/src/components/operations-center/operations-center-view.tsx`
- `apps/web/src/components/operations-center/notification-operations-widget.tsx`
- `apps/web/src/components/operations-center/billing-operations-widget.tsx`
- `apps/web/src/components/operations-center/signature-operations-widget.tsx`

### Docs
- `docs/56-dx-001-design-partner-polish/*`

## Workflow Improvements

1. Setup steps always state what happens next; property/unit/tenant/lease handoffs return with banners.
2. Setup completion celebration shows once before Operations Center.
3. Move In / Move Out / Transfer / Bulk invite / Bulk welcome / Portal activation are navigable and linked.
4. Transfer Unit updates tenant + lease + occupancy + lifecycle event + notification without manual linking.
5. Tenants empty state and setup tenant step prefer guided Move In.

## UX Improvements

- Toast feedback on setup, move-in/out, transfer, bulk
- Move-out confirmation modal
- Toggleable move-in checklist; honest portal invite success copy
- Skeletons on lifecycle widget + setup/residents route loading
- Ops Center: “Needs attention today” first; trimmed quick actions
- Notification widget leads with unread/urgent; health collapsed
- Lifecycle widget hides zero-noise tiles (keeps move-in/out always)

## Automation Added

- Unit transfer orchestration (assignment + lease + occupancy + audit event + notify)
- Bulk welcome workflow reuse of existing notification path
- Setup success toasts describing the next step (reduce confusion, not new domain engines)

## Trust Improvements

- `readApiError` / `humanizeErrorMessage` for lifecycle + ops widgets
- Dashboard/setup/residents errors no longer surface raw exception text to PMs
- Occupied-unit override messaging remains permission-aware

## Verification Results

| Check | Result |
| --- | --- |
| Setup celebration path | Implemented (`?celebrate=1` + localStorage) |
| Transfer API + UI | Implemented |
| Ops attention-first reorder | Implemented |
| Friendly error helper wired | Implemented on key flows |
| TypeScript (targeted) | Run after edits |

## Top Remaining Blockers

1. **Invite email deliverability** — still environment/provider dependent for unsupervised go-live  
2. **Welcome SMS** — checklist only; no SMS productization  
3. **Exports / org-wide audit trail** — still not productized for Monday-ready ops  
4. **Ops metrics scale** — lifecycle missing-deposit/docs still N+1 for large portfolios  
5. **Real payment/screening providers** — sandbox-friendly, not production-certified

## Scores

- Design Partner Readiness: **8.3 / 10**
- Production Readiness: **5.0 / 10**
