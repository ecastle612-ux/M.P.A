# 167 — Tenant Lifecycle Implementation Certification

**Title:** TENANT LIFECYCLE IMPLEMENTATION CERTIFICATION  
**Status:** **READY FOR TENANT LIFECYCLE PRODUCTION MIGRATION CERTIFICATION**  
**Date:** 2026-08-16  
**Program:** Customer-facing tenant lifecycle — in-repo implementation  
**Authority:** [docs/166](../166-tenant-lifecycle-onboarding-portal-move-out/index.md) **Approved** · [docs/135](../135-complete-delegated-operations-invitation-remediation/index.md) · docs/165 PWA sub-design · ADR-012 · ADR-019 · ADR-026 · ADR-032 · ADR-033 · ADR-034  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` (not applied)  
**This package:** In-repo implementation and certification only. **No Production apply. No deploy. No Production tenant, invitation, or move-out. No FIN-OPS money mutation. No July reopen. No Stripe payment execution. No M5. No SKU/pricing change. No native apps. No Web Push.**

Identifier collision: **COM-002** means Tenant Communication Center (ADR-024 / docs/80).

---

## Verdict

**READY FOR TENANT LIFECYCLE PRODUCTION MIGRATION CERTIFICATION**

In-repo implementation matches approved docs/166. Occupancy is the grant. docs/135 invitation transport is reused with a server-owned binding. Move Out is a resident-level occupancy end, not delete, and does not end the lease. Former-tenant history is date-bounded. Optional docs/165 PWA install appears only after Tenant Portal success.

Production schema, invitations, residents, and FIN-OPS money were not changed.

---

## What this package did not do

- Did not apply `20260816120000` to Production
- Did not deploy
- Did not create, invite, accept, or move out a Production resident
- Did not mutate Production lease/resident relationships
- Did not change FIN-OPS money, reopen July, enable Stripe execution, or implement M5
- Did not change SKUs, prices, subscriptions, or the commercial flow
- Did not implement native iOS or Android applications
- Did not implement Web Push
- Did not create a third resident identity domain

---

## 1. Migrations produced

| Stamp | File | Applied to Production |
|-------|------|------------------------|
| `20260816120000` | `supabase/migrations/20260816120000_docs_166_tenant_lifecycle.sql` | **No** |

Contents:

- `lease_residents.pm_resident_id`, `occupancy_status`, `occupy_from`, `occupy_to` + backfill
- `organization_invitation_tenant_bindings`
- Occupancy helpers (`utc_today`, `tenant_occupies_lease`, `tenant_occupied_lease`, `finance_resident_can_select_charge`, `member_is_tenant_only`, document/conversation write helpers)
- RLS tighten for residents, leases, documents, FIN-OPS resident SELECT, COM-002 insert, maintenance resident insert
- `finance_resident_owns_lease` and `is_lease_resident` now mean **current occupancy**, not lease-wide identity

Unused FIN-OPS stamps `20260816070000` / `20260816070100` were not replayed.

---

## 2. Application changes

| Area | Path | Change |
|------|------|--------|
| Occupancy domain | `packages/shared/src/resident/occupancy.ts` | UTC date access + historical charge visibility |
| Add Tenant / Move Out | `apps/web/src/lib/tenant-lifecycle/tenant-lifecycle-service.ts` | Create occupancy + binding; move out / cancel / correct; person recompute |
| Invitation accept | `apps/web/src/lib/team/invitation-service.ts` | Tenant-only invites require binding; body cannot change FKs |
| APIs | `/api/pm/tenants`, `/api/pm/tenants/occupancies/[id]/move-out`, `cancel-move-out`, `correct-move-out` | Manager mutations |
| Portal | tenant layout + home + documents | Occupancy modes: Active / Future / Former |
| COM-002 | `conversation-authz.ts`, messages POST | Write requires occupying; read allows historical own threads |
| Maintenance | `maintenance-service.ts` | Create requires occupying grant |
| FIN-OPS | checkout + resident billing | Checkout occupying-only; billing includes historical accounts, skips future |
| Manager UX | Add Tenant form, Move Out panel | Customer verbs only |
| PWA | `tenant-pwa-install-card.tsx`, `install-experience.ts` | Optional Apple / Android / desktop after portal success |

---

## 3. RLS changes

| Policy / helper | Effect |
|-----------------|--------|
| `pm_residents_select_member` | Tenant-only members see own `user_id` row, not the org directory |
| `lease_agreements_select_member` | Tenant sees occupy/occupied leases only |
| `lease_residents_select` | Tenant sees own participation rows |
| `document_documents_select_member` | Tenant sees own lease/resident entities; former bounded by `occupy_to` |
| `financial_charges_select_resident` | Occupying = lease household; former = charge date in occupancy window |
| Payments / receipts / allocations / ledger | Same occupancy-dated helper |
| Charge schedules | Occupying only |
| `comms_thread_messages_insert` | Tenant write requires `tenant_can_write_conversation` (occupying) |
| `maintenance_work_orders_insert_resident` | Occupying grant + matching unit/property |
| Staff FIN-OPS / ADR-033 | Unchanged `member_has_finance_capability` |
| PLAT-002 `can_select_work_order` | Unchanged fail-closed staff/technician/vendor/own-WO path |
| PLAT-005 | Not widened |

---

## 4. Authorization helpers

| Helper | Meaning |
|--------|---------|
| `utc_today()` | `(timezone('utc', now()))::date` |
| `tenant_occupancy_is_current` | Status occupying/scheduled and today in `[occupy_from, occupy_to]` inclusive |
| `tenant_occupies_lease` | Current occupancy for `auth.uid()` |
| `tenant_occupied_lease` | Historical occupancy (`occupy_to < utc_today()`) |
| `finance_resident_can_select_charge` | Current lease **or** historical date-bounded |
| `finance_resident_owns_lease` | Current occupancy only (no longer email-wide lease dump) |
| `member_is_tenant_only` | Active membership roles are exactly `{tenant}` |
| `tenant_can_select_document` | Own lease/resident entity + historical created-at bound |
| `tenant_can_write_conversation` | Occupying + own `tenant_account_id` |
| App `deriveOccupancyAccess` / `resolveTenantPortalMode` | Same date semantics for UI/API |

Authentication and organization membership are not current-unit grants.

---

## 5. Invitation acceptance trust boundary

Unchanged docs/135 Option B:

- `POST /api/invitations/[token]/accept` requires a session
- Request body is ignored for organization, property, unit, lease, resident, role, and scope
- Tenant invitations must be role `tenant` only
- Occupancy FKs come from `organization_invitation_tenant_bindings`
- Missing binding → fail closed (409)
- Email mismatch → 403
- Ended occupancy / ended lease / conflicting `user_id` → 409
- Existing auth user is attached; no duplicate user create on this path
- Idempotent when already linked to the same user

Staff Complete invitations (Sarah/Mike/Erick class) are unchanged.

---

## 6. Add Tenant behavior

Manager enters first name, last name, email, and lease. Property/unit/start inherit from the lease.

Server:

1. Reuses `pm_residents` on org+email or creates one person
2. Inserts `lease_residents` occupancy
3. Creates docs/135 invitation with roles `['tenant']`
4. Persists binding FKs
5. Emits `tenant.invited`

Does not create a password, pick `operating_scope`, or accept browser UUIDs as the grant.

---

## 7. Move Out behavior

Resident-level occupancy update:

- Sets `occupy_to`
- `occupancy_status=moved_out` only when the date is already before UTC today; future dates stay occupying until after that date
- Does **not** delete rows, charges, payments, messages, documents, or auth
- Does **not** end the lease
- Does **not** move out household members
- Recomputes person `status` / `portal_status` from remaining occupancies
- Future move-out can be cancelled
- Effective move-out is corrected with `tenant.move_out_corrected`, not delete

---

## 8. Former-tenant historical authorization

| Surface | Former tenant |
|---------|----------------|
| Portal shell | Former mode; no current-unit tools as primary actions |
| FIN-OPS charges/payments/receipts | Own occupancy window only |
| Checkout / pay | Denied (occupying required); Stripe execution remains off |
| Maintenance create | Denied |
| Maintenance own historical WOs | SELECT still own `resident_id` / requester (PLAT-002) |
| COM-002 read | Own `tenant_account_id` + occupied lease |
| COM-002 write | Denied |
| Documents | Own lease/resident entities created on or before `occupy_to` |
| Next occupant activity | Denied by occupancy/person bounds |

If helpers are absent (pre-migration), fail closed rather than org-member dump.

---

## 9. Old-session denial

Cookie `mpa_session` may remain. Every API/RLS path re-derives occupancy.

| After immediate/past `occupy_to` | Result |
|----------------------------------|--------|
| Maintenance create | App 403 + insert RLS fail |
| COM-002 insert | App 403 + insert RLS fail |
| Checkout resident branch | No occupying link → staff capability path → tenant denied |
| Current-unit charges after `occupy_to` | Resident SELECT empty |
| Own historical charges | Allowed when dated inside the window |
| Portal chrome | Former shell, not staff |

---

## 10. Multi-resident behavior

Covered by automated test: Ada move-out leaves Bea occupying; lease stays `active`; both `lease_residents` rows remain.

---

## 11. FIN-OPS preservation

Move Out does not write `financial_*` money columns. `financial_status` is unchanged. July is untouched. Stripe execution flag is unread except to keep checkout disabled. M5 routes were not modified.

---

## 12. Apple PWA behavior

After successful Tenant Portal (active occupancy):

- Surface `apple` when iPhone/iPad (or iPad desktop-class mobile) and not standalone
- Copy: Share → Add to Home Screen → Add
- `beforeinstallprompt` is not used for Apple
- Already standalone → no card
- Continue in browser dismisses the card (`localStorage`)
- Install is never an auth gate

Manifest `start_url` remains `/dashboard` (ADR-032).

---

## 13. Android PWA behavior

- Surface `android` on Android UA
- If `beforeinstallprompt` fired: **Install M.P.A.** then browser UI
- If unavailable: browser-menu guidance
- Apple copy is not shown
- Continue in browser remains available

No Web Push. No native application.

---

## 14. Tests and build results

| Suite | Result |
|-------|--------|
| `@mpa/shared` vitest | **331 passed** |
| Occupancy unit tests | Passed (inclusive UTC end date; former vs later charges) |
| Tenant lifecycle service tests | **6 passed** (binding accept, fail-closed missing binding, household independence, cancel/correct, returning person reuse, former mode) |
| Invitation docs/135 tests | Passed (staff path unchanged) |
| PWA surface tests | Passed (standalone / Apple / Android) |
| COM-002 + tenant conversation + finance checkout authz | Passed |
| `@mpa/web` typecheck | **Passed** |
| `@mpa/web` full vitest | **463 passed**; 1 failed: `checkout.route.test.ts` commerce quote expects 4xx/5xx and received 200 — **pre-existing SaaS checkout env**, not this package |

No Production SQL was executed.

---

## 15. Remaining Production / UAT gaps

1. Migration `20260816120000` is **not** applied. Occupancy columns and new RLS do not exist in Production yet.
2. No Production Add Tenant / accept / Move Out UAT has been run (forbidden this turn).
3. docs/165 remains a separate Draft record on its design branch; this package implemented the approved onboarding hook only.
4. Compatible-app-then-migration ordering in docs/166 §29 is still required before Production apply.
5. Live RLS proof against Production personas (Facility-only Mike, next occupant charges) waits for migration certification + UAT.
6. Unrelated commerce checkout unit test remains noisy in this environment.

---

## Security matrix (in-repo proof)

| Requirement | Proof |
|-------------|--------|
| Authentication ≠ occupancy | Portal membership can exist; APIs use occupancy helpers |
| Membership alone ≠ current unit | Tenant-only excluded from org-wide SELECT; occupying required for writes |
| Old session loses current access | Date helpers + occupying checkout/maintenance/COM-002 write |
| Tenant A ↛ Tenant B private data | Own `user_id` / `tenant_account_id` / occupancy row |
| No other unit | Maintenance insert ties occupancy lease property/unit |
| No other org | All queries org-scoped + binding org check |
| Former ↛ future occupant activity | Charge date `> occupy_to` hidden; new conversations/WOs use other person/lease |
| Former historical only | Date-bounded FIN-OPS + document helper |
| Facility / ADR-033 / staff FIN-OPS | Staff policies unchanged |
| PLAT-002 fail closed | `can_select_work_order` not opened to org-member tenants |
| PLAT-005 not widened | No new privileged RPC; accept still service_role after session checks |
| Browser cannot override binding | Accept ignores body; binding FKs win |

---

## Approval / next gate

This certification does **not** authorize Production apply or deploy.

**Status: READY FOR TENANT LIFECYCLE PRODUCTION MIGRATION CERTIFICATION.**
