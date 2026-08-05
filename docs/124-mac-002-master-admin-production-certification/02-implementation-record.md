# 02 — Implementation Record

**Package:** MAC-002  
**Date:** 2026-08-05

---

## Root causes → remediations

| ID | Root cause | Fix |
|----|------------|-----|
| MAC-C01 | Org managers could write `master_admin` overrides; capability helper scanned overrides | Delete overrides; DB trigger blocks writes; helper is app_metadata only |
| MAC-C02 | Middleware used JWT flag; helper also accepted overrides | Both planes use `hasPlatformMasterAdminGrant` / JWT flag only |
| MAC-C03 | Owner Test Mode loaded live dashboard + interim all-org property fallback | Test Mode pages demo-only; interim all-org fallback removed |
| MAC-H01 | Audit Explorer card pointed at Impersonation | Card removed until real explorer exists |
| MAC-H02 | Test Mode button fell back to Open | Button omitted unless `testModePortal` set |
| MAC-H03 | Class D homes on branch | Brought STD-001 UDF remounts onto lineage |
| MAC-H04 | Search rendered above Greeting | Search moved below Insights / Launcher |
| MAC-H05 | Breakglass undocumented | Hybrid C documented; Platform Operator Mode callout; short-circuit scoped as HQ breakglass |
| MAC-H06 | Cookie TTL only | Server expires sessions > 8h in `getActiveMasterAdminSession` + migration cleanup |
| MAC-H07 | Audit insert ignored errors | `recordMasterAdminEvent` throws on failure |

---

## Files modified (primary)

| Area | Paths |
|------|-------|
| Auth plane | `lib/master-admin/access.ts`, `middleware.ts`, `lib/auth/authorization.ts` |
| DB | `supabase/migrations/20260805010000_mac002_platform_master_admin_hardening.sql` |
| Sessions / audit | `lib/master-admin/session.ts` |
| Test Mode | `portal/owner/page.tsx`, `portal/tenant/page.tsx`, `lib/owner-portal/access.ts`, mode banner |
| Launcher | `workspace-launcher.tsx`, `portal-launcher-catalog.ts` (+ tests) |
| Mission Control | `operations-center-view.tsx` |
| Class D remount | commercial / financials / migration UDF (from STD-001) |
| Docs | `docs/124-mac-002-…` |

---

## Before / After (behavior)

| Behavior | Before | After |
|----------|--------|-------|
| Org grant of MA | Possible via overrides | Blocked (trigger + delete + helper) |
| Page vs API MA check | Divergent | Unified app_metadata |
| Owner Test Mode | Live org properties possible | Demo fixture only |
| Resident Test Mode | Could mix live data | Demo fixture only |
| Fake Test Mode buttons | Yes | Removed |
| Audit Explorer card | False capability | Removed |
| Search vs Greeting | Search first | UDF Greeting first |
| Session after 8h | Cookie only | Server ends row + clears cookie |
| Audit insert failure | Silent | Throws |
