# PLAT-003 PLATFORM MISMATCH AUDIT CLOSURE

**Title:** PLAT-003 PLATFORM MISMATCH AUDIT CLOSURE  
**Status:** Audit complete — C1–C5 **CLOSED**  
**Date:** 2026-08-14  
**Recorded at:** 2026-08-14T15:48:00Z  
**Program:** PLAT-003  
**Parent audit:** PLAT-001 (docs/93, PR #201)  
**Remediation:** [docs/94](../94-plat-002-authorization-hardening/index.md) Approved · [docs/95](../95-plat-002-authorization-hardening-implementation-certification/index.md) READY · [ADR-026](../18-decision-log/adr-026-authorization-hardening-pipeline.md) Accepted  
**Application deploy:** docs/100 (PR #208) — **PRODUCTION RELEASE SUCCESSFUL**  
**Audited SHA:** `4b45c6e2f62c70db195b03885ed7d079ae8c9ccd` (`origin/main`)  
**Production app:** Vercel Production deployment `5908886188` serving `www.my-property-assistant.com`  
**Production database:** Supabase `mpa-prod` / `vahnmcrpnuggxkivynvo`  
**Gate:** Design → Document only. **No implementation authorized.**

---

## Constraints honored

This audit did **not**:

- Change application code, UI, or tests
- Write or apply migrations
- Change production data, Auth, Storage, or Edge Functions
- Change billing, Stripe products, prices, or checkout
- Merge or deploy anything

---

## Final verdict

**PLAT-001 Critical findings C1–C5 are CLOSED** on Production at `4b45c6e2`.

The approved PLAT-002 pipeline, API catalog, work-order surface RLS, and tenant-comms staff helper are live. Remaining PLAT-001 High / Medium / Low items are **non-blocking** for this closure. They are residuals and future recommendations, not reopeners of C1–C5.

---

## 1. Method (read-only)

| Layer | How verified | Writes |
|-------|--------------|--------|
| `main` SHA | `origin/main` = `4b45c6e2` | None |
| Production deploy | GitHub Production deployment `5908886188` @ `4b45c6e2`, success 2026-08-14T15:32:23Z | None |
| Application pipeline | Read `require-authorized-action.ts` and finance / property / reports wrappers | None |
| API catalog | Read `requiredEntitlementForApiPath` + middleware JSON 401/403 | None |
| Live `www` APIs | Unauthenticated GET; status / body / `Location` | None |
| Production RLS / helpers | Supabase MCP `execute_sql` on `vahnmcrpnuggxkivynvo` | None |
| Comms JWT matrix | `set_config` JWT `sub` + helpers (no Auth writes) | None |

---

## 2. Closed findings

### C1 / C2 / C3 — API entitlement, shared pipeline, finance / property / report protection

**PLAT-001 claim.** Finance and property APIs were RBAC-only. Middleware treated `/api/*` as entitlement-exempt. Shared reports used RBAC plus a documents-read bypass (H5).

**Closure evidence (application @ `4b45c6e2`).**

| Control | State |
|---------|--------|
| Shared pipeline | `requireAuthorizedAction`: Authentication → Organization → Role → SKU entitlement → Module permission |
| Finance wrapper | `requireFinancePermission` → entitlement `pm.financial_operations` |
| Property wrapper | `requirePropertyPermission` → entitlement `pm.properties` |
| Reports wrapper | `requireReportPermission` → entitlement `platform.reports`; documents-read bypass **removed** |
| API catalog | `requiredEntitlementForApiPath` maps `/api/finance/*`, `/api/pm/*`, `/api/facility/*`, `/api/shared/{reports,documents,communications}` |
| Middleware | Catalogued APIs return JSON 401 / 403; pages still redirect |

**Live `www` (2026-08-14T15:46Z, unauthenticated).**

| Request | Status | Body | `Location` |
|---------|-------:|------|:----------:|
| `GET /api/finance/snapshot` | 401 | `{"error":"Unauthenticated"}` | — |
| `GET /api/pm/properties` | 401 | `{"error":"Unauthenticated"}` | — |
| `GET /api/shared/reports` | 401 | `{"error":"Unauthenticated"}` | — |
| `GET /api/shared/communications/conversations` | 401 | `{"error":"Unauthenticated"}` | — |

FO SKU is denied on finance and property APIs by `evaluateApiPathEntitlement` and by the shared helper (unit tests on this SHA: 17 shared + 22 web). Authenticated JSON 403 was not replayed with a live cookie (no UAT passwords in this environment).

**Verdict:** **CLOSED.**

### C4 — Work-order surface isolation and RLS

**PLAT-001 claim.** `maintenance_work_orders_select` ended with `or is_org_member(organization_id)` and ignored `work_surface`.

**Closure evidence (Production database, successor ledger `20260814151825` / `plat_002_production_compat`).**

| Object | Live state |
|--------|------------|
| `maintenance_work_orders_select` | `can_select_work_order(id)` — no `is_org_member` OR |
| `maintenance_updates_select` | `can_select_work_order(work_order_id)` |
| `maintenance_work_orders_manage_manager` | manager **and** `org_allows_work_surface` |
| Technician update | assigned technician **and** `org_allows_work_surface` |
| Resident insert / update | `work_surface = 'residential'` plus resident predicates |
| Leftover WO `*_authorized` policies | **Absent** |

`org_allows_work_surface` maps:

- residential → `mpa_property_manager` or `mpa_complete_platform`
- facility → `mpa_facility_operations` or `mpa_complete_platform`

Live UAT orgs: Property Demo residential ● / facility — ; Clinic Demo (Complete) both ●.

`can_select_work_order` is manager/technician + surface, requester, resident, or linked vendor. Org membership alone is not a SELECT grant.

`anon` EXECUTE on `org_sku`, `org_allows_work_surface`, and `can_select_work_order` is **revoked**. `authenticated` EXECUTE is granted.

**Verdict:** **CLOSED.**

### C5 — Tenant communication role boundaries

**PLAT-001 claim.** `is_pm_staff` included `maintenance_technician`. RLS treated FO technicians as PM inbox staff. API and database disagreed.

**Closure evidence.**

| Control | Live state |
|---------|------------|
| `is_pm_comms_staff` | `organization_admin` / `property_manager` / `leasing_agent` only; technicians excluded; SKU must be Property Manager or Complete |
| `can_access_tenant_conversation` | `is_pm_comms_staff` **or** lease resident self-access |
| Conversation SELECT / staff update | `can_access_tenant_conversation` / `is_pm_comms_staff` |
| Hidden message SELECT | `is_pm_comms_staff` |
| Next.js allowlist | `PM_COMMS_STAFF_ROLES` matches the helper |

JWT helper matrix on Property Demo (same UAT actors as docs/91; no passwords):

| Actor | Staff inbox | Own thread |
|-------|:-----------:|:----------:|
| PM `property_manager` | ● | ● |
| Tenant | — | ● |
| `facility_technician` | — | — |

**Verdict:** **CLOSED.**

---

## 3. Remaining non-blocking items

These do **not** reopen C1–C5.

| ID | Severity | Status after PLAT-002 | Note |
|----|----------|------------------------|------|
| H4 | High | **Mitigated** | FO Organization Admin still *holds* global `pm.finance:*` / `pm.properties:*` grants. SKU pipeline now denies the APIs. Grant-scope split is a later ADR. |
| H5 residual | High | **Mostly closed** | Documents-read bypass and SKU check are done. Shared-report *shape* (FO must not export residential-shaped analytics) is still application-filter, not a second RLS catalog. |
| H1 | High | Open | Release docs on `main` still say “no Production deploy” for COM-002 / FAC-002 / MEDIA-001 certs. docs/100 (PR #208) is the PLAT-002 deploy record and is not yet on `main`. |
| H2 | High | Open | COM-002 identifier collision (Self-Service Commercial vs Tenant Communication Center). |
| H3 | High | Open | Production ledger remains a July + August superposition. Successor apply used a Production-compatible filename; repo vs Production drift remains. |
| H6 | High | Partial | New PLAT-002 helpers revoke `anon` EXECUTE. Older SECURITY DEFINER RPCs (`resolve_auth_user_id_by_email`, ops claimers, `is_pm_staff`, …) were not in PLAT-002 scope. |
| H7 | High | Open | ADR-007 Edge Functions vs empty Production functions list. |
| M1 | Medium | Accepted residual | No distinct Facility Manager / Facility Technician role (intentional for PLAT-002). |
| M2 | Medium | Open | `defaultHomeForRole` is Property Manager–biased; latent until an FO-only customer exists (0 FO subscriptions). |
| M3–M6 | Medium | Open | Dual resident models; unconstrained work-order FKs; parallel manager helpers; `property_owner` staff-report grants. |
| M7–M9 | Medium | Open | Decision Log / README / LAUNCH-001 J3–J8 documentation drift. |
| M10–M16 | Medium | Open | Dead entitlement keys, FO marketplace re-grant, dual stacks, RLS-on/no-policy tables, leaked-password protection, Stripe catalog not inspected, Tenant Pay nav vs paused S4. |
| L1–L8 | Low | Open | Capability-name reuse, docs drift, UAT `facility_technician` label, historical Stripe env names, `facility.capital_projects` future key, mutable `search_path`, dual inboxes. |

Operational residuals from docs/100 (not findings):

- No live cookie-session UI replay in this environment
- No live FO-only customer org (0 Facility Operations subscriptions)
- `maintenance_notifications` still absent (successor skipped it; do not create from this audit)

---

## 4. Future recommendations

Documentation or later Design → Document → Approve packages only. **Not authorized from this record.**

1. **Documentation refresh (H1, H2, M7–M9).** Land docs/93 and docs/100 on `main`. Mark shipped programs live. Disambiguate COM-002 titles. Index ADR-020 / ADR-021. Amend LAUNCH-001 journey-gate language so agents do not refuse already-shipped surfaces.
2. **Grant-scope ADR (H4 residual, M1, M6).** Decide whether FO Organization Admin should keep global `pm.finance:*` / `pm.properties:*` grants now that SKU denies the APIs, and whether `property_owner` belongs on staff report routes.
3. **SECURITY DEFINER inventory (H6).** Revoke `anon` EXECUTE on non-login helpers; isolate ops claimers. Do not batch-revoke from this audit.
4. **Lineage map (H3).** Inventory-only Production vs repo reconciliation. No legacy table drops without a deprecation ADR. Do not replay `20260814160000`.
5. **FO first-login (M2).** Home path = `f(role, sku)` before the first FO-only customer.
6. **ADR-007 amendment (H7).** Confirm Next.js trusted API as the mutation plane, or restore Edge Functions. Do not implement either from this audit.
7. **Shared-report shape (H5 residual).** If FO-only orgs appear, add an approved surface filter so shared analytics cannot dump residential-shaped rows.

---

## 5. Explicitly not done

- Code, UI, tests, migrations, or Production writes
- Stripe / billing / SKU / role changes
- Closure of High / Medium / Low except H5’s in-scope reports bypass
- Merge of PRs #201, #204–#208

---

**STOP.** Audit only. C1–C5 are closed. No implementation from this record.
