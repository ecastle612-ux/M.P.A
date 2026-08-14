# PLAT-002 APPLICATION DEPLOYMENT CERTIFICATION

**Title:** PLAT-002 APPLICATION DEPLOYMENT CERTIFICATION  
**Status:** PRODUCTION RELEASE SUCCESSFUL  
**Date:** 2026-08-14  
**Recorded at:** 2026-08-14T15:37:00Z  
**Program:** PLAT-002  
**Authority:** [docs/94](../94-plat-002-authorization-hardening/index.md) Approved · [docs/95](../95-plat-002-authorization-hardening-implementation-certification/index.md) READY · [ADR-026](../18-decision-log/adr-026-authorization-hardening-pipeline.md) Accepted  
**Prior database apply:** docs/99 (PR #207) — ledger `20260814151825` / `plat_002_production_compat` already live  
**Production project:** `mpa-prod` / `vahnmcrpnuggxkivynvo`  
**Serving app:** Vercel `m-p-a-web` / `www.my-property-assistant.com`  
**Billing / Stripe / roles / SKUs:** No changes  
**Database migrations this record:** None applied  

---

## Final verdict

**PRODUCTION RELEASE SUCCESSFUL**

PR [#203](https://github.com/ecastle612-ux/M.P.A/pull/203) merged to `main` with a merge commit (no squash, rebase, force-push, or cherry-pick). Production auto-deployed the new `main` SHA. Unauthenticated catalogued APIs now return JSON 401 with no `Location` redirect. Database ledger is unchanged. No incident.

---

## 1. PR #203 validation

| Check | Result |
|-------|--------|
| Title | feat: PLAT-002 Authorization Hardening Implementation |
| CI `verify` | **SUCCESS** — [run 31814629064](https://github.com/ecastle612-ux/M.P.A/actions/runs/31814629064) completed 2026-08-14T15:30:55Z |
| Vercel Preview | **SUCCESS** — `EqUuvP6btt3CFtzWhQXsvXxjCLyc` |
| Mergeable state at merge | `MERGEABLE` (lint-only follow-up `09554b00` cleared the prior `UNSTABLE` verify) |
| Scope vs [docs/95](../95-plat-002-authorization-hardening-implementation-certification/index.md) | **Match** |

### Included (docs/95)

| Delivery | Present on merged tree |
|----------|:----------------------:|
| `requireAuthorizedAction` pipeline | ● |
| API JSON 401/403 middleware (pages still redirect) | ● |
| Finance / property / report wrappers | ● |
| Communication permission alignment (`PM_COMMS_STAFF_ROLES` + `is_pm_comms_staff`) | ● |
| Facility / maintenance / residents / leasing / documents wrappers | ● |
| `requiredEntitlementForApiPath` / `evaluateApiPathEntitlement` | ● |
| `orgAllowsWorkSurface` | ● |

Historical file `supabase/migrations/20260814160000_plat_002_authorization_hardening.sql` is in the tree. It was **not** applied. Production remains on the successor ledger only.

No new features, roles, SKUs, billing, or Stripe objects.

---

## 2. Merge evidence

| Field | Value |
|-------|--------|
| Method | `gh pr merge 203 --merge` |
| Merged at | 2026-08-14T15:31:11Z |
| Merge commit / new `main` SHA | `4b45c6e2f62c70db195b03885ed7d079ae8c9ccd` |
| Prior `main` / prior Production SHA | `102b63da5f606e8a625e9d547e1e3e8964af4b4a` |
| Range | `102b63da..4b45c6e2` |
| History rewrite | None |

---

## 3. Production deployment evidence

| Field | Value |
|-------|--------|
| GitHub Production deployment ID | `5908886188` |
| Timestamp | 2026-08-14T15:32:23Z |
| Commit | `4b45c6e2f62c70db195b03885ed7d079ae8c9ccd` |
| Status | **success** — “Deployment has completed” |
| Status ID | `16819475092` |
| Target / log | `https://m-p-a-hd17rka0y-ecastle612-uxs-projects.vercel.app` |
| Live host | `https://www.my-property-assistant.com` |
| Observed Vercel build id (font preload `dpl`) | `dpl_8fhVn7YaVNTu1PLR94U3HGED1bdm` |
| Mechanism | Vercel Git integration on `main` (no CLI / MCP deploy) |

Database ledger after deploy (unchanged):

| Version | Name |
|---------|------|
| `20260814151825` | `plat_002_production_compat` |
| `20260814160000` / `plat_002_authorization_hardening` | **Absent** (0 rows) |

`maintenance_notifications` still absent. Counts unchanged: 31 memberships, 6 subscriptions (5 Property Manager + 1 Complete + **0** Facility Operations), 30 work orders, 2 conversations, 8 messages, 3 SKUs, 393 role grants.

---

## 4. Post-deploy security validation

### API (live `www`, unauthenticated)

Recorded 2026-08-14T15:35:43Z.

| Request | Status | `Content-Type` | Body | `Location` |
|---------|-------:|----------------|------|:----------:|
| `GET /api/finance/snapshot` | 401 | `application/json` | `{"error":"Unauthenticated"}` | — |
| `GET /api/pm/properties` | 401 | `application/json` | `{"error":"Unauthenticated"}` | — |
| `GET /api/facility/operations` | 401 | `application/json` | `{"error":"Unauthenticated"}` | — |
| `GET /api/shared/reports` | 401 | `application/json` | `{"error":"Unauthenticated"}` | — |
| `GET /api/shared/communications/conversations` | 401 | `application/json` | `{"error":"Unauthenticated"}` | — |
| `GET /api/pm/maintenance` | 401 | `application/json` | `{"error":"Unauthenticated"}` | — |
| `GET /api/shared/documents` | 401 | `application/json` | `{"error":"Unauthenticated"}` | — |
| `GET /pm/financial-operations` (page) | 307 | text | — | `/login` |

Catalogued APIs return JSON 401. No API redirects. UI pages still redirect. Authenticated 403 (`{ code: "entitlement" }`) is implemented in middleware on this SHA and covered by unit tests; it was not replayed with a live cookie session in this environment.

### Property / Facility / Complete surfaces

Live helper `org_allows_work_surface` on UAT orgs (read-only):

| Org | SKU | residential | facility |
|-----|-----|:-----------:|:--------:|
| M.P.A. UAT Property Demo `a11ce002-…00c2` | `mpa_property_manager` | ● | — |
| M.P.A. UAT Clinic Demo `a11ce001-…c11c` | `mpa_complete_platform` | ● | ● |

Application catalog on deployed SHA (`evaluateApiPathEntitlement` / `orgAllowsWorkSurface` / `requireAuthorizedAction`):

| Actor SKU | Property / finance APIs | Facility APIs |
|-----------|:-----------------------:|:-------------:|
| Property Manager | ● | — |
| Facility Operations | — | ● |
| Complete | ● | ● |

No production organization has a Facility Operations subscription. FO facility-allow / residential-deny is certified by helper definition + application tests. It was not exercised on a live FO tenant.

### Communications

JWT `request.jwt.claim.sub` + live helpers on Property Demo (same actors as docs/91; passwords not used):

| Actor | `is_pm_comms_staff` | Own thread `can_access_tenant_conversation` |
|-------|:-------------------:|:-------------------------------------------:|
| PM `property_manager` | ● | ● |
| Tenant | — | ● |
| `facility_technician` | — | — |

Next.js staff allowlist remains `organization_admin` / `property_manager` / `leasing_agent`.

### Reports

`requireReportPermission` requires `platform.reports` (documents-read bypass removed). Live `GET /api/shared/reports` is JSON 401. Surface entitlement map is unchanged: PM and Complete have `platform.reports`; FO isolation remains on facility vs residential APIs.

### Application tests on merged SHA `4b45c6e2`

| Suite | Result |
|-------|--------|
| `@mpa/shared` `api-entitlements.test.ts` + `conversations.test.ts` | 17 passed |
| `@mpa/web` `require-authorized-action.test.ts` + `plat-002-rls.test.ts` | 22 passed |

---

## 5. Incident status

**None.**

No rollback. No schema apply. No Stripe / SKU / role writes. No customer-facing outage observed on `www` homepage (`HTTP/2 200`) or catalogued API contract.

---

## Residuals (non-blocking)

- Live cookie-session UI walkthrough (PM / FO / Complete / tenant browsers) was not executed — this environment has no UAT passwords.
- Live authenticated JSON 403 was not observed for the same reason.
- No live Facility Operations customer org exists (0 FO subscriptions).

---

## Explicitly not done

- Database migrations (including replay of `20260814160000`)
- Creating `maintenance_notifications`
- New features, roles, SKUs, billing, or Stripe changes
- Merge of unrelated PRs (#201, #204–#207)

---

**STOP.** Certification only. No further deploy or schema apply from this record.
