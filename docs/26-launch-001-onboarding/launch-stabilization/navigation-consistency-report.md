# 4. Navigation Consistency Report

**Parent:** [Launch Stabilization](./index.md)  

---

## Sources of truth

| Audience | Definition |
|----------|------------|
| PM / Shared / Facility | `packages/shared/src/commercial/modules.ts` → `navigationGroupsForSku` |
| Master Admin | `packages/shared/src/commercial/master-admin.ts` → `MASTER_ADMIN_NAV` |
| Portals | `apps/web/src/components/portal/navigation.ts` |
| Role homes | `defaultHomeForRole` / `defaultHomeForSku` |

---

## Inconsistencies found

| Issue | Before | After / status |
|-------|--------|----------------|
| Team invite not in sidebar | Only org panel + Mission Control CTA | **Fixed** — Team under Shared Platform |
| Settings label vs Organization | “Settings” → org only | Renamed **Organization** + **Team** |
| Master Admin mobile | No nav | **Fixed** — header Menu |
| Portal nav in Card | Extra chrome | Simplified to nav landmark |
| Manager portal vs PM app | Dual surfaces | Documented; not removed (would be product change) |
| Global search mobile | Hidden `< md` | P2 — keep; ResponsiveNavigation covers modules |
| Facility Capital Projects | Route exists, nav commented | Intentional; leave |

---

## Role → primary home

| Role | Home |
|------|------|
| organization_admin / property_manager | `/pm/mission-control` |
| leasing_agent | `/pm/leasing` |
| maintenance_technician | `/pm/maintenance` |
| property_owner | `/portal/owner` |
| tenant | `/portal/tenant` |
| vendor | `/portal/vendor` |
| platform operator (admin) | `/admin` via profile menu |

---

## Consistency rules (launch)

1. One nav source per shell — do not hardcode parallel sidebars.  
2. Existing destinations must be reachable from nav if Mission Control recommends them.  
3. Planned Facility items must stay labeled Planned.  
4. Portals stay role-thin; staff work stays in `(app)`.  

---

## Verdict

Navigation is **coherent for Customer #1** after Team + Master Admin mobile fixes.
