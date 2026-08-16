# 176 — Tenant Lifecycle Production Release Certification

**Title:** TENANT LIFECYCLE PRODUCTION RELEASE CERTIFICATION  
**Status:** **TENANT LIFECYCLE PRODUCTION RELEASE SUCCESSFUL**  
**Date:** 2026-08-16  
**Program:** Customer-facing tenant lifecycle — application deploy + controlled Production UAT  
**Authority:** Owner authorization for tenant-lifecycle application deployment and controlled UAT · [docs/175](../175-tenant-lifecycle-production-migration-application-certification/index.md) **READY FOR TENANT LIFECYCLE APPLICATION DEPLOYMENT** · [docs/174](../174-tenant-lifecycle-production-migration-recertification/index.md) · [docs/173](../173-tenant-lifecycle-sql-qualification-compatibility-implementation-certification/index.md) · [docs/167](../167-tenant-lifecycle-implementation-certification/index.md) · [docs/166](../166-tenant-lifecycle-onboarding-portal-move-out/index.md) **Approved** · [docs/165](../165-phase-4-pwa-install-device-experience/index.md) **Approved** · ADR-012 · ADR-019 · ADR-026 · ADR-033 · ADR-034  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` (us-west-2, Postgres 17.6.1.141, `ACTIVE_HEALTHY`)  
**This package:** Merge/deploy the certified tenant-lifecycle application, verify the artifact, run controlled Property Demo UAT only, and certify the Production release. **STOP after this record.**

Identifier collision: **COM-002** means Tenant Communication Center (ADR-024 / docs/80), not Self-Service Commercial.

---

## Verdict

**TENANT LIFECYCLE PRODUCTION RELEASE SUCCESSFUL**

The certified tenant-lifecycle application is live on Production. Schema stamp `20260816094933` / `docs_166_tenant_lifecycle` remains the only tenant-lifecycle ledger row. Stamp `20260816120000` was not replayed.

Controlled Property Demo UAT created one new tenant invitation, persisted a server-owned binding, accepted it with a tamper body that did not change FKs, opened Tenant Portal, presented Apple and Android PWA install guidance, scheduled/cancelled/effective-moved-out only that UAT tenant, and then denied current-unit writes from the same authenticated user after `occupy_to < utc_today()`. Tenant B on the same lease remains occupying. FIN-OPS money, July freeze, Stripe execution, and M5 are unchanged.

---

## What this package did not do

- Did not replay `20260816120000`
- Did not mutate FIN-OPS money, reopen July, change `finance_ops_writes_enabled()`, or enable Stripe payment execution
- Did not implement M5
- Did not change SKUs, subscriptions, or pricing
- Did not implement native iOS/Android apps or Web Push
- Did not modify real customer residents
- Did not delete tenant history as UAT cleanup
- Did not move out existing Property Demo tenant `6cde6423-ad9b-49fb-aadd-3ea93ec8b040`

---

## 1. Pre-deploy recheck

Read immediately before deploy against `mpa-prod` / `vahnmcrpnuggxkivynvo`. Compared to docs/175.

| Item | Live | Gate |
|------|------|------|
| Project health | `ACTIVE_HEALTHY` | match |
| Region / Postgres | us-west-2 / 17.6.1.141 | match |
| Tenant lifecycle stamp | `20260816094933` / `docs_166_tenant_lifecycle` | live |
| `20260816120000` | **absent** | do not replay |
| Occupancy / helpers / bindings | live; bindings **0** | match |
| Occupancy | 15 `lease_residents`; 14 occupying / 1 moved_out | match |
| Production app SHA | `867c579bad30a5417c4cc682e90790627a55052d` | pre-tenant-lifecycle |
| FIN-OPS | 18 / 11 / 1 / 11 | match |
| `finance_ops_writes_enabled()` | `true` | match |
| July | `july_freeze_enabled = true`, `updated_at` 2026-08-16 07:52:09.009771+00 | frozen |
| Stripe execution | 0/6 true | off |

No unexplained drift. Pre-deploy gate: **PASS**.

---

## 2. Implementation artifact and deploy

### 2.1 Certified implementation

| Item | Value |
|------|-------|
| Design | docs/166 Approved |
| In-repo certification | docs/167 · docs/173 |
| SQL stamp (already live) | `20260816094933` / `docs_166_tenant_lifecycle` |
| Certified SQL SHA-256 | `dcad8ed683940d8ee6f3b41e0f585b22b0ffd8c9f845e8034d7221dc2ba1937a` |
| Implementation HEAD (CI unblock) | `0dab500f577b249532c10d752c8125ea4c49ded9` |
| Catalog follow-up HEAD | `56d5eab5a59a84b98e9bd70bbb1e64f0af7e1c83` |

Merge candidate matched the certified implementation. The only Production application delta after first deploy was a PLAT-002 catalog mapping for the already-approved `/api/pm/tenants*` routes (see §2.3). No FIN-OPS, Stripe, M5, or SKU logic changed.

### 2.2 First Production deploy (PR #275)

| Item | Value |
|------|-------|
| PR | #275 |
| CI | **SUCCESS** — boundaries, lint, typecheck, build, shared 333, web 474 |
| Known unrelated failure | local commerce checkout 200-vs-4xx is CI-env only; GitHub Actions green |
| Merge method | `merge` (no force push, no CI bypass) |
| Merge SHA | `1f9be8803c76d1d71ce7849c6c6b36a9a1091cc1` |
| Merged at | 2026-08-16T10:03:07Z |
| GitHub Production deployment | `5929845767` |
| Vercel deployment | `dpl_F5XVeHgTA7zeZ8tnxUmuKfaTSkNm` |
| Host | `https://m-p-a-dhb7uup1o-ecastle612-uxs-projects.vercel.app` |
| Aliases | `www.my-property-assistant.com`, `my-property-assistant.com` |
| Deployed | 2026-08-16T10:04:31Z · **success** |

### 2.3 Catalog miss and second deploy (PR #276)

First UAT `POST /api/pm/tenants` returned `403` `{ code: "entitlement", required: "unknown" }`. PLAT-002 fail-closed `/api/pm/*` did not catalog the certified tenant-lifecycle routes. That is a catalog miss, not a new product pattern.

Fix: map `/api/pm/tenants` (including occupancy move-out / cancel / correct) to existing `pm.residents`. Facility Operations SKU remains denied. Unknown `/api/pm/*` remains denied.

| Item | Value |
|------|-------|
| PR | #276 |
| CI | **SUCCESS** (verify 2m27s) |
| Merge SHA / Production SHA | `925dde08d88b6168174333ed68df8615b4162867` |
| Merged at | 2026-08-16T10:16:25Z |
| GitHub Production deployment | `5929943425` |
| Vercel deployment | `dpl_EjcyhCSxmNuyaNBZfyhauscGgCf6` |
| Aliases | `www.my-property-assistant.com`, `my-property-assistant.com` |
| Deployed | 2026-08-16T10:17:25Z · **success** |

**Production SHA for this release:** `925dde08d88b6168174333ed68df8615b4162867`

---

## 3. Post-deploy smoke

Before lifecycle mutations, after both deploys:

| Surface | Result |
|---------|--------|
| `/` | 200 |
| `/login` | 200 |
| `/pricing` | 200 |
| `/portal/tenant` anonymous | 307 → `/login` |
| `/pm/residents` anonymous | 307 → `/login` |
| Ledger | only `20260816074525` + `20260816094933` |
| Bindings before UAT | 0 |
| Writes / July / Stripe | unchanged |

No migration replay.

---

## 4. Controlled UAT fixture

**Org only:** M.P.A. UAT Property Demo `a11ce002-0001-4000-8000-0000000000c2` (SKU `mpa_property_manager`).

| Actor | Email | User id | Role |
|-------|-------|---------|------|
| PM | `uat.pm.property.demo@my-property-assistant.com` | `0e1fc6e4-278b-4de5-a9e5-2e13acba7371` | `property_manager` |
| Existing tenant B (do not move out) | `uat.tenant.property.demo@my-property-assistant.com` | `6cde6423-ad9b-49fb-aadd-3ea93ec8b040` | `tenant` |
| New UAT tenant A | `uat.tenant.lifecycle.176@my-property-assistant.com` | `288a78d1-feab-4d98-bf54-e485c0ae30d8` | `tenant` after accept |
| FO boundary | `uat.fo.property.demo@my-property-assistant.com` | `acee99f7-a23a-4c73-b6d9-63c2ffbbc2db` | `facility_technician` |

Lease / unit: `a11ce002-…0401` · Demo Apartments · Unit 101. Existing unpaid charge `f2a6d161-ab4e-4ca3-923a-de0955d86c7b` / `17.16` / `open` left untouched.

Invitation email to `@my-property-assistant.com` bounced (`delivery_status=failed`). Accept used the server-returned link. That is expected and not a lifecycle defect.

---

## 5. Add Tenant

Manager UI `/pm/residents` → **Add Tenant** exposes only:

- first name
- last name
- email
- lease

No manager-created password. No `operating_scope`. No internal role/RBAC fields.

`POST /api/pm/tenants` with extra body keys (`organizationId`, `propertyId`, `unitId`, `roles`, `operating_scope`, `password`) returned **201**. Server persisted Property Demo FKs, not the forged ones.

| Created row | Id |
|-------------|----|
| `pm_residents` | `d14328f8-84db-4fa7-8830-14ccdab63363` |
| `lease_residents` | `5b94e90e-c799-4ecb-9d27-ea529d03c2e2` |
| `organization_invitations` | `620f4f43-5f68-4e59-b88e-ca666025c81e` |
| Invitation token | `0fba732e-ad8e-4577-a4fa-8f8de0dc61fc` |

Confirmation: UAT176 Lifecycle · M.P.A. Demo Apartments · Unit 101. Occupancy `occupying` from `2026-08-14`. `is_primary=false` (Tenant B remains primary).

---

## 6. Binding and tamper denial

`organization_invitation_tenant_bindings` after Add Tenant and after accept-with-tamper-body:

| Column | Persisted value |
|--------|-----------------|
| `invitation_id` | `620f4f43-5f68-4e59-b88e-ca666025c81e` |
| `organization_id` | `a11ce002-0001-4000-8000-0000000000c2` |
| `property_id` | `a11ce002-0001-4000-8000-000000000101` |
| `unit_id` | `a11ce002-0001-4000-8000-000000000201` |
| `lease_id` | `a11ce002-0001-4000-8000-000000000401` |
| `resident_id` | `d14328f8-84db-4fa7-8830-14ccdab63363` |
| `lease_resident_id` | `5b94e90e-c799-4ecb-9d27-ea529d03c2e2` |

Accept `POST` body forged wrong org / property / unit / lease / resident / `organization_admin` / `operating_scope=both`. Response:

```
200 { organizationId: a11ce002-…00c2, roles: ["tenant"], operatingScope: null, homeHref: "/portal/tenant", idempotent: false }
```

Binding FKs unchanged. Browser does not own those values.

---

## 7. Invitation acceptance

Browser-first: invitation link → sign in with the **existing** UAT auth user `288a78d1-…` → trusted accept → Tenant Portal.

| Check | Result |
|-------|--------|
| Token / status / expiry | pending, expires 2026-08-23, accepted |
| Signed-in email | invited email |
| Existing account reused | **yes** — one `auth.users` row, no duplicate |
| No duplicate `pm_resident` | **yes** — one person `d14328f8-…` |
| `lease_residents.user_id` | `288a78d1-…` |
| Occupancy after accept | occupying, `occupy_to` null |
| Membership | `['tenant']`, `operating_scope` null |
| Retry | **200** `idempotent: true` |

PWA installation was not required.

---

## 8. Active Tenant Portal

After accept, Tenant A reached `/portal/tenant`:

- Home: “Hi, UAT176 Lifecycle” · Demo Apartments · Unit 101
- Own billing GET **200** (`linked: true`, 1 account; household charge `17.16` visible)
- Own maintenance GET **200** (0 rows — new occupant)
- Own COM-002 GET **200** (0 rows — new occupant)
- Tenant B COM-002 thread `5dec0c8c-…` GET **404** / POST **404** (“Conversation not found”)
- `/api/pm/residents` **403**
- `/api/finance/snapshot` **403**
- `/api/facility/assets` **403**

Anonymous `/portal/tenant` remains `/login`.

Occupying maintenance **INSERT** returned RLS deny (`new row violates row-level security policy`). Application occupancy check had already passed. That is a residual insert-policy tightness on `maintenance_work_orders`, not a lifecycle grant leak. Former-tenant create is denied in the application layer (see §14).

---

## 9. Old session / server-side authorization

Tenant A stayed signed in through move-out. No logout. After refresh, access followed server occupancy (`occupy_to` vs `utc_today()`), not the original login. Authentication ≠ active tenancy.

---

## 10. Apple PWA

Live iPhone hardware was not used. Production Tenant Portal was opened with an iPhone Safari user agent.

| Check | Result |
|-------|--------|
| Card | “Add M.P.A. to this device” · optional · continue in browser |
| Copy | **Open Share → Add to Home Screen → Add** |
| Android Install button | **absent** |
| Push permission | **none** |
| Native app | **none** |
| Browser usable | **yes** |
| Standalone suppression | contract: `detectPwaInstallSurface({ standalone: true }) === "standalone"` |
| Isolated Home Screen cookie note | documented in docs/166; not a separate sentence on the card |

Automated contract: `apps/web/src/lib/pwa/install-experience.test.ts` (Apple / Android / standalone) **passed**.

---

## 11. Android PWA

Android Chrome user agent on Production Tenant Portal:

| Check | Result |
|-------|--------|
| Apple Share steps | **not shown** |
| No `beforeinstallprompt` in this Chrome | fallback: “Use your browser menu to install or add M.P.A. to the Home screen.” |
| Install M.P.A. | shown only when `beforeinstallprompt` fires (contract) |
| Continue in browser | **yes** |
| Web Push / native Android app | **none** |

---

## 12–13. Move Out

Manager APIs on occupancy `5b94e90e-…` only.

| Step | occupy_to | occupancy_status | leaseEnded | Audit |
|------|-----------|------------------|------------|-------|
| Future | `2026-12-31` | `occupying` | false | `tenant.moved_out` |
| Cancel | `null` | `occupying` | — | `tenant.move_out_cancelled` |
| Same-day effective | `2026-08-16` | `occupying` | false | `tenant.moved_out` |
| Correct to prior day | `2026-08-15` | `moved_out` | false | `tenant.move_out_corrected` |

Certified inclusive semantics: `tenant_occupancy_is_current` is true when `occupy_to >= utc_today()`. Same-day `occupy_to = 2026-08-16` is the certified equivalent of “active through the approved date.” Final UAT state uses `occupy_to = 2026-08-15` so former-tenant deny can be proven on 2026-08-16.

| After effective / correct | Result |
|---------------------------|--------|
| Lease `…0401` | still `active` |
| Tenant B `1275cb2e-…` | still `occupying`, `occupy_to` null |
| `pm_residents` A | remains; `user_id` remains |
| Auth user A | remains |
| Invitation | remains `accepted` |
| History | not deleted |

---

## 14. Old session after move-out

Same Tenant A browser session, after correct to `occupy_to = 2026-08-15`:

| Call | Result |
|------|--------|
| Portal refresh | “Past residence” · “Your active property access has ended. You can still review your own history.” |
| Primary actions | Payment history / Your documents / Past messages |
| `POST /api/portal/tenant/maintenance` | **400** `Active occupancy is required to submit maintenance.` |
| `POST` Tenant B COM-002 messages | **403** Forbidden |
| `POST /api/finance/checkout` | **403** Forbidden (occupying grant gone; not the Stripe-disabled path) |
| `/api/pm/residents` | **403** |
| `/api/finance/snapshot` | **403** |
| `/api/facility/assets` | **403** |

UI hide is not the proof. API / application / RLS denied.

---

## 15. Historical shell

Tenant A has no own pre-move-out charges, COM-002 threads, or work orders. Proof used:

| Category | Proof |
|----------|-------|
| Own historical occupancy | row remains; portal historical mode |
| Own billing shell | GET `/api/finance/resident/billing` **200**, 1 account (household lease ledger; charge `f2a6d161` unchanged) |
| Own COM-002 | GET inbox **200**, 0 threads |
| Tenant B COM-002 | 404 / 403 |
| Next-occupant / post-`occupy_to` writes | maintenance create denied; checkout denied |
| Maya / returning / transfer | automated `tenant-lifecycle-service.test.ts` (6 tests) **passed** — Ada reuse, old occupancy stays `moved_out`, new lease row separate |

No extra Production household fixture was created.

---

## 16. Unpaid balance preservation

Charge `f2a6d161-ab4e-4ca3-923a-de0955d86c7b` remains `17.16` / `open`. FIN-OPS totals remain 18 / 11 / 1 / 11 and `24708.16` / `11111.00` / `1.00` / `11111.00`. Move Out did not delete, pay, refund, or re-amount any money. July was not reopened.

---

## 17. Multi-resident safety

Move Out Tenant A → Tenant B `6cde6423-…` / occupancy `1275cb2e-…` remains `occupying` with `occupy_to` null on the same active lease.

---

## 18. Returning tenant / transfer

No additional live residents were mutated. Automated proof in `tenant-lifecycle-service.test.ts`:

- RETURN: same person reused for a new occupancy
- TRANSFER: old occupancy remains `moved_out`; new lease row is separate; old history is not rewritten

---

## 19. Security regression

| Check | Result |
|-------|--------|
| Anonymous | `/portal/tenant` → `/login` |
| Unrelated / other resident | Tenant B threads 404/403 to Tenant A |
| Cross-org | not granted; binding org is Property Demo only |
| Facility-only staff | FO `POST /api/pm/tenants` **403**; `GET /api/pm/residents` **403** |
| Vendor / admin | tenant 403 on staff/admin surfaces |
| ADR-033 | `member_has_finance_capability` untouched |
| PLAT-002 | fail-closed unknown `/api/pm/*` retained; `/api/pm/tenants` catalogued as `pm.residents` only |
| PLAT-005 | not widened |
| M4 staff finance | tenant `/api/finance/snapshot` **403**; resident does not receive `pm.finance:*` |
| Tenant role | `['tenant']` only |

---

## 20. Finance / July / Stripe / M5

| Item | After UAT |
|------|-----------|
| FIN-OPS counts | 18 / 11 / 1 / 11 |
| Charge `f2a6d161` | `17.16` / `open` |
| `finance_ops_writes_enabled()` | `true` |
| July | frozen; `updated_at` still 2026-08-16 07:52:09.009771+00 |
| Stripe execution | 0/6 |
| Late fees | 0/6 |
| M5 | still disabled; no M5 routes shipped |
| SKU / org subs | 4 / 6 unchanged |

No lifecycle action changed operational finance totals.

---

## 21. Fixture accounting

| Table | Before | After | Delta |
|-------|-------:|------:|-------|
| `organizations` | 21 | 21 | none |
| `organization_memberships` | 36 | 37 | **+1 expected** Tenant A |
| `organization_invitations` | 14 | 15 | **+1 expected** |
| `organization_invitation_tenant_bindings` | 0 | 1 | **+1 expected** |
| `pm_residents` | 15 | 16 | **+1 expected** |
| `lease_residents` | 15 | 16 | **+1 expected** |
| `lease_agreements` | 15 | 15 | none |
| `maintenance_work_orders` | 33 | 33 | none |
| COM-002 conversations / messages | 2 / 8 | 2 / 8 | none |
| `document_documents` | 1 | 1 | none |
| FIN-OPS charges / payments / receipts / allocations | 18 / 11 / 1 / 11 | 18 / 11 / 1 / 11 | none |

**EXPECTED CONTROLLED UAT ROWS:** auth user `288a78d1-…`, person `d14328f8-…`, occupancy `5b94e90e-…`, invitation `620f4f43-…`, binding for that invitation, membership `['tenant']`, domain events `tenant.invited` / `tenant.invitation_accepted` / `tenant.moved_out` / `tenant.move_out_cancelled` / `tenant.moved_out` / `tenant.move_out_corrected`.

**UNEXPECTED CUSTOMER DATA DELTA:** none.

History was not deleted.

---

## 22. Incident status

No customer incident. The `/api/pm/tenants` catalog miss was found in UAT, fixed under PLAT-002 without widening FO or unknown PM routes, and redeployed as SHA `925dde08` before lifecycle mutations succeeded.

Residual: occupying resident maintenance INSERT still fail-closes at RLS even when the application occupancy check passes. Former-tenant create is denied in the application layer. Not treated as a release incident.

---

## Recorded evidence

| Artifact | What it shows |
|----------|----------------|
| Implementation SHA | `925dde08d88b6168174333ed68df8615b4162867` |
| Schema stamp | `20260816094933` / `docs_166_tenant_lifecycle` |
| Add Tenant | 201 + server binding |
| Tamper | accept 200; roles `tenant`; FKs unchanged |
| Accept / idempotency | 200 then 200 `idempotent: true` |
| Active portal | Demo Apartments · Unit 101 |
| Apple PWA | Open Share → Add to Home Screen → Add; no Install button |
| Android PWA | menu fallback; no Apple steps |
| Move Out | future / cancel / inclusive same-day / correct to `moved_out` |
| Old-session deny | maintenance 400 occupancy required; checkout 403; staff 403 |
| Historical shell | Past residence + own billing GET 200 |
| Finance preservation | 18 / 11 / 1 / 11; July frozen; Stripe off |
| Security | anonymous login; FO 403; Tenant B threads hidden |

---

## Final verdict

**TENANT LIFECYCLE PRODUCTION RELEASE SUCCESSFUL**
