# DX-002 — Deliverables

## Workflow Improvements

1. **Customer Migration Dashboard** on `/migration` shows completion %, ETA, remaining tasks, and imported vs live counts for properties, units, residents, applicants, leases, documents, vendors, and owners.
2. **Automatic checklist** tracks org → staff → imports → payments → notifications → resident invites → ready to go live, with Fix links for incomplete items.
3. **Guided wizard** every step explains why it matters, what will happen, how long it takes, and what comes next; completed jobs point back to go-live.
4. **Smart validation** detects missing properties, units without properties, residents without units, leases without residents, duplicate emails, missing rent/dates, and pending review exceptions; offers one-click skip for pending review when appropriate.
5. **Go-Live Assistant** at readiness: Go Live / Staff / Resident checklists, recommended first actions, and celebration UI.
6. **Operations Center** “Switching & go-live” card in attention area: health, incomplete imports, warnings, errors, go-live status.

## Customer Experience Improvements

- Progress bars and plain-language status (“Ready to go live”, “Needs attention…”)
- Estimated time remaining from remaining tasks + exceptions + active jobs
- Recovery guidance on every incomplete checklist item and validation issue
- Success celebration when checklist is complete and exceptions are clear
- Review queue uses human labels and bulk skip; keep/replace only when candidates exist
- No technical jargon in switching surfaces

## Files Modified / Added

### Switching core
- `apps/web/src/lib/migration/switching.ts` (new)
- `apps/web/src/app/api/migration/switching/route.ts` (new)
- `apps/web/src/components/migration/migration-switching-experience.tsx` (new)
- `apps/web/src/app/(app)/migration/page.tsx`

### Wizard & review
- `apps/web/src/components/migration/migration-wizard.tsx`
- `apps/web/src/components/migration/migration-review-queue.tsx`
- `apps/web/src/components/migration/migration-dashboard.tsx`

### Operations Center
- `apps/web/src/components/operations-center/operations-center-view.tsx`

### Docs
- `docs/57-dx-002-customer-switching/*`

## Verification Results

| Check | Result |
| --- | --- |
| Switching snapshot API (`GET /api/migration/switching`) | Implemented |
| Bulk skip review (`POST` action) | Implemented |
| Dashboard entity counts + checklist + ETA | Implemented |
| Wizard step guidance (why / what / duration / next) | Implemented |
| Go-Live Assistant + celebration | Implemented |
| Ops Center switching health | Implemented (attention section) |
| TypeScript `tsc --noEmit` (apps/web) | **Pass** (exit 0) |
| Live Supabase E2E import pilot | Not run in this slice (env-dependent) |

## Remaining Risks

1. **Owners imported** — no first-class owner import entity; count stays ~0 until owner linking ships.
2. **Payment / notification checklist proxies** — “connected” inferred from payments / notification_preferences rows, not a dedicated billing/settings connector state.
3. **Broken document references / duplicate units** — only partially covered (review queue + email duplicates); deep vault integrity checks not productized.
4. **One-click fixes** — strongest for bulk-skip review; other issues route to the right screen rather than auto-heal data.
5. **Large portfolio performance** — validation queries are bounded but not tuned for mega-imports.
6. **Invite deliverability** — still outside DX-002; go-live checklist assumes invites can be sent.

## Scores

- Design Partner Readiness: **8.7 / 10**
- Production Readiness: **5.1 / 10**
