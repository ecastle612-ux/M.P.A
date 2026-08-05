# 02 — Implementation Record

**Package:** MAC-002  
**Date:** 2026-08-05

---

## Root causes → remediations

| ID | Root cause | Fix |
|----|------------|-----|
| MAC-C01 | Org managers could write `master_admin` overrides; capability helper scanned overrides | Delete overrides; DB trigger blocks writes; helper is app_metadata only |
| MAC-C02 | Middleware used JWT flag; helper also accepted overrides | Both planes use `hasPlatformMasterAdminGrant` / JWT flag only |
| MAC-C03 | Owner Test Mode loaded live dashboard + interim all-org property fallback | Test Mode pages demo-only; interim all-org fallback removed; Manager Test Mode no live `/dashboard` escape |
| MAC-H01 | Audit Explorer card pointed at Impersonation | Card removed until real explorer exists |
| MAC-H02 | Test Mode button fell back to Open | Button omitted unless `testModePortal` set |
| MAC-H03 | Class D homes on branch | Brought STD-001 UDF remounts onto lineage |
| MAC-H04 | Search rendered above Greeting | Search moved below Insights / Launcher |
| MAC-H05 | Breakglass undocumented | Hybrid C documented; Platform Operator Mode callout; short-circuit scoped as HQ breakglass |
| MAC-H06 | Cookie TTL only | Server expires sessions > 8h in `getActiveMasterAdminSession` + migration cleanup |
| MAC-H07 | Audit insert ignored errors | `recordMasterAdminEvent` throws on failure |
| MAC-M01 | Cards implied distinct role canvases | Descriptions disclose shared Open destinations + View As for fidelity |
| MAC-M04 | MA shell reused STD-001 My Work metaphors | Labels → Impersonation / Recovery / Commercial |
| MAC-M07 | Duplicate Quick Actions strip | Removed; UDF Quick Actions only |
| MAC-L02 | Platform Operations = Mission Control | Alias card removed |

---

## Files modified (primary)

| Area | Paths |
|------|-------|
| Auth plane | `lib/master-admin/access.ts`, `middleware.ts`, `lib/auth/authorization.ts`, `lib/auth/identity/adapter.ts` |
| DB | `supabase/migrations/20260805010000_mac002_platform_master_admin_hardening.sql` |
| Sessions / audit | `lib/master-admin/session.ts` |
| Test Mode | `portal/owner/page.tsx`, `portal/tenant/page.tsx`, `portal/manager/page.tsx`, `lib/owner-portal/access.ts`, mode banner |
| Launcher | `workspace-launcher.tsx`, `portal-launcher-catalog.ts` (+ tests) |
| Mission Control | `operations-center-view.tsx` |
| HQ nav honesty | `navigation-config.ts` (+ NAV-001 tests) |
| Class D remount | commercial / financials / migration UDF (from STD-001) |
| Docs | `docs/124-mac-002-…` |

---

## Before / After (behavior)

| Behavior | Before | After |
|----------|--------|-------|
| Org grant of MA | Possible via overrides | Blocked (trigger + delete + helper) |
| Page vs API MA check | Divergent | Unified app_metadata |
| Owner / Resident Test Mode | Live org data possible | Demo fixture only |
| Manager Test Mode | Linked into live `/dashboard` | Demo only; exit banner required |
| Fake Test Mode buttons | Yes | Removed |
| Audit Explorer card | False capability | Removed |
| Platform Operations card | Duplicate of Mission Control | Removed |
| Shared role Open destinations | Implied unique canvases | Disclosed + View As guidance |
| MA My Work labels | Waiting on Me / etc. | Impersonation / Recovery / Commercial |
| More Quick Actions | Duplicated UDF | Removed |
| Search vs Greeting | Search first | UDF Greeting first |
| Session after 8h | Cookie only | Server ends row + clears cookie |
| Audit insert failure | Silent | Throws |
