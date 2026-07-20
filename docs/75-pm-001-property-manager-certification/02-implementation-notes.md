# 02 — Implementation Notes

**Package:** PM-001 · EP-011  
**Date:** 2026-07-19  
**Scope:** Presentation / copy / hide unfinished chrome only

---

## Files touched (presentation)

| Area | Files |
| --- | --- |
| Auth | `components/branding/auth-brand-shell.tsx` — removed Coming soon SSO/MFA chips |
| Leases | `lease-documents-panel.tsx`, `lease-form.tsx`, `leases/[leaseId]/page.tsx`, `lib/lease/server.ts` (seed titles/notes only) |
| Maintenance | `maintenance/[workOrderId]/page.tsx`, `maintenance-context-rail.tsx` |
| Residents | `tenants/[tenantId]/page.tsx`, `tenants-table.tsx` |
| Financials | `record-payment-form.tsx`, `generate-statement-form.tsx`, `expense-form.tsx` |
| Vendors | `vendor-form.tsx` |
| Communications | `announcement-readership-panel.tsx`, `notification-preferences-form.tsx` |
| Applicants | `applicant-documents-panel.tsx` |
| Facility (copy only) | `service-provider-intelligence-panel.tsx`, `property-overview-panels.tsx`, `facility/assets/[assetId]/page.tsx` |
| Portals | `portal/owner/layout.tsx`, `portal/manager/layout.tsx` |
| Docs | `docs/75-pm-001-*`, `docs/README.md` |

## Explicit non-touches

- No schema / RLS / API contract changes  
- No Accounting, ReportingService, Timeline, Ops Center, Command Center, Migration, Master Admin architecture changes  
- Internal `*Placeholder` field names retained  

## Verification commands

```bash
cd apps/web && npx tsc --noEmit -p tsconfig.json
npx eslint <touched files>
```
