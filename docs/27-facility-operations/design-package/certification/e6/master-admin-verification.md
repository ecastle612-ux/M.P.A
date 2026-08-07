# Master Admin Verification — Phase E.6

| Surface | Expected | Status |
|---------|----------|--------|
| Launch Readiness copy | Mentions Phase E.1–E.6 | Updated |
| E.6 certification panel | Org evidence for programs/incidents/obligations/WOs/docs | Implemented |
| API | `GET /api/admin/facility/e6?organizationId=` | Implemented |
| Checks | E6-1…E6-4 signals + search/timeline/audit/Assistant/MC | Implemented |

## Staging script (MA)

1. Active FO site + documents access  
2. Create inspection program with checklist; start + fail an item → confirm spawned WO  
3. Report high-severity safety incident → MC + notification  
4. Create overdue/past due obligation; satisfy with evidence document  
5. Load E.6 panel → record Pass  
