# PLAT-001 PLATFORM MISMATCH AUDIT

**Status:** Audit complete — Design + findings only  
**Date:** 2026-08-14  
**Program:** PLAT-001  
**Blueprint record:** `docs/93-plat-001-platform-mismatch-audit/`  
**Audited SHA:** `102b63da5f606e8a625e9d547e1e3e8964af4b4a` (merge of PR #198; current `origin/main`)  
**Production app:** Vercel `dpl_9qb1SBLvE1u3uGXQJrDZoeMDD8ZV` serving `www.my-property-assistant.com`  
**Production database:** Supabase `mpa-prod` / `vahnmcrpnuggxkivynvo`  
**Gate:** Design → Document → **Approve** → Implement (ADR-012)  
**This package:** Design + audit only. **No implementation authorized.**

---

## Constraints honored

This audit did **not**:

- Change application code, UI, or tests
- Apply or write migrations
- Change production data, Auth, Storage, or Edge Functions
- Change billing, Stripe products, prices, or checkout
- Add features

Recommended actions below are **design inputs** for a later approved remediation package. They are not work orders to execute from this record.

---

## 1. Audit scope

Compare approved product architecture to what Production actually runs after:

| Completed program | Binding record | Production state at audit |
|-------------------|----------------|---------------------------|
| Product Constitution | ADR-019 · `docs/00-governance/product-constitution.md` | Binding: three products; Enterprise is sales motion only |
| Facility Operations | ADR-020 · STAB-004 · FO enablement | Live on current Production SHA |
| MEDIA-001 | ADR-023 · `docs/73`–`74` | `media_attachments` + private `media` bucket live |
| COM-002 Tenant Communication Center | ADR-024 · `docs/80`–`81`, `docs/91` | Schema `20260814012357` + UAT RLS `20260814030010` live; app in SHA `102b63da` |
| FAC-002 Reporting & Export | ADR-025 · `docs/88`–`89` | App on current Production SHA; **no FAC-002-specific migration** (reads `maintenance_work_orders`) |
| Vendor workflows / work-order lifecycle | LAUNCH-001 J6 + FO surface | Live |
| Notifications | API-001 + COM-002 Notification Center | Dual stacks live (see D5) |
| Audit events | OPS-001 + domain events | Live |
| Entitlement enforcement | ADR-015 / ADR-019 + `packages/shared/src/commercial/` | Page middleware live; API coverage uneven (C1–C3) |

Eight audit areas:

1. Documentation vs implementation
2. Subscription and entitlement
3. Role and permission matrix
4. Cross-surface isolation
5. Database consistency
6. Production environment (read-only)
7. End-to-end workflows
8. UX consistency

---

## 2. Method

| Layer | How audited | Writes |
|-------|-------------|--------|
| Blueprint / ADRs / README | Read `docs/` on `origin/main` @ `102b63da` | None |
| Entitlements, nav, roles | Read `packages/shared/src/commercial/*`, `types/roles.ts` | None |
| API / middleware gates | Read `apps/web/src/middleware.ts`, `lib/*/authz.ts`, API routes | None |
| Schema / RLS (repo) | Read `supabase/migrations/` | None |
| Production schema / RLS / Storage / advisors | Supabase MCP `execute_sql`, `list_tables`, `get_advisors` on `vahnmcrpnuggxkivynvo` | None |
| Production app SHA | Prior Vercel alias confirmation for `www.my-property-assistant.com` | None |
| Stripe live catalog | Stripe MCP `needsAuth` — **not inspected** | None |

`docs/92` (COM-002 final Production UAT) exists only on unmerged branch `cursor/com-002-final-uat-cert-b7a1` (PR #200). This audit uses `docs/91` on main plus live Production evidence.

Identifier collision: **COM-002 Tenant Communication Center** (ADR-024 / `docs/80`) is **not** COM-002 Self-Service Commercial (ADR-018 / `docs/37`). This record uses the full title when the short code would be ambiguous.

---

## 3. Production snapshot (read-only)

| Item | Value |
|------|--------|
| App SHA | `102b63da5f606e8a625e9d547e1e3e8964af4b4a` |
| Vercel production deployment | `dpl_9qb1SBLvE1u3uGXQJrDZoeMDD8ZV` |
| Latest applied migration | `20260814030010` / `com_002_uat_remediation` |
| COM-002 schema | `20260814012357` / `com_002_tenant_communication_center` |
| FO enablement (prod-named) | `fo_prod_enablement_a`–`d` (`20260813231223`–`20260813232103`) |
| MEDIA-001 | `20260813213805` / `media001_media_attachments` |
| Organizations | 21 |
| Memberships | 31 |
| `organization_subscriptions` | 6: **5** `mpa_property_manager` active, **1** `mpa_complete_platform` active, **0** `mpa_facility_operations` |
| `product_skus` | 3 (PM, FO, Complete) |
| `platform_operators` | 1 |
| Storage buckets | `media` (private, 100 MB, image/video) · `media-private` (private, 25 MB, image/PDF/Office) |
| Edge Functions | **empty** (`[]`) |
| Stripe live products/prices | **Not inspected** (Stripe MCP unauthenticated) |

Active current-stack row counts (Production):

| Table | Rows (approx.) |
|-------|----------------|
| `property_properties` | 9 |
| `property_units` | 13 |
| `pm_residents` | 1 |
| `lease_residents` | 1 |
| `comms_conversations` | 2 |
| `comms_messages` (notices) | 0 |
| `media_attachments` | 10 |

Legacy / parallel tables still present with rows: `properties` (10), `units` (35), `tenants` (35), plus `leases`, `vendors`, `rent_charges`, `payments`, `conversation_threads`, `communication_messages`, `in_app_notifications`, `media_assets`, FAC-001 facility tables.

---

## 4. Findings index

| ID | Severity | Area | Title |
|----|----------|------|-------|
| C1 | Critical | Entitlement | Finance API is RBAC-only — no SKU entitlement check |
| C2 | Critical | Entitlement | Property API is RBAC-only — no SKU entitlement check |
| C3 | Critical | Entitlement | Middleware does not entitlement-gate `/api/*` |
| C4 | Critical | Isolation / RLS | Work-order SELECT RLS is org-wide and ignores `work_surface` |
| C5 | Critical | Isolation / RLS | Tenant conversation RLS treats FO technicians as PM staff |
| H1 | High | Docs | Release docs still say “no Production deploy” after live ship |
| H2 | High | Docs | COM-002 identifier collision (commercial vs tenant comms) |
| H3 | High | Database | Production migration ledger is a July + August superposition |
| H4 | High | Entitlement | FO Organization Admin holds full `pm.finance:*` and `pm.properties:*` grants |
| H5 | High | Isolation | Shared reports API is RBAC-only with a documents-read legacy bypass |
| H6 | High | Security | SECURITY DEFINER RPCs executable by `anon`, including email lookup |
| H7 | High | Architecture | ADR-007 (Edge Functions own mutations) vs empty Production functions |
| M1 | Medium | Roles | No distinct Facility Manager role — label over `property_manager` |
| M2 | Medium | UX / Nav | `defaultHomeForRole` is Property Manager–biased |
| M3 | Medium | Data | Dual resident models required for COM-002 tenant actor |
| M4 | Medium | Data | Work-order FKs are not constrained to the same property/unit/resident |
| M5 | Medium | Authz | Three parallel “manager” helper families |
| M6 | Medium | Isolation | `property_owner` can read maintenance and shared reports |
| M7 | Medium | Docs | ADR-020 / ADR-021 missing from Decision Log index |
| M8 | Medium | Docs | Blueprint numbering gaps and stale README constitution banner |
| M9 | Medium | Governance | LAUNCH-001 J3–J8 still marked blocked after later programs shipped |
| M10 | Medium | Entitlement | Dead entitlement keys `pm.reports_owner` and `pm.portal_owner` |
| M11 | Medium | Entitlement | FO SKU re-grants `platform.marketplace_vendor_consume` while matrix marks vendors ○ |
| M12 | Medium | Data | Dual inbox + dual media + dual property systems in Production |
| M13 | Medium | Security | RLS enabled with no policies on several commercial/ops tables |
| M14 | Medium | Auth | Leaked-password protection disabled on Production Auth |
| M15 | Medium | Stripe | Live Stripe catalog not inspectable this audit |
| M16 | Medium | UX | Tenant Pay nav exists while FIN-OPS S4+ is paused |
| L1 | Low | Entitlement | FAC-002 FO APIs reuse `pm.maintenance:*` capability names |
| L2 | Low | Data | Missing index on `comms_notifications.conversation_id` (if column exists without one) |
| L3 | Low | Docs | `docs/09` / `docs/26` table-name drift |
| L4 | Low | Docs | UAT role name `facility_technician` is not a real role |
| L5 | Low | Stripe | Env keys still use historical `PROFESSIONAL` names |
| L6 | Low | Entitlement | `facility.capital_projects` exists as future-only |
| L7 | Low | Security | Mutable `search_path` on several functions (advisor WARN) |
| L8 | Low | UX | Dual comms inboxes (notices vs threads) with empty notices table |

---

## 5. Critical findings

### C1 — Finance API has no SKU entitlement check

**Description.** `requireFinancePermission` in `apps/web/src/lib/finance/authz.ts` checks session, active org, and RBAC (`evaluatePermission`) only. It does **not** load `organization_subscriptions` or call `hasEntitlement(..., "pm.financial_operations")`. The page `/pm/financial-operations` **is** SKU-gated via `requiredEntitlementForPath`.

**Impact.** Any caller who can obtain a finance capability (Organization Admin always can — see H4) can hit finance APIs even when the org SKU is Facility Operations. UI hide is not a security boundary.

**Recommended action.** After approval: add the same SKU check used by `requireMaintenancePermission` (`entitlementsForSku` + `pm.financial_operations`). Do not change Stripe or plan catalog.

**Owner area.** Financial Operations authz / entitlements.

---

### C2 — Property API has no SKU entitlement check

**Description.** `requirePropertyPermission` in `apps/web/src/lib/property/authz.ts` is the same RBAC-only pattern. `/pm/properties` is SKU-gated (`pm.properties`). FO Organization Admin is granted `pm.properties:read` and `pm.properties:write` in `20260806080000_launch_001_j2_team_invites.sql`.

**Impact.** Facility Operations staff with Organization Admin (or other granted property capabilities) can mutate or read Property Manager portfolio APIs if they call `/api/...` directly.

**Recommended action.** After approval: add SKU entitlement `pm.properties` to property API authz, matching maintenance.

**Owner area.** Property portfolio authz / entitlements.

---

### C3 — Middleware does not entitlement-gate `/api/*`

**Description.** `requiredEntitlementForPath` returns `null` for any path starting with `/api/` (`packages/shared/src/commercial/route-entitlements.ts`). `isProtected` in `apps/web/src/middleware.ts` is page prefixes only (`/pm`, `/facility`, `/shared`, portals, setup, billing, admin). API routes therefore depend entirely on per-route authz helpers. Maintenance and Facility Operations helpers check SKU; finance, property, and shared reports do not.

**Impact.** Defense in depth is missing. A new or forgotten API route that only checks RBAC inherits C1/C2/H5. Impersonation read-only is the only middleware API gate.

**Recommended action.** After approval: either map API prefixes to entitlements in middleware, or require every customer API helper to take an entitlement key (fail closed). Prefer one pattern.

**Owner area.** Platform auth / middleware.

---

### C4 — Work-order SELECT RLS is org-wide and ignores `work_surface`

**Description.** Policy `maintenance_work_orders_select` (`20260806110000_launch_001_j6_maintenance.sql`) ends with `or public.is_org_member(organization_id)`. It does not filter `work_surface`. Application services filter surface for FAC-002 and FO/PM queues. Authenticated PostgREST clients do not have to.

**Impact.** Any org member (including tenant, vendor, and owner memberships that pass `is_org_member`) can `SELECT` all work orders of **both** surfaces for that org. Cross-surface isolation is application-only.

**Recommended action.** After approval: redesign SELECT policy — drop the org-member OR, constrain by role + assignment + resident/vendor linkage, and add `work_surface` predicates aligned to SKU. Requires Design → Document → Approve (RLS is a material authz change).

**Owner area.** Database / RLS / maintenance domain.

---

### C5 — Tenant conversation RLS treats FO technicians as PM staff

**Description.** `is_pm_staff` (`20260814010000_com_002_tenant_communication_center.sql`) includes `maintenance_technician`. `can_access_tenant_conversation` ORs `is_pm_staff`. App/API deny FO via `staffHasTenantCommsEntitlement` (requires `platform.communications` **and** `pm.portal_tenant`). COM-002 UAT FO denial was UI/API (`/unauthorized`), not this RLS path.

**Impact.** An authenticated FO technician (or any listed staff role) in a Complete or mis-provisioned org can read/write `comms_conversations` / messages through the Supabase client even when the Next.js API returns 403. On an FO-only SKU the API is closed; RLS is still open if the user is a member.

**Recommended action.** After approval: narrow `is_pm_staff` (or add an entitlement-aware helper) so Facility-only technicians are not PM comms staff. Keep tenant self-access via `is_lease_resident` + `pm_residents`.

**Owner area.** COM-002 / RLS.

---

## 6. High findings

### H1 — Release docs still say “no Production deploy”

**Description.** On `origin/main`, these records still claim no Production deploy (or pre-merge state) while the code they certify is on SHA `102b63da`:

| Record | Stale claim |
|--------|-------------|
| `docs/80` | “NO Production deploy from this package” |
| `docs/81` | Implementation cert · no Production deploy |
| `docs/89` | FAC-002 · **No production deployment** |
| `docs/74`, `docs/76`–`79` | MEDIA-001 / Complete / font / final RC still “no deploy” or BLOCKED |
| `docs/91` | “app in PR #198” — #198 is **merged** |
| README index rows 80, 81, 88, 89 | Same stale Production flags |

**Impact.** Operators and future agents treat live programs as unshipped. Certification trail and Production SHA diverge.

**Recommended action.** Documentation-only refresh: mark COM-002 and FAC-002 as live on `102b63da`; close or supersede `docs/79` BLOCKED; land or discard `docs/92` (PR #200) so final UAT is on main.

**Owner area.** Blueprint / release documentation.

---

### H2 — COM-002 identifier collision

**Description.** Two accepted programs share the code COM-002:

- ADR-018 / `docs/37`–`45` — Self-Service Commercial (checkout, SKUs, provisioning)
- ADR-024 / `docs/80`–`81`, `docs/91` — Tenant Communication Center

**Impact.** Search, PR titles, and agent prompts attach the wrong ADR, billing constraint, or schema. This audit already required disambiguation.

**Recommended action.** Keep both historical codes, but require the full title in new records. Optionally assign a non-colliding alias (for example TCC-001) in a later ADR — documentation only unless Product Owner renames.

**Owner area.** Governance / Decision Log.

---

### H3 — Production migration ledger is a July + August superposition

**Description.** Repo `supabase/migrations/` after identity foundation jumps to August commercial / LAUNCH-001 files. Production `supabase_migrations.schema_migrations` still contains the full July lineage (FAC-001, API-001–005, AUTH-001, COM-001, OPS-001, BILL-001, screening, signatures, migration center, etc.) **and** August reset / FO / MEDIA / COM-002 files.

Filename drift (repo vs Production):

| Repo file | Production applied name |
|-----------|-------------------------|
| `20260811140000_stab004_facility_work_surface.sql` | `fo_prod_enablement_a`–`d` (different versions) |
| `20260814010000_com_002_tenant_communication_center.sql` | `com_002_tenant_communication_center` @ `20260814012357` |
| `20260814030000_com_002_uat_remediation.sql` | `com_002_uat_remediation` @ `20260814030010` |

**Impact.** Fresh environments and Production are not the same database. Replay from repo alone cannot reconstruct Production. Future migrations risk colliding with objects that exist only in Production.

**Recommended action.** After approval: publish a Production lineage map (this record is the start), then a designed reconciliation — inventory-only first; no drop of legacy tables without a deprecation ADR.

**Owner area.** Database / platform operations.

---

### H4 — FO Organization Admin holds full PM finance and property grants

**Description.** Role grants are global, not SKU-scoped. `organization_admin` receives every `pm.finance:*` and `pm.properties:*` key in J2. Combined with C1/C2, SKU is not consulted.

**Impact.** Facility Operations Organization Admin is a full Property Manager API principal for finance and properties.

**Recommended action.** After approval: either (a) enforce SKU in those API helpers (C1/C2), or (b) split FO vs PM capability sets. (a) is smaller and matches maintenance.

**Owner area.** Authorization / entitlements.

---

### H5 — Shared reports API is RBAC-only with a documents-read legacy bypass

**Description.** `requireReportPermission` (`apps/web/src/lib/reports/authz.ts`) does not check SKU. If `platform.reports:read` is missing, it still allows `organization_admin`, `property_manager`, `maintenance_technician`, or `leasing_agent` who have `platform.documents:read`. FAC-002 work-order report routes **do** check entitlements (`pm.maintenance` / `facility.operations`). `/api/shared/reports` and export do not.

**Impact.** FO or PM staff can pull the shared analytics/export surface even when product isolation should hide residential or facility-shaped reporting. `property_owner` also has `platform.reports:read` (M6).

**Recommended action.** After approval: add `platform.reports` entitlement (already on all three SKUs) **and** surface/role filters so FO-only orgs cannot export residential-shaped shared reports.

**Owner area.** Reporting / entitlements.

---

### H6 — SECURITY DEFINER RPCs executable by `anon`

**Description.** Production advisors flag `anon` + `authenticated` EXECUTE on many `SECURITY DEFINER` helpers, including:

- `resolve_auth_user_id_by_email`
- `auth_register_username` / `auth_resolve_login_identifier`
- `can_access_tenant_conversation`
- `has_org_capability`, `is_org_member`, `is_pm_staff`, `is_platform_operator`
- `ops_claim_domain_events`, `ops_claim_due_reminders`, `ops_acquire_scheduler_leader`
- `rls_auto_enable`

Functions that check `auth.uid()` are safer; email-resolution and ops-claimer RPCs are not automatically safe because they are public.

**Impact.** Unauthenticated PostgREST `/rest/v1/rpc/...` can invoke privileged helpers. Severity depends on each function body; email lookup and ops claimers are the highest-risk subset.

**Recommended action.** After approval: revoke `anon` EXECUTE on all non-login helpers; revoke `authenticated` EXECUTE on ops claimers; keep login resolvers behind a dedicated, rate-limited path.

**Owner area.** Security / database.

---

### H7 — ADR-007 vs empty Production Edge Functions

**Description.** ADR-007 (Accepted) says Edge Functions own business mutations. Production Edge Functions list is empty. COM-002, MEDIA-001, FAC-002, finance, and maintenance mutate through Next.js API routes (documented for COM-002 as the MEDIA-001 trusted-boundary pattern).

**Impact.** Architecture docs and Production trust boundary disagree. New work oscillates between “must be an Edge Function” and “follow MEDIA-001 API routes.”

**Recommended action.** Propose an ADR to supersede or amend ADR-007 to “Next.js trusted API + service-role where approved,” or restore Edge Functions as the mutation plane. Do not implement either from this audit.

**Owner area.** Architecture / Decision Log.

---

## 7. Medium findings

### M1 — No distinct Facility Manager role

**Description.** `USER_ROLES` is `organization_admin`, `property_manager`, `leasing_agent`, `maintenance_technician`, `property_owner`, `tenant`, `vendor`. There is no `facility_manager` or `facility_technician`. “Facility Manager” is invite/presentation labeling of `property_manager` on an FO SKU. Master Admin is `platform_operators` + `app_metadata.platform_operator`, not a membership role.

**Impact.** Role-matrix requests and UAT scripts invent roles the database rejects. FO managers inherit PM capability names (`pm.maintenance:*`, `pm.finance:*`).

**Recommended action.** Document the mapping as canonical (this record). A real Facility Manager role is a material authz change and needs its own ADR.

**Owner area.** Identity / roles.

---

### M2 — `defaultHomeForRole` is Property Manager–biased

**Description.** `defaultHomeForRole` (`packages/shared/src/types/roles.ts`) sends Organization Admin and Property Manager to `/pm/mission-control` and technicians to `/pm/maintenance`. FO-only orgs hit PM paths; middleware then 403s to `/unauthorized`.

**Impact.** First login on Facility Operations can land on a denied PM route. Complete orgs are fine. Production currently has **zero** FO-only subscriptions, so this is latent for the next FO customer.

**Recommended action.** After approval: home path = `f(role, sku)`.

**Owner area.** Identity / commercial navigation.

---

### M3 — Dual resident models required for COM-002 tenant actor

**Description.** Tenant conversation access requires both `pm_residents` (account) and `lease_residents` (lease link) in `conversation-authz.ts`. Production has 1 row in each (UAT). Drift between the two tables 403s a legitimate tenant.

**Impact.** Operational fragility; two sources of truth for “who is the resident.”

**Recommended action.** After approval: define a single resident identity or a sync invariant; add a consistency check in Guided Setup / UAT.

**Owner area.** Residents / COM-002.

---

### M4 — Work-order FKs are not constrained together

**Description.** `maintenance_work_orders` requires `property_id` → `property_properties`, with optional `unit_id` and `resident_id`. No CHECK that unit and resident belong to that property. Production still has legacy `properties` / `units` shadow rows used in prior UAT.

**Impact.** Cross-property linkage and surface leakage if clients send inconsistent IDs. App may assume consistency RLS does not enforce.

**Recommended action.** After approval: composite FKs or CHECK/triggers; stop requiring legacy shadow rows.

**Owner area.** Maintenance schema.

---

### M5 — Three parallel “manager” helper families

**Description.** RLS and APIs mix `has_org_capability` (org core), `is_org_manager` / `is_maintenance_manager`, and `is_pm_staff`. Definitions of “staff” differ (C5).

**Impact.** Policies that look equivalent are not. Reviews miss holes because the wrong helper looks sufficient.

**Recommended action.** After approval: one helper catalog with SKU + role + capability; deprecate duplicates.

**Owner area.** Authorization.

---

### M6 — `property_owner` can read maintenance and shared reports

**Description.** Grants include `pm.maintenance:read`, `platform.reports:read`, `pm.finance:read` / `pm.finance:reports.read`. Owner portal is the intended plane; FAC-002 and shared report APIs do not exclude the owner plane if the user calls staff APIs with a cookie org.

**Impact.** Owner memberships may see staff operational reports beyond portfolio honesty views.

**Recommended action.** After approval: exclude `property_owner` from staff report/maintenance APIs; keep owner portal routes.

**Owner area.** Reporting / owner portal.

---

### M7 — ADR-020 and ADR-021 missing from Decision Log index

**Description.** Files exist: `adr-020-facility-operations-production-mvp.md`, `adr-021-production-stabilization-sprint-5.md`. `docs/18-decision-log/index.md` jumps from ADR-019 to ADR-023.

**Impact.** Facility Operations Production MVP and stabilization decisions are invisible in the official index.

**Recommended action.** Add index rows (documentation only).

**Owner area.** Decision Log.

---

### M8 — Blueprint numbering gaps and stale README banner

**Description.** On main, records 82–87, 90, and 92 are absent. README still says Facility Operations implement was **refused** pending `docs/27`, CORE-004 remains stopped, and J3–J8 are not authorized — while FO, leasing, maintenance, MEDIA-001, COM-002, and FAC-002 have shipped.

**Impact.** New contributors follow a stop-notice that Production has already passed.

**Recommended action.** Refresh the README constitution banner to “three products live; J3–J8 journey-gate superseded by later approved programs” (wording for Product Owner).

**Owner area.** Blueprint index.

---

### M9 — LAUNCH-001 J3–J8 still marked blocked after later programs shipped

**Description.** ADR-017 journey gate: J0–J2 delivered; J3–J8 blocked. Residents, leasing, maintenance, documents, reporting, and comms later shipped as other programs.

**Impact.** Two truths: journey-gate vs shipped surfaces. Agents refuse work that is already live, or assume J3–J8 may be implemented without new ADRs.

**Recommended action.** ADR amendment: mark superseded journeys and point to the program that delivered each.

**Owner area.** Governance / LAUNCH-001.

---

### M10 — Dead entitlement keys

**Description.** `pm.reports_owner` and `pm.portal_owner` are granted on PM and Complete SKUs. No `requiredEntitlementForPath` or API helper gates on them. Owner portal is role-gated (`/portal/owner`), not entitlement-gated.

**Impact.** Matrix implies owner-report and owner-portal SKU control that does not exist. Complete vs PM cannot be distinguished by those keys.

**Recommended action.** After approval: wire gates or remove keys from `PROPERTY_MANAGER_ENTITLEMENTS` (entitlement-key change needs Product Owner — COM-002 tenant comms explicitly forbade SKU key changes).

**Owner area.** Entitlements.

---

### M11 — FO marketplace consume vs matrix ○

**Description.** `entitlementsForSku` always includes `platform.marketplace_vendor_consume` via `PLATFORM_ENTITLEMENTS`, then FO SKU pushes it again. Subscription matrix marks FO vendors as ○ (limited / dependent).

**Impact.** FO always has marketplace-consume entitlement; matrix says limited. FO vendor UI is under `/facility/vendors` (operations entitlement), not a separate consume flag.

**Recommended action.** Align matrix text to “FO vendors via `facility.operations`” or stop granting consume on FO if Product Owner wants ○.

**Owner area.** Commercial matrix.

---

### M12 — Dual inbox, dual media, dual property systems

**Description.** Production concurrently has:

| Concern | Current | Legacy / parallel |
|---------|---------|-------------------|
| Properties | `property_properties` / `property_units` | `properties` / `units` |
| Residents | `pm_residents` / `lease_residents` | `tenants` |
| Comms | `comms_conversations` + `comms_messages` (notices) | `conversation_threads` / `communication_messages` / `in_app_notifications` |
| Media | `media_attachments` (MEDIA-001) | `media_assets` |
| Vendors | `vendor_vendors` | `vendors` |

**Impact.** Agents and queries hit the wrong table. UAT required legacy shadow rows. `comms_messages` (notices) has 0 rows while threads have 2.

**Recommended action.** Deprecation ADR: mark legacy read-only, then a later migrate/drop package. No drops from this audit.

**Owner area.** Database architecture.

---

### M13 — RLS enabled with no policies

**Description.** Advisors: `commercial_activation_requests`, `commercial_implementation_partners`, `commercial_opportunities`, `contact_email_verifications`, `credential_deliveries`, `ops_event_consumer_receipts`, `ops_scheduler_leader`, `organization_provision_requests`, `saas_webhook_events`.

**Impact.** Default deny (no policy) is fail-closed for direct table access, but service-role and SECURITY DEFINER paths may still write. Easy to assume “RLS on” means reviewed.

**Recommended action.** Add explicit deny/operator policies or document service-role-only tables.

**Owner area.** Security / commercial schema.

---

### M14 — Leaked-password protection disabled

**Description.** Production Auth advisor: HaveIBeenPwned leaked-password protection is off.

**Impact.** Compromised passwords can be set on customer and operator accounts.

**Recommended action.** Enable in Supabase Auth (config change — requires Owner approval; not done here).

**Owner area.** Auth / security.

---

### M15 — Live Stripe catalog not inspectable

**Description.** Stripe MCP `needsAuth`. Code catalog uses unit-volume keys (`STRIPE_PRICE_PM_BASE_*`, `STRIPE_PRICE_FO_PROFESSIONAL_*`, `STRIPE_PRICE_COMPLETE_BASE_*`, unit blocks). Admin console labels Business/Professional rows historical. Constitution forbids customer-facing Professional/Business tiers.

**Impact.** This audit cannot certify that live Stripe products/prices match the three-product constitution. Env key names still say PROFESSIONAL (L5).

**Recommended action.** Authenticate Stripe MCP or export a read-only price map in a follow-up audit. **No Stripe writes.**

**Owner area.** Billing / commercial (read-only).

---

### M16 — Tenant Pay nav vs paused FIN-OPS

**Description.** Tenant portal nav includes Pay → `/portal/tenant/billing`. FIN-OPS S0–S3 delivered and paused; S4+ NO-GO. Honesty copy exists in finance/owner surfaces; tenant Pay may be an empty or limited ledger.

**Impact.** Residents see a payment surface that is not a complete commercial promise.

**Recommended action.** Confirm honesty empty state on tenant Pay; do not resume S4+ from this audit.

**Owner area.** FIN-OPS / tenant portal.

---

## 8. Low findings

### L1 — FAC-002 FO APIs reuse `pm.maintenance:*` capability names

**Description.** Facility report and operations routes call `requireFacilityOperation("pm.maintenance:read", "facility.operations")`. Entitlement is FO-correct; capability namespace is PM.

**Impact.** Confusion in reviews and role grants; not a SKU bypass by itself.

**Recommended action.** Alias or add `facility.operations:read` in a later authz ADR.

**Owner area.** Facility authz.

---

### L2 — Possible missing `comms_notifications.conversation_id` index

**Description.** COM-002 notifications join on conversation id; advisors/index review should confirm an index exists in Production.

**Impact.** Low volume today (UAT-scale). Growth will sequential-scan.

**Recommended action.** Confirm in a schema review; add index only after approval.

**Owner area.** COM-002 schema.

---

### L3 — Database docs table-name drift

**Description.** `docs/09-database-architecture` still discusses `work_order_` prefixes; implementation is `maintenance_work_orders`. `docs/26` backup examples still say table `properties`.

**Impact.** Schema work starts from the wrong names.

**Recommended action.** Doc refresh after H3 lineage map.

**Owner area.** Database documentation.

---

### L4 — UAT “facility_technician” is not a role

**Description.** Some UAT notes used `facility_technician`. The only technician role is `maintenance_technician`.

**Impact.** Invite/SQL using the invented role fails or silently misses grants.

**Recommended action.** Correct UAT docs when `docs/92` lands.

**Owner area.** UAT documentation.

---

### L5 — Historical `PROFESSIONAL` Stripe env key names

**Description.** FO prices bind to `STRIPE_PRICE_FO_PROFESSIONAL_MONTHLY` / `_ANNUAL`. Customer path is unit-volume; admin UI says those rows are historical.

**Impact.** Constitution-adjacent naming in ops consoles. Not a customer-facing tier if checkout does not sell them.

**Recommended action.** Rename keys only with a coordinated env + Stripe read-only inventory (M15). No rename in this package.

**Owner area.** Billing configuration.

---

### L6 — `facility.capital_projects` future-only

**Description.** Entitlement exists; Capital Projects is not a commercial product (constitution). Route `/facility/capital-projects` maps to that key (off by default).

**Impact.** Low — correctly off. Risk is accidental enablement.

**Recommended action.** Keep off; do not surface in customer nav.

**Owner area.** Product constitution / FO nav.

---

### L7 — Mutable function `search_path`

**Description.** Advisors WARN on `set_updated_at`, FO trigger functions, billing helpers, `gen_random_bytes`, etc.

**Impact.** Search-path injection risk on SECURITY DEFINER functions that omit `SET search_path`.

**Recommended action.** Pin `search_path` on remaining functions in a hardening package.

**Owner area.** Database security.

---

### L8 — Dual comms inboxes

**Description.** Notices (`comms_messages`) and threads (`comms_conversations`) are both current-stack. Notices table is empty in Production. Tenant nav “Messages” is the thread inbox.

**Impact.** Staff may look at the wrong inbox. Not a security bug.

**Recommended action.** UX copy: “Notices” vs “Conversations.” Do not merge tables without an ADR.

**Owner area.** Communications UX.

---

## 9. Subscription and entitlement (as implemented)

### SKUs

| SKU | Customer name | Production orgs |
|-----|---------------|-----------------|
| `mpa_property_manager` | Property Manager | 5 active |
| `mpa_facility_operations` | Facility Operations | **0** active |
| `mpa_complete_platform` | Complete Platform | 1 active |

Complete = `PLATFORM_ENTITLEMENTS` ∪ `PROPERTY_MANAGER_ENTITLEMENTS` ∪ `FACILITY_ENTITLEMENTS`.  
`FO_READY = true`, `COMPLETE_READY = true` (`commerce-flags.ts`).

### Alignment: UI vs API vs DB vs Stripe

| Surface | Property Manager | Facility Operations | Complete |
|---------|------------------|---------------------|----------|
| Page middleware | `/pm/*` allowed; `/facility/*` denied | Inverse | Union |
| Staff nav | PM modules + shared | FO modules + shared | Union; role allowlists still apply |
| Maintenance / FO / FAC-002 APIs | SKU + RBAC | SKU + RBAC (`facility.*`) | Union |
| Finance / property / shared reports APIs | RBAC only (C1, C2, H5) | Same RBAC keys exist (H4) | Same |
| RLS `work_surface` | Not enforced (C4) | Not enforced (C4) | Not enforced (C4) |
| Tenant comms API | Allowed if `pm.portal_tenant` | Denied | Allowed (PM entitlements present) |
| Tenant comms RLS | `is_pm_staff` includes technicians (C5) | Same helper | Same |
| Stripe | Code: unit-volume PM base + blocks | Code: `FO_PROFESSIONAL_*` keys | Code: Complete base + blocks |
| Live Stripe | **Unverified** (M15) | **Unverified** | **Unverified** |

### Property Manager — features / restrictions

**Included (entitlements):** org, documents, communications, reports, search, launcher, setup, billing, marketplace consume, AI; all `pm.*` including dead `pm.reports_owner` / `pm.portal_owner`; tenant + owner portal keys.

**Restricted:** all `facility.*` and `/facility/*`.

**Navigation:** Mission Control, Properties, Residents, Leasing, Maintenance, Vendors, Financial Operations, PM work-order reports, shared documents/reports/communications.

**API:** maintenance/vendors/FAC-002 PM reports fail closed on `pm.maintenance` / `pm.vendors`. Finance and properties do not fail closed on SKU.

### Facility Operations — features / restrictions

**Included:** platform set + all `facility.*` except capital projects; marketplace consume re-pushed.

**Restricted (intended):** `/pm/*`, tenant portal product, residential reports, tenant communication staff APIs.

**Navigation:** Facility Mission Control, Operations, Vendors, Assets, Inventory, Parts, PM/inspections/safety/compliance/building systems, FO reports.

**API:** FO operations/reports/vendors check `facility.*` entitlements. Finance/property APIs do not, so intended restrictions are incomplete (C1, C2, H4).

**Production note:** no FO-only customer subscription exists; FO isolation is certified in UAT/API tests, not by a live FO-only tenant.

### Complete — combined access

**Intended:** union of PM and FO; tenant comms on; both report surfaces; both vendor lists.

**Gaps:** RLS still does not split `work_surface` (C4); FO technicians are PM comms staff in RLS (C5); default home is PM (M2) but Complete can open `/pm/mission-control`. Complete union automated tests are shallow relative to these holes.

---

## 10. Role and permission matrix (as implemented)

Legend: ● allowed · ○ limited / assigned-only · — denied · † presentation label, not a `USER_ROLES` value.

| Role (requested) | Implemented as | Navigation | Allowed actions | API | Data visibility | Export | Communication |
|------------------|----------------|------------|-----------------|-----|-----------------|--------|---------------|
| Master Admin | `platform_operators` + `app_metadata.platform_operator` | `/admin/*`; may preview customer surfaces | Impersonation, checkout console, org support | `/api/admin/*`; bypasses customer entitlement middleware | Cross-org (operator) | Operator consoles | Not tenant-thread participant by role |
| Organization Admin | `organization_admin` | All SKU-entitled staff nav | Invites, org, full PM finance/property **capabilities** | Finance/property if RBAC (C1/C2); maintenance if SKU | Org-wide via `is_org_member` (C4) | FAC-002 if SKU + `pm.maintenance:read`; shared reports RBAC (H5) | Staff comms if SKU has `pm.portal_tenant` |
| Property Manager | `property_manager` | All SKU-entitled staff nav | Portfolio, residents, leasing, maintenance assign | Same pattern as Org Admin for domain APIs | Org operational | Same as Org Admin for reports they can open | Staff tenant threads on PM/Complete |
| Facility Manager † | **No role** — `property_manager` on FO SKU | FO nav if SKU is FO/Complete | FO operations (via same role + FO entitlements) | FO APIs if `facility.*`; PM finance/property APIs if they call them (C1/C2) | FO queues in app; all WO in RLS (C4) | FO FAC-002 if entitled | API denied on FO-only; RLS may allow (C5) |
| Technician | `maintenance_technician` | Allowlist: PM maintenance + FO operations modules + shared | Progress assigned / open queue work | `pm.maintenance:read` (+ write/assign where granted); FO uses same capability names (L1) | Assigned + unassigned/open per policy, **plus** all WO via org-member OR (C4) | Shared reports via legacy bypass (H5); FAC-002 if capability + entitlement | RLS: treated as PM staff (C5); API: only if SKU has tenant portal entitlement |
| Vendor | `vendor` | `/portal/vendor` | Progress linked jobs | Portal + `is_linked_vendor_for_work_order` | Linked work orders; RLS org-member OR may widen (C4) | — | Not tenant comms staff |
| Tenant | `tenant` | Home, Pay, Maintenance, Messages, Documents, Account | Request work, message own thread, view own docs | Tenant portal APIs; conversation actor needs `pm_residents` **and** `lease_residents` (M3) | Own lease / own requests; **RLS C4 may expose all org WOs** | — | Own conversations only (API); notices inbox empty (L8) |

Additional implemented roles **not** in the requested list:

| Role | Notes |
|------|--------|
| `leasing_agent` | PM leasing nav; `pm.finance:read`; `pm.properties:read`; shared reports legacy bypass |
| `property_owner` | `/portal/owner`; finance read/reports; `pm.maintenance:read`; `platform.reports:read` (M6) |

---

## 11. Cross-surface isolation

| Boundary | App / UI | API | RLS | Verdict |
|----------|----------|-----|-----|---------|
| PM must not access facility-only work orders | Queues filter `work_surface` | FAC-002 PM routes filter residential | **No `work_surface` predicate** (C4) | **Fail at data plane** |
| PM must not access facility-only reports | `/facility/reports` entitlement-denied | FO report routes need `facility.operations` | Same WO table readable (C4) | **Pass UI/API; fail RLS** |
| PM must not access facility-only vendors | `/facility/vendors` denied | FO vendor routes need `facility.operations` | Vendor tables not re-audited as surface-split | **Pass UI/API** |
| FO must not access tenant communication | `/unauthorized?reason=role` (intended) | `staffHasTenantCommsEntitlement` 403 | `is_pm_staff` includes technicians (C5) | **Pass UI/API; fail RLS** |
| FO must not access residential reports | `/pm/reports` denied | PM report routes need `pm.maintenance` | C4 | **Pass UI/API; fail RLS** |
| FO must not access residential-only data | `/pm/*` denied | Finance/property APIs **not** SKU-gated (C1/C2) | Org-member reads | **Fail API + RLS** |
| Tenant must not access internal ops | Portal nav only | Staff APIs 401/403 | C4 org-member SELECT on all WOs | **Fail RLS if tenant is `is_org_member`** |
| Tenant must not access reports | No report nav | Staff report APIs forbidden | — | **Pass API if not staff** |
| Tenant must not access other residents | Conversation authz scoped to own lease/account | API scoped | Conversation policies + `is_lease_resident` | **Pass API; depends on RLS helpers** |
| Complete = union | Both shells | Both entitled APIs | Still no surface split in RLS | **Union in app; isolation holes remain** |

Facility work orders cannot open tenant messaging (`conversation-service.ts` rejects facility surface). That app check is correct and does not fix C5.

---

## 12. Database consistency

### Active systems (current product path)

- Identity: `organizations`, `organization_memberships`, `organization_subscriptions`, `product_skus`, `platform_operators`
- Portfolio: `property_properties`, `property_units`, `pm_residents`, `lease_residents`
- Work: `maintenance_work_orders` (+ updates, notifications), `vendor_vendors`
- Media: `media_attachments` + Storage `media`
- Comms: `comms_conversations`, `comms_conversation_messages`, `comms_notifications`
- Finance (paused depth): FIN-OPS tables from S0–S3
- Documents / reporting: Phase 4 sprint 6–7 tables
- FAC-002: **no new tables** — reads maintenance + export audit/events

### Deprecated / parallel (still in Production)

July FAC-001 / API-001 / AUTH-001 / COM-001 / OPS-001 / BILL-001 / screening / signatures / migration-center tables; legacy `properties`, `units`, `tenants`, `vendors`, `media_assets`, `conversation_threads`.

### Migration lineage (abridged)

1. **2026-07-14 → 2026-07-28** — Phase 3–11 + FAC-001 + API-* + AUTH-001 + COM-001 + OPS-001 + BILL-001 (Production only; many files absent from current repo tree).
2. **2026-08-08** — Commercial subscriptions + COM-002 (self-service) slices C–E (Production names `phase1_commercial_subscriptions`, `com_002_slice_*`).
3. **2026-08-09 → 08-10** — Documents, reporting, leasing, owner-ops admin.
4. **2026-08-13** — MEDIA-001; FO prod enablement a–d (repo STAB-004 equivalent).
5. **2026-08-14** — COM-002 tenant comms + UAT remediation.

Repo cannot recreate Production by `supabase db reset` from the current migrations folder.

### Unused / thin structures

- `comms_messages` notices: 0 rows
- Capital Projects entitlement: unused
- Several commercial/ops tables: RLS on, no policies (M13)
- Empty Edge Functions vs mutation-heavy API surface (H7)

---

## 13. End-to-end workflows

Status is **design/code-path verification**, not a new Production UAT run. Prior COM-002 UAT (docs/91) covered tenant/staff comms on the UAT org only.

### Tenant — Request → Media → Communication → Resolution → History

| Step | Implementation | Gaps |
|------|----------------|------|
| Request | Tenant portal maintenance create | RLS C4 may list others’ WOs |
| Media | MEDIA-001 attachments on WO | Dual `media_assets` unused for this path |
| Communication | `/portal/tenant/messages` → `comms_conversations` | Requires `pm_residents` + `lease_residents` (M3); notices inbox empty |
| Resolution | Staff progress APIs | Tenant sees status in portal if scoped |
| History | Conversation + WO updates | Isolation depends on RLS |

### Property Manager — Resident → Work Order → Vendor → Communication → Reporting

| Step | Implementation | Gaps |
|------|----------------|------|
| Resident | `pm_residents` + leasing | Dual model (M3) |
| Work order | `/pm/maintenance` + APIs with SKU | RLS shows facility WOs too (C4) |
| Vendor | `/pm/vendors` + `pm.vendors` entitlement | Legacy `vendors` table remains |
| Communication | Staff threads if PM/Complete | FO staff on Complete inherit C5 |
| Reporting | `/pm/reports/work-orders` + FAC-002 | Shared `/shared/reports` weaker (H5) |

### Facility Manager — Issue → Media → Vendor → Completion → Reporting

| Step | Implementation | Gaps |
|------|----------------|------|
| Issue | `/facility/operations` | Role is `property_manager` (M1); default home may 403 on FO-only (M2) |
| Media | MEDIA-001 | Same as PM |
| Vendor | `/facility/vendors` | Matrix ○ vs always-on consume (M11) |
| Completion | FO progress APIs + `facility.operations` | Capability names still `pm.maintenance:*` (L1) |
| Reporting | `/facility/reports` + FAC-002 | App filters surface; RLS does not (C4) |
| Must not message tenants | App rejects facility WO messaging | RLS C5 still a bypass |

No FO-only Production subscription exists to observe this path on a real customer org.

---

## 14. UX consistency

| Issue | Severity | Notes |
|-------|----------|-------|
| FO user hitting `/pm/*` → `/unauthorized?reason=role` | — | **Intended**, not a defect |
| FO-only first login → `/pm/mission-control` then unauthorized | Medium | M2 |
| Stale “no Production deploy” in in-repo docs | High | H1 — operators, not end users |
| Tenant Pay with paused FIN-OPS | Medium | M16 — confirm honesty empty state |
| “Facility Manager” / “facility technician” in UAT copy | Low | M1, L4 |
| Messages vs Notices dual inbox | Low | L8 |
| Shared communications vs tenant threads | Medium | Staff may open `/shared/communications` (notices) instead of COM-002 threads |
| Capital Projects route exists, entitlement off | Low | L6 |
| Missing permission messaging | Mixed | API 403 generic “Forbidden”; page unauthorized reasons exist for role/SKU |
| Broken links | Not exhaustively crawled | No GUI walkthrough in this audit; nav catalog is entitlement-filtered |
| Empty states | Present in reports (“Data honesty”), demo unavailable, FO “no honesty shells” tests | Tenant Pay and notices inbox are the risk empties |

This audit did not run a browser pass. UX items above are from nav/authz/source and prior UAT, not a new screenshot certification.

---

## 15. Documentation vs implementation

### Documented but incomplete or unenforced

- Cross-surface isolation (matrix + FAC-002 + COM-002) — **complete in UI/API for happy paths; incomplete in RLS** (C4, C5)
- SKU fail-closed on all customer APIs — **maintenance/FO yes; finance/property/shared reports no**
- ADR-007 Edge Functions own mutations — **not implemented in Production**
- LAUNCH-001 J3–J8 blocked — **later programs shipped the journeys anyway** (M9)
- Subscription matrix FO vendors ○ — **consume entitlement always on** (M11)
- Owner portal / owner reports as PM entitlements — **keys unused** (M10)

### Implemented but undocumented or stale

- COM-002 and FAC-002 **are in Production** while `docs/80`, `docs/81`, `docs/89` say they are not (H1)
- FO Production enablement used `fo_prod_enablement_*` names not present as repo filenames (H3)
- Next.js trusted-boundary mutation pattern (MEDIA-001 / COM-002) not reflected in ADR-007 (H7)
- ADR-020 / ADR-021 files exist without index rows (M7)
- `docs/92` final UAT cert not on main

### Missing implementations (approved later programs vs constitution banner)

README still presents FO implement as refused and J3+ unauthorized. That is **stale documentation**, not a missing FO product. Capital Projects remains correctly unimplemented as a commercial product.

---

## 16. Recommended next gate (do not implement from here)

Product Owner + Architect should approve a **PLAT-001 remediation design** that sequences:

1. **P0 (Critical):** C1, C2, C3, C4, C5 — API SKU gates + RLS surface/staff predicates  
2. **P1 (High):** H4–H6 (grants + reports + revoke dangerous RPC EXECUTE); H1/H2/H7 documentation/ADR hygiene; H3 lineage map (docs first)  
3. **P2 (Medium):** M1–M6 product/role honesty; M7–M9 index/README/ADR-017; M12 deprecation plan; M14 Auth setting; M15 Stripe read-only inventory  
4. **P3 (Low):** L1–L8 cleanup

Each material RLS/authz change restarts Design → Document → Approve. No migrations, Stripe writes, or application patches are authorized by this record.

---

## 17. Explicit non-findings

These are **working as designed** and should not be “fixed” as mismatches:

- Three products only; Enterprise is not a SKU (ADR-019)
- Capital Projects is not a commercial product
- COM-002 tenant comms did not change billing or entitlement **keys**
- FAC-002 Phase 1 has no dedicated reporting tables
- FO denial of tenant communication in the **Next.js** layer
- Dual notices vs threads (product split), aside from empty notices UX (L8)
- Master Admin is not a membership role

---

## 18. Evidence pointers

| Claim | Evidence |
|-------|----------|
| Finance/property authz RBAC-only | `apps/web/src/lib/finance/authz.ts`, `apps/web/src/lib/property/authz.ts` |
| Maintenance/FO authz includes SKU | `apps/web/src/lib/maintenance/authz.ts`; facility report routes |
| `/api/` skipped by route entitlements | `packages/shared/src/commercial/route-entitlements.ts` L16–L27 |
| WO SELECT org-member OR | `supabase/migrations/20260806110000_launch_001_j6_maintenance.sql` L214–231 |
| `is_pm_staff` includes technician | `supabase/migrations/20260814010000_com_002_tenant_communication_center.sql` L9–28 |
| Staff comms entitlement | `packages/shared/src/communications/conversations.ts` `staffHasTenantCommsEntitlement` |
| Role set / default home | `packages/shared/src/types/roles.ts` |
| Org Admin finance/property grants | `supabase/migrations/20260806080000_launch_001_j2_team_invites.sql` L118–139 |
| Production migrations | `supabase_migrations.schema_migrations` on `vahnmcrpnuggxkivynvo` |
| Production SKUs | `organization_subscriptions` group-by (5 PM, 1 Complete, 0 FO) |
| Storage | `storage.buckets`: `media`, `media-private` |
| Advisors | Supabase `get_advisors` type `security` |
| Stripe | MCP server status `needsAuth` |

---

**STOP.** Audit design and findings only. No fixes in this package.
