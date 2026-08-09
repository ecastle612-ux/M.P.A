# Phase 5 · Sprint 1 — Architecture Report

## Principle

Extend existing systems. Do not duplicate.

| Concern | Existing system | Sprint 1 action |
| --- | --- | --- |
| People | `pm_residents` | Expanded status check + labels |
| Applications | — | Additive `lease_applications` only |
| PM UI | `/pm/leasing` | Pipeline sections on same route |
| Lease signing | SignWell + lease command center | Unchanged; natural handoff after approve |
| Mission Control | `daily-ops-service` | Additional leasing attention items |
| Documents | Document Intelligence | Entity type `application` + link constraint |
| Reporting | `/shared/reports` | Optional `applications` facts + insights |
| Notifications | Catalog pattern (finance/leasing) | Leasing notification keys registered |
| PDFs | `PDF_EXPORT_TEMPLATES` + pdf-lib export | Five leasing template ids |
| Screening | — | Status + `screening_status=planned` only |

## Explicit non-builds

- No second leasing dashboard  
- No second person table  
- No screening vendor SDK / API  
- No SignWell redesign  
- No MC layout redesign  
- No new reporting product  
- No new PDF generation stack  
- No nav / auth / Stripe / commercial changes  

## Key code touchpoints

- Migration: `supabase/migrations/20260810010000_phase5_sprint1_leasing_applicant_lifecycle.sql`
- Shared: `packages/shared/src/leasing/applications.ts`, `notifications.ts`, `application-events.ts`
- Service: `apps/web/src/lib/leasing/application-service.ts`
- APIs: `/api/pm/leasing/applications`
- UI: `apps/web/src/components/leasing/leasing-directory.tsx`
- MC: `apps/web/src/lib/property/daily-ops-service.ts`
