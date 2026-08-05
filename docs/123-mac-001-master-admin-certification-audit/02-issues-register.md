# 02 — Issues Register

**Package:** MAC-001  
**Date:** 2026-08-05

Legend: **C** Critical · **H** High · **M** Medium · **L** Low

---

## Critical

| ID | Issue | Evidence / area |
|----|-------|-----------------|
| MAC-C01 | `master_admin` may be grantable via `organization_permission_overrides` writable by org managers → privilege escalation path | AUTH overrides RLS · `userHasMasterAdminCapability` |
| MAC-C02 | Middleware page gate checks only `dev_master_admin` app metadata; API/page helpers also accept override grants → inconsistent authorization plane | `middleware.ts` vs `access.ts` |
| MAC-C03 | Portal Test Mode not production-safe as “simulated”: Owner interim scope can expose all org properties; live services used on portal loaders | Owner access interim · portal pages |

---

## High

| ID | Issue | Area |
|----|-------|------|
| MAC-H01 | No dedicated Audit Explorer; launcher card mislabels Impersonation as audit | Workspace Launcher · compliance §1 |
| MAC-H02 | “Test Mode” button on non-API cards silently Opens live destinations | WorkspaceLauncher |
| MAC-H03 | Class D dashboards remain on this branch: commercial · financials · migration | STD-001 (PR #12 not merged here) |
| MAC-H04 | Universal Search renders above Greeting on Mission Control | STD-001 / UX-016 composition |
| MAC-H05 | MA permission short-circuit (`evaluatePermission` always true) without breakglass policy clarity | Authorization |
| MAC-H06 | MA session rows lack DB-enforced expiry (cookie-only 8h) | Session security |
| MAC-H07 | Audit event inserts ignore write failures | `recordMasterAdminEvent` |

---

## Medium

| ID | Issue | Area |
|----|-------|------|
| MAC-M01 | Many launcher cards alias identical Open destinations (dashboard/leases/financials/maintenance) | Role honesty |
| MAC-M02 | Applicant Open → `/leases` instead of applicants surface | Catalog |
| MAC-M03 | HQ subnav + sidebar synonym duplication | Navigation |
| MAC-M04 | MA-only nav metaphors (“Waiting on Me” → Impersonation) collide with STD-001 Waiting sections | IA |
| MAC-M05 | Documents / Analytics / Reports not first-class in MA hub IA | Coverage |
| MAC-M06 | Support fragmented across Recovery / inbox / push | Coverage |
| MAC-M07 | Quick Actions duplicated (UDF + More Quick Actions + launcher anchor) | UX |
| MAC-M08 | Health is table counts, not platform ops HQ | Monitoring |
| MAC-M09 | HQ-only shell hides Operations workspace; PM Open may bounce | Role testing |
| MAC-M10 | Sandbox / demo org isolation not certified | Test Mode |

---

## Low

| ID | Issue | Area |
|----|-------|------|
| MAC-L01 | Internal cards Open to Mission Control (self) | Catalog redundancy |
| MAC-L02 | Platform Operations vs Mission Control duplicate cards | Catalog |
| MAC-L03 | Flags page is env presence only (may be intentional) | Depth |
| MAC-L04 | STD-001 audit doc on this branch still lists Class D (stale vs PR #12) | Docs drift |

---

## Counts

| Severity | Count |
|----------|-------|
| Critical | 3 |
| High | 7 |
| Medium | 10 |
| Low | 4 |
| **Total** | **24** |
