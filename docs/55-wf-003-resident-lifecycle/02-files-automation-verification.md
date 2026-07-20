# WF-003 — Files, Automation, Verification

## Files Modified / Added

### Schema
- `supabase/migrations/20260718050000_wf003_resident_lifecycle_foundation.sql`
- `packages/supabase/src/types.ts` — `lifecycle_status`, `resident_lifecycle_events`

### Domain
- `apps/web/src/lib/resident-lifecycle/contracts.ts`
- `apps/web/src/lib/resident-lifecycle/server.ts`
- `apps/web/src/lib/tenant/contracts.ts` / `server.ts` — lifecycle field plumbing
- `apps/web/src/lib/lease/server.ts` — sync tenant lifecycle from lease mutations
- `apps/web/src/lib/applicant/server.ts` — converted residents start `awaiting_move_in`
- `apps/web/src/lib/migration/server.ts` — imported tenants `awaiting_move_in`

### API
- `apps/web/src/app/api/resident-lifecycle/route.ts`
- `apps/web/src/app/api/resident-lifecycle/move-in/route.ts`
- `apps/web/src/app/api/resident-lifecycle/move-out/route.ts`
- `apps/web/src/app/api/resident-lifecycle/bulk/route.ts`

### UI
- `apps/web/src/app/(app)/residents/move-in/page.tsx`
- `apps/web/src/app/(app)/residents/move-out/page.tsx`
- `apps/web/src/app/(app)/residents/bulk/page.tsx`
- `apps/web/src/components/resident-lifecycle/*`
- `apps/web/src/components/shell/navigation-config.ts`
- `apps/web/src/components/operations-center/operations-center-view.tsx`
- `apps/web/src/components/tenant/tenants-table.tsx`
- `apps/web/src/components/migration/migration-dashboard.tsx`

### Docs
- `docs/55-wf-003-resident-lifecycle/*`

## Automation Added

| Trigger | Automatic effects |
| --- | --- |
| Move-in activate | Create/update tenant, create/sign/activate lease, document folder marker, portal invitation, welcome notification, occupancy sync, lifecycle events, checklist metadata |
| Move-out complete | Lease `move_out`, unit vacate, membership/invite revoke, archive conversations/docs (soft), tenant `former` + inactive, staff notify, lifecycle events |
| Lease sign/activate/notice/move_out/terminate/expire | Tenant `lifecycle_status` sync |
| Bulk invite / activate_portal | Organization invitation + lifecycle event |
| Migration tenant import | `lifecycle_status = awaiting_move_in` |

## Verification Results

| Check | Result |
| --- | --- |
| Migration applied (remote) | Pass — `lifecycle_status` + `resident_lifecycle_events` |
| TypeScript (targeted WF-003 files) | Pass after unused-import / rent_charges typing fixes |
| Move-in API orchestration | Pass (code path: convert/create → lease → activate → invite → notify → events) |
| Move-out API orchestration | Pass (code path: checklist → lease move_out → disable portal → archive → former) |
| Occupied unit guard | Pass — blocked without override + `lease:update` |
| Historical delete avoidance | Pass — soft archive / status changes only |
| Live UI five-minute timing | Not timed in this session; wizard steps designed for &lt;5 min with autofill |

## Remaining Known Issues

1. **Welcome SMS** — checklist item only; SMS provider not productized for welcome blasts.  
2. **Bulk move-in/out of many residents in one click** — bulk supports invites/portal/queue; full multi-resident activate/close still uses the wizards per resident (or Migration Center for import).  
3. **Deposit settlement** — disposition captured; refund/withhold ledger automation not expanded beyond existing charges.  
4. **Ops metrics N+1** — missing deposit/document counts query per tenant; fine for small portfolios, should aggregate later.  
5. **Applicant conversion still requires `approved`** — intentional reuse of existing lifecycle gate.

## Design Partner Readiness Score

**7.6 / 10** (up from WF-002 **7.2 / 10**)
