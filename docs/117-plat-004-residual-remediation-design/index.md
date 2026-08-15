# PLAT-004 — Platform Mismatch Audit Residual Remediation Design

**Status:** Draft / Proposed — Design + read-only audit only  
**Date:** 2026-08-15  
**Program:** PLAT-004  
**Blueprint record:** `docs/117-plat-004-residual-remediation-design/`  
**Parent audit:** [PLAT-001](../93-plat-001-platform-mismatch-audit/index.md) (historical; restored onto this branch from `e5f29d64`)  
**C1–C5 closure:** PLAT-002 / ADR-026 live; PLAT-003 closure recorded on `origin/cursor/plat-003-platform-mismatch-audit-closure-b7a1` as `docs/101` (not yet on `main`)  
**Related ADR:** [ADR-031](../18-decision-log/adr-031-nextjs-trusted-api-mutation-plane.md) (**Proposed** — supersedes ADR-007)  
**Gate:** Design → Document → **Approve** → Implement. **No implementation is authorized from this record.**

---

## Final verdict

**REMEDIATION REQUIRED**

PLAT-001 Critical findings **C1–C5 remain CLOSED** on current Production. They are not reopened.

Open work is residual High / Medium / Low plus newly discovered grant and RPC defects. None of the open items are a new Critical SKU-bypass of the kind C1–C5 described. The blocking class is **P0 privileged RPC execute** (unauthenticated `SECURITY DEFINER` mutators and identity lookup) plus **P1 FIN-OPS grant catalog drift** (Complete / Property Manager finance APIs return 403).

### Smallest next Design → Document → Approve package

**PLAT-005 — Privileged RPC Execute Hardening** (schema-only)

- Revoke `anon` (and `PUBLIC`) `EXECUTE` on mutating and identity-lookup `SECURITY DEFINER` functions.
- Keep login resolvers off public PostgREST or behind a dedicated, rate-limited path.
- Do **not** change function business logic, grants on customer tables, SKUs, roles, or Stripe.
- Do **not** apply finance grant inserts in the same package (that is PLAT-006).

No application code, no Production apply, and no deploy are authorized until that package is Approved.

---

## Constraints honored

This package did **not**:

- Implement application code, UI, or tests
- Write or apply SQL migrations
- Modify Production data, Auth, Storage, or Edge Functions
- Deploy, merge, or change users / passwords
- Modify Stripe / billing
- Create roles, SKUs, or entitlement keys
- Remediate findings during the audit
- Rewrite historical certification evidence (`docs/80`, `81`, `88`, `89`, `95`, `103`, `110`, `112`–`115`)

`docs/93` is restored **verbatim** from commit `e5f29d64` so the parent audit is addressable on this branch. Its findings are historical; this record is the current residual audit.

---

## 1. Production snapshot (read-only, 2026-08-15)

| Layer | Value |
|-------|--------|
| Application SHA | `e56a330facf21d548815e95ff2e4c82e3c6077bd` |
| GitHub Production deploy | `5915101610` (success, `2026-08-14T23:43:10Z`) |
| Vercel | `dpl_4qLhWzb6ZcK7b1Vk6ccFVnyTC8wt` READY — `www.my-property-assistant.com` |
| Database | `mpa-prod` / `vahnmcrpnuggxkivynvo` |
| Schema ledger tip | `20260814233536` / `ops_001_operational_workspace` |
| Edge Functions | **empty** |
| Active SKUs | Property Manager **5**; Complete **1**; Facility Operations **0** |
| PLAT-002 | Live (`plat_002_production_compat` @ `20260814151825` + app pipeline) |
| FAC-002 / FAC-003 / COM-002 TCC / OPS-001 | Production certified (OPS-001 cert is `docs/116` on PR #220; not yet on `main`) |

Method: `origin/main` source at `e56a330f`; Supabase MCP `list_migrations`, `list_edge_functions`, `get_advisors`, `execute_sql`; GitHub Production deployments; live `www` read-only GETs with an existing Complete UAT session (no password or Auth writes).

---

## 2. Current mismatch counts

| Class | Count | Notes |
|-------|------:|-------|
| Critical (open) | **0** | C1–C5 stay closed |
| High (open) | **8** | H1–H4, H5-shape, H6, H7, **N1** |
| Medium (open) | **19** | M1–M16 plus **N2–N4** |
| Low (open) | **8** | L1–L8; L2 confirmed |
| Closed from PLAT-001 | **6** | C1–C5 + H5 documents-read bypass |
| Newly discovered | **4** | N1–N4 |

---

## 3. Closed from PLAT-001 (do not reopen)

| ID | Why closed on current Production |
|----|----------------------------------|
| C1 | `requireFinancePermission` → `requireAuthorizedAction` + `pm.financial_operations`. Unauthenticated `/api/finance/snapshot` is JSON 401. |
| C2 | `requirePropertyPermission` uses the same pipeline + `pm.properties`. Live Complete UAT `GET /api/pm/properties` = 200. |
| C3 | `requiredEntitlementForApiPath` + middleware JSON 401/403 on catalogued `/api/*`. |
| C4 | Production helpers `org_sku`, `org_allows_work_surface`, `can_select_work_order` exist; work-order SELECT no longer ends with bare `is_org_member`. |
| C5 | `is_pm_comms_staff` exists; comms policies use it; `anon` EXECUTE revoked on that helper. |
| H5 bypass | `requireReportPermission` requires `platform.reports`. Documents-read legacy bypass is gone (unit tests on `main`). **Shape isolation is not closed** — see H5 residual + N4. |

---

## 4. Open findings

For every open finding: ID, severity, surface, evidence, risk, recommended program, work type.

### High

#### H1 — Current-state docs still describe shipped programs as not deployed

| Field | Value |
|-------|--------|
| Severity | High |
| Surface | Blueprint index / release docs |
| Evidence | `docs/README.md` banner still says Facility Operations implement was **refused** and J3–J8 are unauthorized. Index rows for `docs/80`, `81`, `88`, `89`, `95`, `103`, `110`, `112`–`115` still say “no Production deploy” / BLOCKED. OPS-001 `docs/116` (SUCCESS) and PLAT-003 `docs/101` are not on `main`. |
| Risk | Operators and agents treat live COM-002 TCC, FAC-002, FAC-003, PLAT-002, and OPS-001 as unshipped or blocked. |
| Remediation program | **PLAT-007 Documentation current-state refresh** (docs only). Historical certs stay frozen; README + a current-state ledger change. |
| Work | Docs only. Do not rewrite `docs/80`–`115` evidence bodies. |

#### H2 — COM-002 identifier collision

| Field | Value |
|-------|--------|
| Severity | High |
| Surface | Governance / Decision Log / agent prompts |
| Evidence | ADR-018 / `docs/37`–`45` = **Self-Service Commercial**. ADR-024 / `docs/80`–`81`, `91` = **Tenant Communication Center**. Both still titled COM-002. |
| Risk | Wrong ADR, billing constraint, or schema attached to a prompt. |
| Remediation program | Canonical naming in §6 of this record. Optional later alias **TCC-001** if Product Owner renames. Do not rewrite Git history. |
| Work | Governance / docs. |

#### H3 — Production migration ledger is a July + August superposition

| Field | Value |
|-------|--------|
| Severity | High |
| Surface | Database / platform operations |
| Evidence | Production still has the full July lineage (FAC-001, API-001–005, AUTH-001, July OPS-001, BILL-001, …) **and** August successors. Repo `supabase/migrations/` is the August reset set plus later files. Filename drift continues after PLAT-001 (see §7). |
| Risk | `supabase db reset` ≠ Production. Replaying a repo file against Production can collide or double-apply objects. |
| Remediation program | This record publishes the current map. A later inventory-only reconciliation ADR; no drops. |
| Work | Docs now; schema only after a separate approve. |

#### H4 — Global role grants still contain PM capabilities; SKU is the deny

| Field | Value |
|-------|--------|
| Severity | High (residual; narrowed) |
| Surface | Authorization / entitlements |
| Evidence | Production `organization_admin` still has `pm.properties:*`, `pm.maintenance:*`, `platform.reports:read`, plus July `financial:*` / `property:*` keys. PLAT-002 SKU pipeline is the actual deny for property/finance **entitlements**. Live Complete UAT can call `/api/pm/properties` (200) and is SKU-entitled. |
| Risk | A future helper that checks RBAC only reopens C1/C2. Splitting grants is larger than SKU deny. |
| Remediation program | **Accept as defense-in-depth for now.** Future **grant-scope ADR** only if Product Owner wants SKU-scoped `role_permission_grants`. Do not change grants in PLAT-005. |
| Work | Governance (future ADR). No grant writes now. |

#### H5 residual — Shared reports shapes are not product-isolated

| Field | Value |
|-------|--------|
| Severity | High |
| Surface | `/api/shared/reports` + export |
| Evidence | Pipeline requires `platform.reports` (bypass closed). `buildOrganizationReportingSnapshot` still loads properties, leases, residents, work orders (**no `work_surface` filter**), and `getCommandCenterReport` finance facts via the trusted client. `resolveExecutivePersona` returns **`organization_owner` for every `organization_admin` before any FO check**. Live Complete UAT `GET /api/shared/reports` = 200, persona `organization_owner`, areas include `financial_performance`, `property_operations`, `resident_experience`. FAC-002 `/api/pm|facility/reports/work-orders` **does** filter `work_surface` (closed for that registry). |
| Risk | An FO-only Organization Admin (none today) receives PM/finance-shaped areas by default. Complete seeing the union is intended. |
| Remediation program | **PLAT-006** — lock persona to SKU; do not load finance facts without `pm.financial_operations`; keep FAC-002 surface filter. |
| Work | App (+ tests). No schema required. |

#### H6 — SECURITY DEFINER RPCs executable by `anon`

| Field | Value |
|-------|--------|
| Severity | High (P0 subset) |
| Surface | PostgREST `/rest/v1/rpc/*` |
| Evidence | Advisors: **22** `anon_security_definer_function_executable`. Live anon `POST /rpc/resolve_auth_user_id_by_email` = **200** (`null` for a nonexistent email). Live anon `POST /rpc/auth_resolve_login_identifier` = **200** (`[]`). Function bodies: email lookup has **no `auth.uid()` check**; `ops_claim_domain_events` / `ops_claim_due_reminders` / `ops_acquire_scheduler_leader` **mutate with no auth check**; `auth_register_username` writes `username_registry` with no auth check. Later PLAT-002/FAC-003 helpers correctly omitted `anon` (`org_sku`, `is_pm_comms_staff`, `apply_facility_stock_movement`). |
| Risk | Unauthenticated identity enumeration; unauthenticated event-queue / reminder / scheduler-lock mutation; unauthenticated username registration. |
| Remediation program | **PLAT-005** (smallest next package). |
| Work | Schema (REVOKE). App only if login still calls the resolver via PostgREST. |

#### H7 — ADR-007 vs empty Production Edge Functions

| Field | Value |
|-------|--------|
| Severity | High |
| Surface | Architecture / Decision Log |
| Evidence | ADR-007 still **Accepted**. Production Edge Functions = `[]`. All certified mutations are Next.js API routes. |
| Risk | New work oscillates between “must be an Edge Function” and “follow MEDIA-001 / ADR-026 routes.” |
| Remediation program | **ADR-031 Proposed in this package.** Accept ADR-031; mark ADR-007 superseded. Do not migrate mutations backward. |
| Work | Governance. |

#### N1 — Production is missing `pm.finance:*` role grants (NEW)

| Field | Value |
|-------|--------|
| Severity | High |
| Surface | FIN-OPS APIs / grant catalog |
| Evidence | Repo `20260806030000` / `20260806080000` insert `pm.finance:*`. Production `role_permission_grants` has **zero** `pm.finance:*` rows (July `financial:*` keys exist instead). `organization_permission_overrides` = 0. Live Complete UAT (`…ff669f`, Clinic Complete SKU) `GET /api/finance/snapshot` and `GET /api/finance/reports/command-center` = **403 Forbidden**, while `/api/pm/properties` = 200. Pipeline reaches the capability step; SKU is not the deny. |
| Risk | Property Manager and Complete Financial Operations APIs fail closed for entitled managers. Pages may load; data plane does not. Not a cross-SKU leak. |
| Remediation program | **PLAT-006** — insert the existing `pm.finance:*` keys for the same roles the repo already names. No new keys. Preview/branch first. |
| Work | Schema (grants only). App unchanged if wrappers already ask for `pm.finance:*`. |

### Medium

| ID | Title | Surface | Evidence (current) | Risk | Program | Work |
|----|-------|---------|--------------------|------|---------|------|
| M1 | No distinct Facility Manager role | Identity | `USER_ROLES` unchanged. “Facility Manager” remains `property_manager` on an FO SKU. | UAT/scripts invent roles. | Document as canonical. Real role = own ADR. | Docs / future ADR |
| M2 | FO first-login residual | Nav | `resolvePostAuthHome` **does** send FO admin/manager to `/facility/mission-control` (tests + `/dashboard`). Login without `next` goes `/dashboard`. **Residual:** `defaultHomeForRole` is still PM-biased; invitation + portal magic-link `homeHref` still use it → FO manager can be sent to `/pm/mission-control` and 403. Impersonation FO homes are already FO. Zero FO subscriptions today. | First FO customer invite 403s. | PLAT-006 or nav-only follow-on: `homeHref = resolvePostAuthHome`. | App |
| M3 | Dual resident models | COM-002 | Production `pm_residents` = 1, `lease_residents` = 1. Tenant actor still needs both. | Drift 403s a real tenant. | Later resident-identity design. | Schema + app after ADR |
| M4 | Work-order FKs not co-constrained | Maintenance | Unchanged. | Cross-property IDs. | Later schema ADR. | Schema |
| M5 | Parallel manager helpers | Authz | PLAT-002 added `org_sku` / `is_pm_comms_staff` / `can_select_work_order`. `is_pm_staff`, `is_org_manager`, `has_org_capability` remain. | Reviews pick the wrong helper. | Catalog in a later authz ADR. | Docs + later schema |
| M6 | `property_owner` staff reports | Reporting | Owner still has `platform.reports:read` (and `pm.properties:read`). No `pm.maintenance:read` / `pm.finance:*` on Production. Staff report APIs do not exclude the owner plane. | Owner cookie-org can pull staff shared reports. | PLAT-006 role allowlist. | App |
| M7 | ADR-020 / ADR-021 missing from index | Decision Log | Files exist; index jumped 019 → 023. **This package adds the rows.** | Invisible FO MVP / STAB-5 decisions. | Closed by this package’s index edit once merged. | Docs |
| M8 | Numbering gaps + stale README banner | Blueprint | Gaps 82–87, 90, 92, 96–101, 104–106, 108, 111, 116 on `main`. Banner date 2026-08-06. | Stop-notice vs live product. | PLAT-007. | Docs |
| M9 | LAUNCH-001 J3–J8 still blocked | Governance | ADR-017 unchanged; later programs shipped the surfaces. | Agents refuse live work or skip ADRs. | ADR-017 amendment (separate). | Governance |
| M10 | Dead entitlement keys | Entitlements | `pm.reports_owner` / `pm.portal_owner` still unused as gates. | Matrix lies. | Later entitlement cleanup (Owner approval — no new keys). | App / catalog |
| M11 | FO marketplace consume vs matrix ○ | Commercial | Unchanged. | Matrix vs code. | Align matrix text. | Docs |
| M12 | Dual inbox / media / property systems | Database | Production counts: `properties` 10 / `property_properties` 9; `units` 35 / `property_units` 13; `tenants` 35 / `pm_residents` 1; `conversation_threads` 3 / `comms_conversations` 2; `comms_messages` 0; `media_assets` 17 / `media_attachments` 11; `vendors` 13 / `vendor_vendors` 13. | Wrong-table queries. | Deprecation ADR later. **Do not drop.** | Docs / later schema |
| M13 | RLS on, no policies | Security | Same 9 tables as PLAT-001 (commercial + ops scheduler/receipts). Fail-closed for direct access. | “RLS on” looks reviewed. | Document service-role-only; optional explicit deny. | Schema / docs |
| M14 | Leaked-password protection off | Auth | Advisor `auth_leaked_password_protection` WARN. | Compromised passwords accepted. | Owner-approved Auth config. | Config |
| M15 | Live Stripe catalog not inspectable | Billing | Stripe MCP `needsAuth`. | Cannot certify three-product prices. | Read-only Stripe inventory. **No Stripe writes.** | Ops / docs |
| M16 | Tenant Pay vs paused FIN-OPS | Tenant portal | Nav still includes Pay. S4+ still NO-GO. | Honesty gap. | Confirm empty state; do not resume S4+. | App copy |
| N2 | Authoritative certs missing from `main` (NEW) | Governance | `docs/93` lived only on the PLAT-001 branch; `docs/101` (PLAT-003) and `docs/116` (OPS-001 SUCCESS) are on other branches. Index on `main` cannot cite them. | Current-state amnesia. | Land historical records without rewriting bodies (93 restored here). Merge 101/116 through their PRs or cite as historical. | Docs |
| N3 | Authored-document RLS broader than workspace staff (NEW) | OPS-001 | `document_documents` SELECT = `is_org_member`. Workspace tables require staff roles. App: list/PDF use `requireDocumentPermission` (any documents-entitled member); create/edit use `requireWorkspaceWrite`. OPS-001 UAT: vendor authored GET 200; tenant list 200 empty. | Same-org tenant/vendor PostgREST can SELECT authored rows if they are members. | Later OPS follow-on (no feature expansion): align authored SELECT to workspace staff **or** keep member-read as product. | Schema and/or app after approve |
| N4 | Shared reports `persona` query override (NEW) | `/api/shared/reports` | Live `?persona=facility_manager` switches Complete admin to FO areas; `?area=financial_performance` returns that block. No SKU check on the override. | Callers pick another product’s shape. | PLAT-006 — ignore override unless it is a subset of SKU persona. | App |

### Low

| ID | Title | Current evidence | Program | Work |
|----|-------|------------------|---------|------|
| L1 | FO APIs reuse `pm.maintenance:*` names | Still true (`requireFacilityOperation("pm.maintenance:read", "facility.operations")`). | Later authz ADR. | App |
| L2 | Missing `comms_notifications.conversation_id` index | Production indexes: PK + `(organization_id, user_id, created_at)`. **No conversation_id index.** 6 rows today. | Later COM-002 schema. | Schema |
| L3 | `docs/09` / `docs/26` table-name drift | Unchanged. | After H3 map. | Docs |
| L4 | `facility_technician` is not a role | Still true. `WORKSPACE_STAFF_ROLES` omits it (fail-closed). Impersonation label exists. | UAT glossary. | Docs |
| L5 | `STRIPE_PRICE_FO_PROFESSIONAL_*` env names | Unchanged. | With M15. | Config |
| L6 | `facility.capital_projects` future-only | Route still redirects to FO mission control. Constitution holds. | Keep off. | None |
| L7 | Mutable `search_path` | 8 advisor WARNs (`set_updated_at`, FO triggers, billing helpers, `gen_random_bytes`, …). Privileged RPCs in the H6 set **are** pinned. | PLAT-005 may pin leftovers if in-scope; else later. | Schema |
| L8 | Dual comms inboxes | `comms_messages` still 0; threads/conversations both present. | UX copy. | Docs / copy |

---

## 5. Documentation drift

### Historical evidence — do not rewrite

These records describe the world **at write time**. They remain certification evidence:

| Record | Historical claim | Treat as |
|--------|------------------|----------|
| `docs/80`, `81`, `91` | COM-002 TCC design/cert; “no Production deploy” / UAT re-run | Historical |
| `docs/88`, `89` | FAC-002 design/cert; no deploy | Historical |
| `docs/94`, `95` | PLAT-002 design/cert; no deploy from that package | Historical (app later shipped) |
| `docs/102`, `103`, `107`, `109`, `110` | FAC-003 design/certs | Historical |
| `docs/112`–`115` | OPS-001 design → migration apply; 115 says app still `aee7fa95` | Historical |
| `docs/74`, `76`–`79` | MEDIA / Complete / RC; no deploy or BLOCKED | Historical |
| `docs/93` | PLAT-001 findings at SHA `102b63da` | Historical (restored verbatim) |
| `docs/101` (unmerged) | PLAT-003 C1–C5 CLOSED at `4b45c6e2` | Historical closure |
| `docs/116` (unmerged) | OPS-001 PRODUCTION RELEASE SUCCESSFUL at `e56a330f` | Historical release cert |

### Current-state documents that should be refreshed (PLAT-007)

- `docs/README.md` constitution banner and index Production flags
- `docs/18-decision-log/index.md` (020/021/031 handled in this package)
- ADR-017 journey-gate wording (needs its own amendment)
- `docs/09`, `docs/26` table names (L3)

---

## 6. Identifier and ADR indexing (canonical approach)

### COM-002

Keep both historical codes. **New records must use the full title:**

| Code | Full title | Alias for new work | ADR |
|------|------------|--------------------|-----|
| COM-002 | Self-Service Commercial | **COM-002-SSC** | ADR-018 |
| COM-002 | Tenant Communication Center | **COM-002-TCC** (optional **TCC-001** if Owner renames) | ADR-024 |

Do not rewrite commits, PR titles, or historical headings. Search indexes should list both aliases.

### ADR numbers

| Number | State |
|--------|--------|
| 001–021, 023–026, 028–030 | Assigned (020/021 files existed; index rows added here) |
| **022** | Intentionally unused — **do not fill** |
| **027** | Intentionally unused — **do not fill** |
| **031** | ADR-031 Proposed (this package) |
| Next new ADR | **032** |

Do not reuse 022/027 to “close gaps.” Out-of-order reuse is how collisions happen.

---

## 7. Production migration lineage

**Rule:** never replay a repo file whose objects already exist under a Production successor. Fresh environments use repo files; Production uses successors only.

| Repo file | Production-applied successor | Purpose | State | Replay on Production? |
|-----------|------------------------------|---------|-------|------------------------|
| July identity / domain files (in repo: `20260714010000`–`40000` only) | Full July ledger through `20260728022516` | Phase 3–7 + FAC-001 + API-001–005 + AUTH/COM/OPS July + BILL | Compatibility-required | **Never** re-apply July Production-only names |
| `20260806010000` commercial subscriptions | `20260808225706` `phase1_commercial_subscriptions` | SKUs | Active | No |
| `20260808010000`–`30000` COM-002-SSC | `20260808225718`–`230241` | Checkout / provision / lifecycle | Active | No |
| `20260811140000_stab004_facility_work_surface.sql` | `fo_prod_enablement_a`–`d` @ `20260813231223`–`232103` | FO enablement + `work_surface` | Active | **Never** |
| `20260814010000_com_002_tenant_communication_center.sql` | `com_002_prod_compat_prerequisites` @ `20260814012322` + `com_002_tenant_communication_center` @ `20260814012357` | COM-002-TCC | Active | **Never** the repo stamp |
| `20260814030000_com_002_uat_remediation.sql` | `com_002_uat_remediation` @ `20260814030010` | TCC UAT RLS | Active | **Never** |
| `20260814160000_plat_002_authorization_hardening.sql` | `plat_002_production_compat` @ `20260814151825` | C4/C5 helpers + policies | Active | **Never** |
| `20260814200000_fac_003_asset_inventory.sql` | `fac_003_asset_inventory` @ `20260814163540` | FAC-003 | Active | **Never** |
| `20260814210000_fac_003_production_uat_remediation.sql` | `fac_003_production_uat_remediation` @ `20260814224518` | RETURNING-safe SELECT | Active | **Never** |
| `20260814220000_ops_001_operational_workspace.sql` | `ops_001_operational_workspace` @ `20260814233536` | OPS-001 Phase 1 | Active | **Never** (`220000`) |
| `20260814233536_ops_001_operational_workspace.sql` | Same version already applied (byte-identical successor stamp) | Ledger alignment | Applied | **Never** re-apply |

July Production-only programs (FAC-001 slices, API-001–005, AUTH-001, July OPS-001, COM-001, BILL-001, screening, signatures, migration center) have **no same-named repo file** after the August reset. They are compatibility-required objects. Do not drop.

---

## 8. SECURITY DEFINER / RPC inventory

Owner for all listed functions: `postgres`. `search_path` is pinned on this set unless noted. Application callers are Next.js trusted routes or RLS policy bodies unless stated.

| Function | Purpose | EXECUTE | Anon | RLS interaction | App caller | Class |
|----------|---------|---------|------|-----------------|------------|-------|
| `resolve_auth_user_id_by_email` | `auth.users.id` by email | anon, authenticated, service_role | **Yes** | Bypasses auth schema RLS | Legacy lookup | **P0 revoke anon** |
| `auth_resolve_login_identifier` | Username/email → principal + email | anon, authenticated, service_role | **Yes** | Reads `auth.users` | Login dual-run | **P0** — move off PostgREST or revoke anon |
| `auth_register_username` | Insert/update `username_registry` | anon, authenticated, service_role | **Yes** | Writes as definer | Registration | **P0 revoke anon** |
| `ops_claim_domain_events` | Claim event bus rows | anon, authenticated, service_role | **Yes** | Mutates events | Cron / dispatcher | **P0 revoke anon+authenticated**; service_role only |
| `ops_claim_due_reminders` | Claim due reminders | anon, authenticated, service_role | **Yes** | Mutates reminders | Reminder engine | **P0** same |
| `ops_acquire_scheduler_leader` | Scheduler lock | anon, authenticated, service_role | **Yes** | Mutates leader row | Scheduler | **P0** same |
| `apply_facility_stock_movement` | Stock ledger | authenticated, service_role | No | `auth.uid()` + FO helpers | FAC-003 API | Active; keep authenticated if RPC is the API |
| `org_sku` / `org_allows_work_surface` / `can_select_work_order` | PLAT-002 surface | authenticated, service_role | No | Used by WO policies | Policy / helpers | Active |
| `is_pm_comms_staff` / `can_access_tenant_conversation` | COM-002-TCC | authenticated, service_role | No | Conversation policies | Policy | Active |
| `can_manage_facility_ops` / `can_select_facility_*` | FAC-003 | authenticated, service_role | No | Asset/stock policies | Policy / stock RPC | Active |
| `is_org_member` / `is_org_manager` / `is_pm_staff` / `has_org_capability` / `is_*` helpers | Legacy authz | **PUBLIC + anon** on most | **Yes** | Policy helpers | Policy | Revoke **anon/PUBLIC**; keep authenticated for in-policy use |
| `resolve_building_qr_token` | Public QR resolve | PUBLIC + anon | Yes | Reads legacy `properties` | Enrollment | Review; public may be intentional |
| `create_building_qr_code_for_property` | Trigger | PUBLIC + anon | Yes | Trigger only | Trigger | Revoke RPC execute; keep as trigger |
| `rls_auto_enable` | Event trigger | PUBLIC + anon | Yes | DDL | Event trigger | Not a useful RPC; revoke execute |

Unnecessary **anon EXECUTE** on the P0 set is classified **High** (this audit). Boolean `is_*` helpers with anon EXECUTE are High-adjacent (information leak of membership) and should lose `anon` in the same PLAT-005 pass.

---

## 9. Grant-scope mismatch (H4)

**Decision for this design:** remain **defense-in-depth**. SKU entitlement is the deny. Do not change grants in the next package.

A future grant-scope ADR is warranted only if Product Owner wants `role_permission_grants` to stop carrying `pm.*` on Facility Operations actors. That is larger than PLAT-005 and collides with N1 (finance keys must be **added**, not split, first).

N1 is a different defect: the August `pm.finance:*` catalog never landed on Production, so FIN-OPS APIs 403 even when SKU allows them.

---

## 10. Shared reports shape isolation

| Product | Default persona (org admin) | Areas returned (live / code) | FAC-002 WO registry |
|---------|-----------------------------|------------------------------|---------------------|
| Property Manager | `organization_owner` | Property / resident / finance / commercial | `/api/pm/reports/work-orders` · `work_surface=residential` |
| Facility Operations | `organization_owner` (**not** `facility_manager`) | Same PM/finance-shaped areas if any facts exist | `/api/facility/reports/work-orders` · `work_surface=facility` |
| Complete | `organization_owner` | Union — **intended** | Both registries |

PLAT-002 closed the RBAC/SKU bypass. It did **not** close product-shaped data. `persona` and `area` query params further widen the shape (N4). Finance facts are loaded even when finance APIs 403 (N1) — shared reports can show a financial **area block** built from `getCommandCenterReport` while `/api/finance/*` is forbidden.

---

## 11. FO first-login / `defaultHomeForRole`

| Actor | Canonical home (`resolvePostAuthHome`) | `defaultHomeForRole` | 403 risk |
|-------|----------------------------------------|----------------------|----------|
| Property Manager-only admin / `property_manager` | `/pm/mission-control` | `/pm/mission-control` | No |
| Facility Operations-only admin / `property_manager` | `/facility/mission-control` | `/pm/mission-control` | **Yes** if invite/`next` uses role home |
| Complete admin / `property_manager` | `/launcher` | `/pm/mission-control` | Invite may skip launcher (not a 403) |
| `organization_admin` | SKU home as above | `/pm/mission-control` | Same as manager |
| `facility_technician` | Not a role → `/unauthorized?reason=role` if it appeared | `/dashboard` | Fail-closed |
| `maintenance_technician` on FO SKU | Remapped to `/facility/mission-control` | `/pm/maintenance` | Invite residual |
| Tenant / vendor / owner | Portal paths | Portal paths | No |

Normal login (`/login` → `/dashboard`) is SKU-safe. **An FO-only manager can still be sent initially to `/pm/mission-control` and receive 403** via invitation accept or portal magic-link `homeHref`. No FO-only subscription exists to observe this live.

---

## 12. ADR-007 / architecture drift

Production does not match ADR-007. This package **does not** force Edge Functions back.

**ADR-031 is Proposed:** Next.js trusted API + ADR-026 pipeline is the mutation plane; Edge Functions optional. Accept ADR-031 in the same governance pass as this design, or with PLAT-005. No code move is required to accept it.

---

## 13. OPS-001 follow-on security review (no feature expansion)

| Control | Current Production / source | Verdict |
|---------|-----------------------------|---------|
| Authored-document RLS | `document_documents` SELECT `is_org_member`; write `is_org_manager` | Weaker than workspace staff (N3). App list/PDF = documents entitlement, not staff. |
| Workspace table RLS | Staff-role EXISTS + `is_org_member`; write `is_org_manager` | Aligns with `WORKSPACE_STAFF_ROLES` / `WORKSPACE_MANAGER_ROLES`. `{public}` policy role is OK because quals use `auth.uid()`. |
| Source entitlement | `canAccessConnection` / `documentsEntitlementIsNotEnough` | Enforced in connection service. |
| Connected-table no-writeback | `rejectWriteback`; row PATCH/DELETE go through workspace write + connection service | Boundary holds in code; UAT certified on `e56a330f`. |
| Snapshot semantics | `snapshot_at` column updated on snapshot POST; API map may omit the field | Column exists; product snapshot is server-side. |
| CSV/XLSX export | `requireWorkspaceRead` + `auditTableExport` | Staff-gated. |
| PDF export | `requireDocumentPermission` (not staff) | Vendor PDF can fail-closed on `audit_events` RLS (OPS-001 UAT). |
| Audit-event coverage | Table export audited; some document PDF paths depend on `audit_events` insert RLS | Residual fail-closed, not a data leak. |
| Organization isolation | All workspace quals include `organization_id` + membership | Holds. |
| Template surface filtering | `templatesForSku` filters `pm` / `fo` / `both` | Holds in shared module. |
| Uploaded-document regression | `kind` check (`file` \| `authored`); file path still uses document permission | One authored row, zero file rows in Production today. Do not expand. |
| `facility_technician` | Not in `WORKSPACE_STAFF_ROLES` | Fail-closed (L4). |

Do not expand OPS-001 functionality from this audit.

---

## 14. Legacy / dead schema (do not drop)

| Object | Classification | Notes |
|--------|----------------|-------|
| `property_properties` / `property_units` | **Active** | Current portfolio / FO site mapping |
| `properties` / `units` | **Compatibility-required** | 10 / 35 rows; QR helper still joins `properties` |
| `pm_residents` / `lease_residents` | **Active** | COM-002-TCC tenant actor |
| `tenants` | **Compatibility-required** | 35 rows |
| `comms_conversations` / `comms_notifications` | **Active** | TCC |
| `comms_messages` (notices) | **Historical / read-only** | 0 rows |
| `conversation_threads` / `communication_messages` / `in_app_notifications` | **Compatibility-required** | Legacy inbox; 3 / 2 / 19 rows |
| `media_attachments` | **Active** | MEDIA-001 |
| `media_assets` | **Compatibility-required** | 17 rows |
| `vendor_vendors` | **Active** | |
| `vendors` | **Compatibility-required** | 13 rows |
| `document_documents` (+ versions/links) | **Active** | Uploaded + authored |
| `workspace_tables` / columns / rows | **Active** | OPS-001 |
| July `ops_*` event/scheduler/workflow tables | **Compatibility-required** | July OPS-001 ≠ August OPS-001 workspace |
| `commercial_*`, `saas_webhook_events`, `credential_deliveries` | **Active or service-role-only** | M13 no-policy |
| `facility_assets` / stock | **Active** | FAC-003 |

**Candidate for later deprecation** (not now): `tenants`, `properties`/`units`, legacy comms threads, `media_assets`, `vendors`, empty `comms_messages`. Each needs a deprecation ADR.

---

## 15. Prioritization

| Priority | Meaning | Items |
|----------|---------|-------|
| **P0** | Can expose or mutate unauthorized data | H6 P0 subset (`ops_claim_*`, `ops_acquire_scheduler_leader`, `auth_register_username`, email/login resolvers on anon) |
| **P1** | Authorization / RPC / grant weakness | N1 finance grants; remaining H6 helper anon EXECUTE; H5-shape + N4; N3 authored RLS; H4 (watch, do not change yet); M6 |
| **P2** | Navigation, architecture, lineage, governance | H7 / ADR-031; H3 lineage discipline; M2 invite homes; M5; M9 |
| **P3** | Cleanup / deprecation / documentation | H1, H2, M7 (index in this PR), M8, M10–M16, L1–L8, M12 deprecation, N2 remaining certs |

Documentation drift is **not** P0/P1.

---

## 16. Recommended programs (do not implement from here)

```
PLAT-005  Privileged RPC Execute Hardening     ← smallest next Approve package
PLAT-006  Finance grant reconciliation
          + shared-reports persona/SKU lock
          + invite homeHref = resolvePostAuthHome
ADR-031   Accept (docs) — mutation plane
PLAT-007  Documentation current-state refresh
Later     Grant-scope ADR (optional)
          Resident-identity ADR
          Legacy-table deprecation ADR
          ADR-017 journey-gate amendment
```

---

## 17. Explicit non-findings

- C1–C5 are not open.
- FAC-002 work-order export surface isolation holds.
- OPS-001 connected-table writeback rejection holds in application code.
- No FO-only customer exists to demonstrate H5/M2 live; both are latent but real in source.
- Cross-org isolation of workspace tables holds.
- Capital Projects remains non-product (L6).
- This audit did not inspect live Stripe prices (M15).

---

## 18. Evidence pointers

- Source SHA: `e56a330facf21d548815e95ff2e4c82e3c6077bd`
- PLAT-001 historical: `docs/93` / commit `e5f29d64`
- Pipeline: `apps/web/src/lib/auth/require-authorized-action.ts`
- Homes: `packages/shared/src/auth/post-auth-home.ts`, `packages/shared/src/types/roles.ts`, `apps/web/src/lib/team/invitation-service.ts`
- Reports: `apps/web/src/app/api/shared/reports/route.ts`, `apps/web/src/lib/reports/analytics-service.ts`, `packages/shared/src/reports/insights.ts`
- FAC-002: `apps/web/src/lib/work-order-reports/service.ts` (`work_surface` filter)
- OPS-001: `packages/shared/src/workspace/connections.ts`, `packages/shared/src/workspace/roles.ts`, `apps/web/src/lib/documents/authz.ts`
- Production: `schema_migrations` tip `20260814233536`; advisors 2026-08-15; live Complete UAT finance 403 / reports 200 / properties 200; anon RPC 200

---

## 19. Approval ask

Product Owner + Architect:

1. Accept this record as the current residual audit (PLAT-001 remains historical).
2. Accept **ADR-031** (or reject and keep ADR-007 — not recommended).
3. Authorize **design of PLAT-005 only** after this record is Approved. Implementation of PLAT-005 still requires its own Design → Document → Approve.

**No implementation authorization is granted by this document.**
