# Sprint 7 — Performance Report

- Single org-scoped aggregation API (`GET /api/shared/reports`)
- Parallel Supabase reads with soft-fail (`safeSelect`) so missing tables do not crash the center
- Limits on list queries (properties 200, WOs 100, documents 200)
- Export regenerates snapshot on demand (PDF/CSV) — no background jobs
- No new chart library / no heavy client bundle for visualization
- Client loads one snapshot per filter change
