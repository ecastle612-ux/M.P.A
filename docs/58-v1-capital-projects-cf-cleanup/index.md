# Version 1.0 — Capital Projects customer-facing cleanup

**Branch:** `cursor/v1-remove-capital-projects-cf-82f3`  
**Rule:** Remove customer-facing references only. Keep architecture, entitlements, routes, and feature flags.

## Repository search summary

| Area | Finding |
|------|---------|
| Marketing landing / modules | Customer-facing copy mentioning Capital Projects |
| FO `/facility/capital-projects` | Shell page with deferred/coming-soon style copy |
| Master Admin workspaces / product matrix | Listed Capital Projects as future |
| `upgradeCuesForSku(complete)` | Returned Capital Projects upgrade cue |
| Nav groups | Already omitted Capital Projects from FO nav |
| Marketing catalog helpers | Already filtered `capital_projects` |
| Entitlements / route map / COMMERCIAL_MODULES id | Internal — retained |
| Blueprint `docs/**` | Internal governance — retained |
| CSS `capitalize` / unrelated “capital” | Not Capital Projects — retained |

## Removed / neutralized (customer-facing)

1. `apps/web/src/components/marketing/public-landing-page.tsx`
   - Removed “Capital Projects are not offered today”
   - Removed “Capital Projects excluded” from FO section
   - Removed “without Capital Projects” from Complete section
   - Removed FAQ “Is Capital Projects available?”
2. `apps/web/src/components/marketing/modules-page.tsx`
   - Removed “· Capital Projects excluded”
3. `apps/web/src/app/(app)/facility/capital-projects/page.tsx`
   - Route kept; page now redirects to Facility Mission Control (no Capital UI/copy)
4. `packages/shared/src/commercial/modules.ts`
   - Removed Complete Platform Capital Projects upgrade cue
   - Removed stale Capital Projects nav comment
5. `packages/shared/src/commercial/master-admin.ts`
   - Filter Capital Projects out of Version 1.0 operator workspace list
6. `apps/web/src/components/admin/master-admin-pages.tsx`
   - Product matrix omits Capital Projects; no “●/future” cell
   - `/admin/workspaces/capital_projects` treated as unknown workspace
7. `apps/web/src/components/facility/facility-module-page.tsx`
   - Neutralized residual `capital` domain copy (domain key retained)
8. Tests updated for Master Admin workspaces + Complete upgrade cues

## Retained (internal)

- `COMMERCIAL_MODULES` entry `capital_projects` (id/entitlement/href)
- `facility.capital_projects` entitlement + `FUTURE_FACILITY_ENTITLEMENTS`
- Route entitlement map `/facility/capital-projects`
- Acquisition filters excluding Capital from marketing catalogs
- Blueprint / ADR / governance docs

## Regression checklist

| Surface | Expected |
|---------|----------|
| Navigation | Unchanged FO/PM/shared nav (Capital already absent) |
| Pricing | No Capital copy |
| Marketing landing / modules | No Capital mentions |
| Commercial Platform | Unchanged SKUs |
| Property Manager / FO / Resident | Unchanged |
| Documents / Reports | Unchanged |
| Master Admin | Capital omitted from matrix/workspaces |

## Deployment rule

1. PR  
2. **Owner acceptance**  
3. Merge  
4. Production deploy  
5. LIVE verify  
6. Owner LIVE acceptance  

Do **not** merge until Owner acceptance.

## Related

- [Background Screening marketing messaging](./messaging-background-screening.md)
