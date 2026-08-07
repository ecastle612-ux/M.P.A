# Master Admin Verification — Phase E.5

| Surface | Expected | Status |
|---------|----------|--------|
| Launch Readiness copy | Mentions Phase E.1–E.5 | Updated |
| E.5 certification panel | Load org evidence for parts/locations/movements | Implemented |
| API | `GET /api/admin/facility/e5?organizationId=` | Implemented |
| Checks | part/location create, receive/issue/adjust audited, issueRequiresWo, MC stockout ready, search, timeline, audit, Assistant | Implemented |
| Pass rule | Parts + location + receive + issue + adjust present and checks all true | Implemented |

## Staging script (MA)

1. Entitled FO org with active site + open facility WO  
2. Create part (critical optional) with reorder defaults  
3. Create storeroom location  
4. Receive stock  
5. Issue to facility WO  
6. Adjust count with reason  
7. Drive quantity to stockout; confirm MC attention + Assistant  
8. Load E.5 panel → record Pass when badge shows Pass  
