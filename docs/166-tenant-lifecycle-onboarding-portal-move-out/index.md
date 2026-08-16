# 166 — Tenant Lifecycle: Onboarding, Portal Access, and Move-Out

**Title:** TENANT LIFECYCLE — ONBOARDING + PORTAL ACCESS + MOVE-OUT / OFFBOARDING  
**Status:** **Approved** — 2026-08-16 Owner `APPROVE docs/166`  
**Date:** 2026-08-16  
**Program:** Customer-facing tenant lifecycle (Property Manager → Tenant Portal → Move Out)  
**Authority:** [Implementation Gate](../00-governance/implementation-gate.md) · [Product Constitution](../00-governance/product-constitution.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md) · [ADR-019](../18-decision-log/adr-019-product-constitution.md) · [ADR-026](../18-decision-log/adr-026-authorization-hardening-pipeline.md) · [ADR-032](../18-decision-log/adr-032-report-shape-and-post-auth-home.md) · [ADR-033](../18-decision-log/adr-033-member-operating-scope.md) · [ADR-034](../18-decision-log/adr-034-fin-ops-production-lineage-cutover.md) · [docs/135](../135-complete-delegated-operations-invitation-remediation/index.md) · docs/165 Phase 4 PWA Install + Device Experience (binding PWA sub-design; do not implement in isolation) · COM-002 Tenant Communication Center ([docs/80](../80-com-002-tenant-communication-center/index.md) / ADR-024) · FIN-OPS M4 live in Production (this-turn read-only audit; [docs/162](../162-fin-ops-production-reconciliation-m4-implementation-certification/index.md))  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo`  
**This package:** Approved design. In-repo implementation is authorized. **No Production apply. No deploy. No Production invitation, move-out, or FIN-OPS mutation. No July reopen. No Stripe payment execution. No M5. No native apps. No Web Push.**

Identifier collision: **COM-002** in this record means **Tenant Communication Center** (ADR-024 / docs/80), not Self-Service Commercial (ADR-018).

---

## Verdict

**Approved.** Owner authorized the canonical tenant lifecycle, occupancy-based authorization, docs/135 invitation reuse with `organization_invitation_tenant_bindings`, Add Tenant, resident-level Move Out, former-tenant historical shell, UTC date semantics, multi-resident independence, returning-tenant reuse, unit transfer as A-end + B-start, and docs/165 optional PWA after onboarding.

Implementation is in-repo only. Production apply and deploy remain separate Owner steps.

A tenant lifecycle already exists in Production, but it is **lease-activation provisioning**, not a manager **Add Tenant → invitation → accept → occupancy → Move Out** product. The identity graph is usable. Occupancy, invitation binding, and authorization are not.

The smallest safe design:

1. Keep **`pm_residents`** as the only person/resident identity (one row per organization + email).
2. Keep **`lease_residents`** as lease participation and FIN-OPS household — **do not create a third resident domain**.
3. Add occupancy fields on `lease_residents` so authorization can distinguish **current occupancy** from **own historical participation**.
4. Reuse docs/135 invitation **transport + trusted accept**, and persist tenant occupancy FKs in a binding row the browser cannot change.
5. Treat **Move Out** as a resident-level occupancy end. It is **not delete**. It does **not** end the lease unless the manager separately ends the lease.
6. Show docs/165 PWA install only **after** the tenant is authenticated in Tenant Portal.

Authentication may outlive occupancy. An old `mpa_session` cookie must not preserve unit access.

No important fork is left as an insecure approximation. Recommended defaults are stated where Owner confirmation is useful; they are not blockers.

**Implement only the approved scope. Material changes restart Design → Document → Approve.**

---

## What this package does not do

- Does not implement application, UI, schema, or RLS
- Does not apply SQL or create a migration
- Does not create, invite, accept, or move out any Production resident
- Does not modify FIN-OPS money, reopen July, enable Stripe execution, or implement M5
- Does not change SKUs, prices, subscriptions, or the binding commercial flow
- Does not implement docs/165 in isolation
- Does not ship native iOS or Android applications
- Does not implement Web Push
- Does not create a third resident identity table
- Does not delete historical tenant, lease, finance, maintenance, communication, or audit records to remove access

---

## Binding product rules

1. Customer-facing verbs are **Add Tenant** and **Move Out**. Managers never see memberships, RBAC, RLS, `operating_scope`, UUIDs, or FIN-OPS internals.
2. Auth account ≠ current property access. Authorization derives from a **currently occupying** `lease_residents` row (plus the linked `pm_residents` person).
3. The browser must not choose organization, property, unit, lease, resident, or role at accept.
4. Move Out is not delete. History stays.
5. One resident leaving must not terminate the household lease.
6. Installation is optional and happens after onboarding (docs/165).
7. Stripe payment execution remains **off**. M5 remains **disabled**. July remains **frozen**.

---

## 1. Executive summary

Property managers need a simple path:

```
Property → Unit → Lease → Residents → Add Tenant
  → invitation email
  → tenant opens M.P.A. in the browser
  → create account or sign in
  → trusted server links auth to the persisted resident / lease / unit / property
  → Tenant Portal
  → optional PWA install (docs/165)
  → later: Move Out
  → lose future active-property access
  → keep own historical records
```

Production already has the tables for person, lease, household, membership, invitation, portal, FIN-OPS, COM-002, and maintenance. It does **not** have:

- a tenant invitation that binds occupancy server-side
- occupancy / move-out dates on `lease_residents`
- a manager Move Out action
- authorization that re-derives from occupancy on every request
- RLS that can safely separate **own historical record** from **current unit access**

Those are the gaps this design closes. The identity model is not replaced.

---

## 2. Production schema reality

Read-only audit of `mpa-prod` / `vahnmcrpnuggxkivynvo` on 2026-08-16. No writes.

### 2.1 Live counts (snapshot)

| Source | Status | Detail | Count |
|--------|--------|--------|------:|
| `pm_residents` | `active` | `portal_status=active` | 1 |
| `pm_residents` | `active` | `portal_status=pending_activation` | 14 |
| `lease_agreements` | `active` | | 14 |
| `lease_agreements` | `ended` | | 1 |
| `lease_residents` | `financial_status=current` | `user_id` set | 1 |
| `lease_residents` | `financial_status=current` | `user_id` null | 14 |
| `organization_invitations` | `pending` | roles include `tenant` | 1 |
| `organization_invitations` | `pending` | no tenant role | 3 |
| `organization_invitations` | `accepted` | no tenant role | 6 |
| `organization_invitations` | `revoked` | includes 1 with tenant role | 2 |
| `organization_invitations` | `expired` | no tenant role | 2 |

There is **no** Production `former` / `archived` resident and **no** occupancy-ended `lease_residents` row. Move Out as a product action has not been exercised.

FIN-OPS binding (unchanged by this package):

| Item | Live |
|------|------|
| Writes | `finance_ops_writes_enabled() = true` |
| July | frozen / read-only |
| Stripe payment execution | **false** |
| M5 | disabled |
| Point of no return | **crossed** |

### 2.2 `pm_residents` — person identity

Authoritative **person** in an organization.

| Column | Reality |
|--------|---------|
| `first_name`, `last_name`, `display_name`, `email`, `phone` | Person fields |
| `property_id`, `unit_id` | **Current** pointers (required FKs) |
| `lease_id` | Nullable **current** lease pointer |
| `user_id` | Nullable `auth.users` link; `ON DELETE SET NULL` |
| `status` | `prospect \| applicant \| screening_pending \| approved \| pending_lease \| pending_move_in \| active \| former \| archived` |
| `portal_status` | `pending_activation \| active \| disabled` |
| Unique | **`(organization_id, email)`** |

The unique email constraint is binding: a returning tenant in the same organization **reuses** this row. A second person row for the same email is not allowed. Occupancy cannot live only on this row.

### 2.3 `lease_agreements`

| Column | Reality |
|--------|---------|
| `property_id`, `unit_id` | Lease location |
| `resident_id` | FK to `pm_residents` — **primary** resident |
| `status` | `draft \| pending_signature \| signed \| active \| ended` |
| `start_date`, `end_date` | `date` (not timestamptz). Default start is UTC calendar date |
| `activated_at`, `signed_at` | timestamptz |
| Rent | `rent_amount`, `currency`, `rent_day_of_month` |

No dedicated move-out timestamp. Ending a lease is `status=ended` plus `end_date`. That is **lease-level**, not resident-level.

### 2.4 `lease_residents` — household / FIN-OPS participation

| Column | Reality |
|--------|---------|
| `lease_id`, `organization_id` | Participation |
| `user_id` | Nullable auth link |
| `display_name`, `email` | Household identity copy |
| `is_primary` | Boolean |
| `financial_status` | `current \| delinquent \| prepaid \| closed` |
| Unique | `(lease_id, email)` |
| Occupancy / move-in / move-out / status | **absent** |
| `pm_resident_id` | **absent** — join is email / later `user_id` |

This is the second resident-shaped table. It is participation, not a third person domain. It cannot currently express “Tenant A left; Tenant B stays.”

### 2.5 Property / unit

`property_properties` and `property_units` are org-scoped. Unit status: `available | occupied | offline`. Lease activation sets the unit `occupied`. There is no resident-level unit release.

### 2.6 Auth, membership, invitation

| Object | Reality |
|--------|---------|
| `auth.users` | Account. May exist with no occupancy. |
| `organization_memberships` | Unique `(organization_id, user_id)`. Status `active \| inactive`. Roles include `tenant`. One row cannot represent “former on lease A, active on lease B.” |
| `organization_invitations` | Token, email, roles, status `pending \| accepted \| revoked \| expired`, 7-day expiry, `operating_scope`, `property_ids`. **No** `resident_id` / `lease_id` / `unit_id`. |

Roles may include `tenant`. That does **not** persist occupancy. Accept already ignores the request body for role and scope (docs/135).

### 2.7 FIN-OPS resident SELECT (live)

`finance_resident_owns_lease(org, lease)` is **lease-scoped**:

```
lease exists in org
AND (
  lease_residents.user_id = auth.uid()
  OR pm_residents.user_id = auth.uid()
     AND lower(email) matches a lease_residents email on that lease
)
```

No occupancy date. No `portal_status` check. If `user_id` remains after move-out (required for historical money), the former tenant can SELECT **all** charges/payments/receipts on that lease — including later household charges. If the row is deleted (forbidden), they lose history.

`financial_charges` already has `lease_id`, `resident_id`, `due_at`, `period_start`, `period_end`, `created_at`. Those dates are enough to bound historical SELECT **after** occupancy exists.

### 2.8 COM-002 (live)

`can_access_tenant_conversation(org, lease, tenant_account_id)`:

```
is_pm_comms_staff(org)
OR (
  is_lease_resident(lease)   -- lease_residents.user_id = auth.uid()
  AND pm_residents.id = tenant_account_id
  AND pm_residents.lease_id = that lease
  AND pm_residents.user_id = auth.uid()
)
```

`is_lease_resident` is also occupancy-blind. Application actor `requireTenantConversationActor` additionally requires `pm_residents.lease_id` and a `lease_residents.user_id` match. Clearing the current lease pointer would drop conversation access even for historical threads.

docs/80 left “former tenant history” as an open product question. This record answers it.

### 2.9 Maintenance (live)

`maintenance_work_orders` has `resident_id`, `unit_id`, `property_id`, `requested_by_user_id`. No `lease_id`.

- Tenant INSERT requires `pm_residents.portal_status = 'active'`.
- Tenant UPDATE uses `is_work_order_resident` (`requested_by_user_id` or `pm_residents.user_id`).
- SELECT also allows **`is_org_member(organization_id)`**. A tenant with an active membership can read **all org work orders**. That is a current-unit leak and must be closed for tenants.

### 2.10 Documents (live)

`document_documents_select_member` is `is_org_member`. Same leak: a tenant membership can read org documents. There is no tenant-visible flag. Historical-only document access **cannot** be expressed safely on the current policies. It is designable by scoping tenant SELECT to the tenant’s own lease/resident entities — not by hiding nav.

### 2.11 Events / audit (live)

Reusable:

- `event_domain_events` (already used for `resident.created`, `resident.portal_access_provisioned`, lease events)
- `audit_events`
- invitation / operating-scope events from docs/135

No new audit product. Add lifecycle event types.

### 2.12 What does not exist

- Move-out date on a resident participation row
- Manager Move Out API
- Tenant invitation occupancy binding
- Occupancy-dated FIN-OPS / COM-002 / document helpers
- Org timezone column (lease dates are UTC calendar `date`)

---

## 3. Current application behavior

Inspected on `origin/main` (`867c579b` at audit time).

### 3.1 Add Tenant today

`resident-service.ts` creates `pm_residents` with first name, last name, email, property, unit. Status starts `pending_lease` / `portal_status=pending_activation`. Duplicate org+email is rejected.

The manager does **not** set a password, create an auth user, or pick `operating_scope`. That part is already simple.

The manager **does** attach property/unit at person-create time. Lease association happens later through leasing, not a first-class “Add Tenant to this lease” action.

### 3.2 Portal access today

`activateSignedLease` in `lease-service.ts`:

1. Sets unit `occupied`.
2. Sets primary `pm_residents` to `status=active`, `portal_status=active`, `lease_id=lease`.
3. Ensures a `lease_residents` row.
4. Calls `provisionResidentPortalAccess`.

`portal-access-service.ts` (service_role):

1. Finds or **creates** an auth user by email.
2. Upserts `organization_memberships` with role `tenant`.
3. Sets `pm_residents.user_id`.
4. Backfills `lease_residents.user_id` where email matches and `user_id` is null.
5. Emits `resident.portal_access_provisioned`.
6. Builds a magic link to `resolvePostAuthHome` → `/portal/tenant`.

This is **activation provisioning**, not invitation accept. The tenant does not redeem a token that already stores lease/resident. A manager-facing magic link is the handoff.

### 3.3 docs/135 invitations today

`POST /api/invitations/[token]/accept` uses trusted service_role. Body is ignored. Email, token, status, and expiry are validated. Role and `operating_scope` come from the invitation row.

`invitation-service.ts` has **no tenant occupancy branch**. A `tenant` role invitation only creates/updates membership. It cannot bind lease/resident/unit.

Production already has one pending invitation whose roles include `tenant`. That row cannot be a safe occupancy grant.

### 3.4 Tenant Portal today

| Surface | Gate |
|---------|------|
| `/portal/tenant` layout | Signed in + `availableRoles` includes `tenant` |
| Home | Loads `pm_residents` by `user_id` or email; shows current property/unit/lease pointers |
| Billing | `lease_residents.user_id` + FIN-OPS resident SELECT |
| Maintenance | `portal_status=active` to create |
| Messages | `requireTenantConversationActor` (current `lease_id` + `lease_residents.user_id`) |
| Documents | Org-member document SELECT (too broad) |

`resolvePostAuthHome`: portal roles skip Guided Setup; tenant → `/portal/tenant`.

Middleware protects `/portal`. Session cookie `mpa_session` is SameSite=Lax. The layout does **not** re-check occupancy. A former tenant who still has role `tenant` still enters the portal chrome.

### 3.5 Move Out today

`move_out` in the product is a **document/signing channel** and a leasing pipeline column of people already `former` / `archived`. There is no API that:

- records an effective date
- ends one resident’s occupancy
- leaves household members active
- disables portal for that resident only
- preserves FIN-OPS
- is auditable

`application-service.ts` already treats `former` / `archived` as reusable for a new application when there is no conflicting active lease. That supports returning tenants **if** occupancy is not stored only on the person row.

Membership is **not** inactivated when a resident becomes former.

### 3.6 Renewal today

The leasing workspace lists leases whose `end_date` is approaching. There is no successor-lease creator and no “renew = new auth account” path. Renewal in current architecture is **extend `end_date` on the same lease** (or later create a new lease by the existing lease-create path). Identity stays on `pm_residents.user_id`.

---

## 4. Existing tenant identity model

Canonical chain — **do not add a third person domain**:

```
auth.users
  → organization_memberships (role tenant; org-scoped; may outlive occupancy)
  → pm_residents.user_id     (person; UNIQUE org+email; current property/unit/lease pointers)
  → lease_agreements.resident_id  (primary person on the lease)
  → lease_residents          (household + FIN-OPS; email / user_id; is_primary)
  → lease_agreements
  → property_units
  → property_properties
  → organizations
```

| Concern | Authoritative record |
|---------|----------------------|
| Person / resident identity | `pm_residents` |
| Auth account | `auth.users` via `pm_residents.user_id` |
| Lease participation / household / FIN-OPS | `lease_residents` |
| Occupancy / move-in / move-out / portal authorization | **`lease_residents` occupancy fields (to add)** + lease dates |
| Current “where do they live” display | `pm_residents.property_id / unit_id / lease_id` (derived cache, not the grant) |
| Staff vs tenant product | Membership role + ADR-033 scope + occupancy |

`lease_residents` is not a competing person. After this package it must gain a `pm_resident_id` FK so joins stop depending on email alone.

---

## 5. Reusable components

| Component | Reuse |
|-----------|--------|
| docs/135 token, status, expiry, email match, trusted accept | **Yes** — transport and accept trust boundary |
| `provisionResidentPortalAccess` | **Yes** — after accept, link auth + membership + `user_id` (do not invent a second provisioner) |
| `pm_residents.status` / `portal_status` | **Yes** — do not add new person statuses |
| `lease_agreements.status` / dates | **Yes** — lease-level only |
| `event_domain_events` + `audit_events` | **Yes** |
| `resolvePostAuthHome` / `/portal/tenant` | **Yes** |
| Tenant Home, billing, maintenance, COM-002, documents routes | **Yes** — tighten authz, do not rebuild |
| docs/165 PWA | **Yes** — after portal success only |
| FIN-OPS M3/M4 resident SELECT helper | **Extend** — do not replace the write domain |
| Canopy | Approved language when UI is later implemented |

---

## 6. Gaps

| # | Gap | Risk if ignored |
|---|-----|-----------------|
| G1 | `organization_invitations` cannot persist resident/lease/unit | Browser or operator must supply occupancy — forbidden |
| G2 | `lease_residents` has no occupancy | Cannot Move Out one household member |
| G3 | `pm_residents` UNIQUE(org, email) + current unit pointers | Returning tenant / transfer would overwrite or reactivate the wrong unit |
| G4 | Portal layout keys on membership role `tenant` | Old session keeps portal chrome after Move Out |
| G5 | `finance_resident_owns_lease` is lease-wide | Former tenant sees later occupants’ charges **or** loses history if unlinked |
| G6 | COM-002 requires current `pm_residents.lease_id` | Either ongoing access after move-out or total history loss |
| G7 | Maintenance and documents SELECT via `is_org_member` | Tenant membership reads other units / staff documents |
| G8 | No manager Move Out mutation | Offboarding is informal status edits or silence |
| G9 | Magic-link provision at lease activation | Not a redeemable, occupancy-bound invitation |
| G10 | No occupancy-dated helpers | UI hiding would be the only “security” |

G5–G7 mean: **current RLS cannot safely distinguish own historical record from current unit access.** This design adds the smallest occupancy fields and tightens helpers. It does not ship an insecure UI-only approximation.

---

## 7. Canonical tenant lifecycle

### 7.1 Records

| Record | Role after this design |
|--------|------------------------|
| `pm_residents` | Person. Reused on return. `status` / `portal_status` / current pointers are **derived** from occupancy. |
| `lease_residents` | Participation + **occupancy grant**. Never deleted on Move Out. |
| `lease_agreements` | Contract. Ended only by an explicit End Lease action. |
| `organization_memberships` | Sign-in to the org. May remain `active` with role `tenant` after Move Out so the person can see **their** history. Not a grant. |
| `organization_invitations` + tenant binding | Pending grant. Server-owned FKs. |
| `auth.users` | Login. Survives Move Out. |

### 7.2 Derived customer Access column

Managers see **Access**, not internals:

| Access | Meaning |
|--------|---------|
| Invited | Binding invitation `pending`; person `pending_activation` |
| Future | Occupancy `scheduled` and `occupy_from` after today |
| Active | Occupancy `occupying` and today in `[occupy_from, occupy_to]` (`occupy_to` null = open) |
| Moved out | Occupancy `moved_out` and today after `occupy_to` |
| Invite expired / revoked | Invitation status; no occupancy grant |

### 7.3 Person status mapping (existing enums only)

| Occupancy situation | `pm_residents.status` | `portal_status` |
|---------------------|----------------------|-----------------|
| Created, not yet invited/leased | `pending_lease` | `pending_activation` |
| Invited, start in the future | `pending_move_in` | `pending_activation` until accept; then `active` account but Future access |
| Occupying | `active` | `active` |
| No remaining occupying/scheduled occupancy in the org | `former` | `disabled` |
| Soft-hidden person | `archived` | `disabled` |

If the same person still occupies **another** lease in the org, they stay `active` / `active`. Unique email makes that the only legal person row.

---

## 8. State machine

Do not invent new `pm_residents.status` values. New states live on **invitation** (already exists) and **occupancy** (smallest add).

```
                  Add Tenant
                      │
                      ▼
              INVITED (invitation pending
              + person pending_activation)
                 │         │
        accept   │         ├─ expire → INVITE_EXPIRED
                 │         └─ revoke → INVITE_REVOKED
                 ▼
        occupancy scheduled or occupying
                 │
     occupy_from in future ──► FUTURE
                 │
     occupy_from ≤ today ───► ACTIVE / OCCUPYING
                 │
            Move Out (effective date)
                 │
     today < occupy_to ───► still ACTIVE through that date
     today > occupy_to ───► MOVED_OUT
                 │
        later: new lease / transfer / return
                 └── new occupancy row; old row stays MOVED_OUT
```

Idempotent transitions:

- Re-accept of an already-accepted invitation for the same user → success, no second person.
- Move Out on an already-moved-out occupancy with the same date → no-op + audit note.
- Invite of an email that already occupies the same lease → reject (already active), do not duplicate.

---

## 9. Add Tenant workflow

### 9.1 Manager UX

```
Property → Unit → Lease → Residents → Add Tenant
```

Fields:

| Field | Source |
|-------|--------|
| First name | Manager |
| Last name | Manager |
| Email | Manager |
| Lease | Current lease context (not a UUID picker) |
| Property / unit | Inherited from the lease |
| Move-in / start | Inherited from `lease_agreements.start_date` unless the manager is adding a mid-lease occupant (optional date, default = lease start or today, whichever is later) |

The manager must **not**:

- create a password
- create an auth user
- assign roles or `operating_scope`
- copy UUIDs
- create a second `pm_residents` row for an existing org email

If the email already exists on `pm_residents` in the org:

- If they already occupy this lease → error: already on this lease.
- If they are former / not occupying → **reuse the person**, create a new `lease_residents` occupancy, send invitation. Do not reactivate old occupancy.

### 9.2 Server writes (Add Tenant)

1. Upsert `pm_residents` (create or reuse by org+email).
2. Insert `lease_residents` for that lease (`is_primary` false unless this is the lease’s first/primary resident). Set occupancy `scheduled` or `occupying` from dates. Set `pm_resident_id`.
3. Create `organization_invitations` with roles `['tenant']`, `operating_scope` null, `property_ids` = `[lease.property_id]` for display only.
4. Insert **tenant binding** with organization, property, unit, lease, resident, lease_resident ids.
5. Send invitation email (existing delivery_status transport).
6. Emit `tenant.invited`.

Do not provision auth at this step. Provisioning happens at accept (or remains available as a staff recovery path using the same linker).

### 9.3 Invitation infrastructure choice

**Choice: B — reuse docs/135 and extend it with a tenant binding.**

| Option | Decision |
|--------|----------|
| A. Reuse as-is | **Rejected.** Token cannot persist occupancy. A `tenant` role invitation is only a membership grant. |
| B. Extend with tenant context | **Chosen.** Keep token, status, expiry, email, trusted service_role accept. Persist occupancy in `organization_invitation_tenant_bindings` (1:1). |
| C. Separate tenant invitation system | **Rejected.** Duplicates token/expiry/accept/delivery. Higher drift risk. |

Why a binding table instead of nullable FKs on `organization_invitations`: staff invitations stay unchanged; tenant FKs are required when a binding row exists; docs/135 accept path gains one branch, not a second product.

Staff Complete invitations (Sarah/Mike/Erick) are untouched.

---

## 10. Invitation acceptance workflow

Browser-first. PWA not required.

```
Email link → /invitations/[token] in the browser
  → validate token (pending, not expired, binding intact)
  → if auth user exists for email: Sign in
  → else: Create account
  → POST /api/invitations/[token]/accept
  → trusted service_role mutation
  → Tenant Portal
  → optional docs/165 install
```

### 10.1 Accept trust boundary

Same as docs/135 Option B:

- Session required.
- Request body ignored for organization, property, unit, lease, resident, role, scope.
- `service_role` after validation.
- No invitee INSERT RLS bypass.
- No new anon SECURITY DEFINER RPC.

### 10.2 Validations (all required)

| Check | Failure |
|-------|---------|
| Token exists | 404 |
| Status `pending` (or already accepted by this user → idempotent success) | 409 |
| `expires_at` > now | 410 expired |
| Session email matches invitation email (case-insensitive) | 403 |
| Binding present for tenant invitations | 500/409 — invitation unusable |
| Binding org = invitation org | 409 |
| `pm_residents` still in that org; email still matches | 409 |
| `lease_residents` still on that lease; `pm_resident_id` matches | 409 |
| Lease still `active` or `signed` (not `ended`) | 409 |
| Occupancy not already `moved_out` | 409 |
| No conflicting `user_id` on the person or participation (other auth user) | 409 |
| Roles are exactly tenant for this path (no staff role upgrade via tenant token) | 403 |

### 10.3 Accept mutation (idempotent)

1. Link `pm_residents.user_id` if null; reject if set to another user.
2. Link `lease_residents.user_id` if null; same conflict rule.
3. Upsert membership role `tenant`, status `active`, `operating_scope` null.
4. Refresh current pointers on `pm_residents` from the **occupying or scheduled** occupancy (property/unit/lease).
5. Set `portal_status=active`. Set person `status` to `pending_move_in` or `active` from dates.
6. Mark invitation `accepted` / `accepted_by` / `accepted_at`.
7. Emit `tenant.invitation_accepted`.
8. Return `homeHref=/portal/tenant`.

If the email already had an M.P.A. account, **do not create a second auth user**. Sign-in then accept attaches the existing identity.

If the same user retries accept: return success with the same home. No duplicate occupancy.

---

## 11. Tenant Portal authorization

### 11.1 Grant

Every tenant API and RLS path must call a helper equivalent to:

```
tenant_occupancy_grant(auth.uid(), organization_id)
  = lease_residents where user_id = auth.uid()
    and occupancy_status in ('occupying','scheduled')
    and occupy_from <= utc_today()   -- scheduled future: grant is "future", not current unit
    and (occupy_to is null or occupy_to >= utc_today())
```

**Current unit access** requires `occupancy_status = occupying` and the date window.  
**Future** may sign in and see “You move in on {date}” only.  
**Moved out** may sign in and see **historical** surfaces listed in §15 — not current unit activity.

The portal layout must not treat `availableRoles.includes('tenant')` as current-unit authorization. Membership gets them into a resident shell; occupancy decides Active vs Former vs Future.

### 11.2 Active tenant surfaces (already in product)

| Surface | Active occupant |
|---------|-----------------|
| Tenant Home | Current property / unit / lease from occupying grant |
| Lease information | Own occupying lease |
| Maintenance | Create/update own requests for occupying unit |
| COM-002 | Own conversations for occupying lease / `tenant_account_id` |
| Billing / charges / payments / receipts | FIN-OPS rows on occupying lease, bounded by occupancy |
| Tenant-accessible documents | Docs whose entity is that lease or that `pm_residents` id |

### 11.3 Must never gain

- PM staff, Facility Operations, staff reports, staff FIN-OPS
- Vendor management, organization administration
- Another tenant’s private information
- Another unit’s activity
- Another organization’s information
- Generic “authenticated user → tenant data”

### 11.4 Proof from the occupancy grant

| Surface | Current proof | Required proof |
|---------|---------------|----------------|
| Portal chrome | membership role `tenant` | role + occupancy (or former/future mode) |
| FIN-OPS | `finance_resident_owns_lease` | occupancy-dated SELECT (§20, §26) |
| COM-002 | current `pm_residents.lease_id` + `is_lease_resident` | occupying lease **or** historical own thread (§21) |
| Maintenance create | `portal_status=active` | occupying grant (portal_status remains derived) |
| Maintenance SELECT | `is_org_member` **or** own WO | **own** `resident_id` / requester only — remove tenant from org-wide SELECT |
| Documents | `is_org_member` | tenant SELECT only own lease/resident entities |
| Lease SELECT | `is_org_member` | tenant SELECT only leases they occupy or occupied |

---

## 12. docs/165 PWA integration

docs/165 remains the binding PWA sub-design. **Do not implement it in isolation in the lifecycle implementation slices.** Hook it to successful onboarding:

```
Accept invitation
  → authenticated Tenant Portal
  → optional install experience
```

| Rule | Binding |
|------|---------|
| Install never required | Decline / unsupported → continue in browser |
| Apple | Safari → Share → Add to Home Screen → Add. **No** `beforeinstallprompt`. Account for isolated Safari vs Home Screen cookies. |
| Android | `beforeinstallprompt` when present; otherwise Android menu guidance. **No** Apple copy. |
| Already standalone | Do not ask again |
| Unsupported | Continue in browser |
| `start_url` | Stay `/dashboard` (ADR-032). Do **not** set `/portal/tenant` on the manifest. |
| Native apps | None |
| Web Push | Out of scope |

Show the install prompt only on Tenant Portal after accept (or later visits while occupying / signed in). Do not show it on the invitation landing page before authentication.

---

## 13. Move Out workflow

### 13.1 Manager UX

```
Property / Unit / Lease → Resident → Move Out
```

Confirmation **must** show:

- Tenant name
- Property
- Unit
- Lease (customer label: dates / unit — not UUID)
- Effective move-out date

Optional note/reason is useful for audit; not required for the mutation.

Copy:

> **Move out this resident?**  
> M.P.A. will end their active access to this property. Lease, payment, maintenance, and communication history stay in the record.

Do **not** say “Delete Tenant.”

### 13.2 Canonical mutation (smallest)

Move Out updates **one** `lease_residents` occupancy:

| Field | Write |
|-------|--------|
| `occupancy_status` | `moved_out` when the date is effective; stay `occupying` with `occupy_to` set if future-dated |
| `occupy_to` | Effective date (`date`) |
| `financial_status` | Unchanged (do not mark paid, closed, or forgiven) |
| `user_id` | **Keep** |
| Row | **Keep** |

Then recompute the person:

- If another occupying/scheduled occupancy exists in the org → keep `active` / `active`; retarget current pointers to that occupancy.
- Else → `status=former`, `portal_status=disabled`; current pointers remain as **last known** location for staff display (do not null in a way that breaks history FKs).

Do **not**:

- delete `pm_residents`, `lease_residents`, membership, or auth
- end the lease
- change other household occupancies
- void FIN-OPS
- delete work orders or conversations

Lease-level **End Lease** is a separate manager action (existing `status=ended`). If Move Out is the last occupying resident, the UI may **offer** End Lease as a second confirmation. It must not happen implicitly.

### 13.3 Why not other tables

| Candidate | Use? |
|-----------|------|
| `lease_residents` occupancy | **Yes — canonical** |
| `pm_residents.status` / `portal_status` | Derived only |
| `lease_agreements` end | Only for explicit End Lease |
| Membership inactive | Only if Owner later wants “no login at all.” Default: keep membership for historical sign-in |
| New offboarding table | **No** — second state system |

---

## 14. Effective-date semantics

Lease dates are already `date`. Organizations have **no** timezone column. To avoid timestamptz ambiguity:

**Rule:** `occupy_from` and `occupy_to` are calendar dates. “Today” is `(timezone('utc', now()))::date`.

| Manager choice | Access |
|----------------|--------|
| Effective **today** (immediate) | After the mutation commits, current-unit grant is gone. Next API/RLS check fails. |
| Effective **future date D** | Occupant remains Active through **D inclusive**. On `utc_today() > D`, grant is Moved Out. |
| Effective **past date** | Allowed for late paperwork. Access ends immediately; history bound is that past date. |

Inclusive end: the resident has access **on** the move-out date, not after it.

Future-dated Move Out can be **cancelled** before it becomes effective (occupancy returns to open `occupy_to` null). After it is effective, use **correction** (§16), not delete.

Do not use the browser’s local midnight. The API stores and compares UTC dates only.

---

## 15. Historical access model

**Product principle:** a former tenant may see **their own** historical records and must lose **ongoing** property/unit activity.

| Surface | Former tenant | Why it is safe |
|---------|---------------|----------------|
| Own charges / payments / allocations / receipts on leases they occupied, with `period_start` / `due_at` / `created_at::date` ≤ `occupy_to` and ≥ `occupy_from` | **Yes** | Occupancy-dated FIN-OPS SELECT |
| Unpaid balance on those charges | **Yes** (read). Stripe execution stays off | No money mutation |
| Own maintenance work orders (`resident_id` = their person or `requested_by_user_id` = them) | **Yes** read; **no** create/update | Row is theirs, not the unit’s next occupant |
| COM-002 threads where `tenant_account_id` = their person **and** `lease_id` is a lease they occupied | **Yes** read; **no** new messages | Thread is person+lease, not “current unit inbox” |
| Documents whose `entity_type/entity_id` is that lease or that `pm_residents` id, created on or before `occupy_to` | **Yes** | Requires new tenant document policy — current org-member policy is **unsafe** |
| Next occupant’s charges, WOs, conversations, documents | **No** | Different occupancy / person / created-after bound |
| Current unit activity, staff reports, other orgs | **No** | |

If implementation cannot ship the occupancy-dated helpers, **do not** give former tenants portal history. Fail closed. Do not hide nav and leave RLS open.

Current Production **cannot** do this safely. That is explicit. The schema change in §24 is what makes it safe.

---

## 16. Multi-resident behavior

Household = multiple `lease_residents` on one `lease_agreements` row.

| Case | Result |
|------|--------|
| Tenant A moves out; Tenant B stays | A occupancy `moved_out`. B unchanged. Lease stays `active`. Unit stays occupied. |
| All residents move out | Each occupancy ends. Lease stays `active` until manager Ends Lease. UI may offer that second step. Unit `available` only when the lease is ended (existing activation inverse). |
| Primary tenant leaves | `lease_agreements.resident_id` may still point at A. Do **not** auto-reassign. Remaining occupants keep access. Staff may later set a new primary (optional follow-on; not required to keep B active). |
| Replacement resident joins | Add Tenant on the same lease → new occupancy + invitation. A’s history untouched. |
| Future replacement before A’s date | Allowed as `scheduled` if dates do not claim the same exclusive unit occupancy overlapping A — unit is shared household, not exclusive per person. Overlap on the same lease is normal for household. |

Resident-level offboarding and lease-level termination are distinct because the data model already has both `lease_residents` and `lease_agreements.status`.

---

## 17. Lease renewal

**Follow current architecture: extend the existing lease** (`end_date` moved forward; status stays `active`).

| Rule | |
|------|-|
| Auth account | Unchanged |
| `pm_residents` | Unchanged person |
| Occupancy | Same `lease_residents` row; `occupy_to` stays null or moves with the new end if it was tied to lease end |
| History | Same lease id remains the audit boundary for that term unless/until a later package introduces successor leases |

If a future package creates a **successor lease**:

- End occupancy on the old lease (or end the old lease).
- Insert a new `lease_residents` on the new lease for the same `pm_resident_id` / `user_id`.
- Do not create a new auth user.
- Do not rewrite old lease property/unit.

Do not force tenants to accept a new invitation merely to renew, if they are already occupying.

---

## 18. Unit transfer

Transfer is **move-out of Unit A occupancy + new occupancy on Unit B**. It is not a rewrite of Unit A history.

```
Unit A lease_residents occupancy → occupy_to = transfer date, status moved_out
Unit B: existing or new lease
  → new lease_residents row (same pm_resident_id / user_id)
  → invitation only if they are not already an M.P.A. user; otherwise auto-link
pm_residents current pointers → Unit B
```

Do not update historical charges, work orders, or conversations to Unit B. Those rows keep Unit A / old `lease_id`.

There is no current first-class “lease transfer” mutation. Do not invent one that mutates `lease_agreements.unit_id` in place.

---

## 19. Returning tenant behavior

Example: Property A → move out → months later Property B in the same org.

| Step | Record |
|------|--------|
| Identity | Same `auth.users` if email matches |
| Person | Same `pm_residents` (UNIQUE org+email) |
| Old grant | Occupancy on A remains `moved_out` |
| New grant | New `lease_residents` on B’s lease |
| Old property | Must not become Active again |
| Invitation | Add Tenant on B sends a new invitation if `user_id` is already set: accept is “sign in and attach,” not “create account” |

Different organization: different `pm_residents` row (unique is per org). Same auth email should still attach to the new org person via accept — one auth user, two org people, two occupancy graphs.

---

## 20. Unpaid FIN-OPS balance handling

FIN-OPS is live. Move Out must **not**:

- delete charges
- mark charges paid
- erase balances
- create refunds
- reopen July
- mutate migrated history
- enable Stripe execution
- enable M5

Former tenant SELECT (after occupancy-dated helper):

- charges on occupied leases whose period/due/created date falls inside `[occupy_from, occupy_to]`
- payments and allocations for those charges
- receipts for those payments
- outstanding = existing `amount - amount_paid` (read-only)

Checkout remains authorized only for **occupying** residents **and** still returns `stripe_payment_execution_disabled` until a later Owner package. Former tenants get **no** checkout execution path in this package.

`financial_status` on `lease_residents` is not a payment write. Do not set `closed` as a synonym for moved out.

---

## 21. Maintenance / COM-002 behavior

### 21.1 Open maintenance

Do **not** delete.

| Actor | After Move Out |
|-------|----------------|
| Staff | Still actionable. Work order stays on `resident_id` / unit / property. |
| Former tenant | Read own historical WOs. Cannot create. Cannot update. |
| New occupant | Cannot see the former tenant’s WOs (`resident_id` differs). |

`portal_status=disabled` already blocks create. Implementation must also require occupying grant so a still-active person on another unit cannot open WOs against the old unit.

### 21.2 Communications

Do **not** destroy COM-002 history.

| Rule | |
|------|-|
| Historical messages | Remain. Former tenant may read threads where they are `tenant_account_id` and the lease is one they occupied. |
| New unit/lease conversations | Former tenant is not a participant. Staff starting a unit thread for the new occupant uses the new `tenant_account_id`. |
| New messages on old thread | Former tenant: **no**. Staff: yes. Occupying household member: yes if they are on that conversation. |

docs/80 Q3 is answered: history-only on occupied-lease threads; no current-unit inbox.

---

## 22. Old-session revocation proof

Scenario: tenant is signed into browser or installed PWA. Manager Moves Out (effective immediately). Tenant does not log out. Tenant refreshes or calls APIs.

| Layer | Required behavior |
|-------|-------------------|
| Cookie `mpa_session` | May remain. Auth user still signed in. |
| `/portal/tenant` layout | May render a **Former** shell (historical) or redirect to a “access ended” resident home — **not** current unit tools |
| Maintenance create | 403 |
| COM-002 insert | 403 |
| FIN-OPS current-unit charges (new occupant / after occupy_to) | empty / 403 |
| FIN-OPS own historical charges | allowed if §15 helpers exist |
| Staff surfaces | still 403 |

Proof is **server-side occupancy on every request**. Not cookie expiry. Not “please log out.” Not client nav hiding.

Apple Home Screen has isolated cookies (docs/165). Both Safari and standalone sessions must fail the same RLS/API checks.

Automated proof: session fixture remains; occupancy ends; API matrix in §31.

---

## 23. Authorization matrix

Legend: **C** current-unit / occupying · **H** own historical · **F** future notice only · **—** deny · **S** staff · **N/A**

| Persona | Portal | Lease | Resident | Maint. | COM-002 | Docs | Charges | Payments | Receipts |
|---------|--------|-------|----------|--------|---------|------|---------|----------|----------|
| 1. Active Tenant A | C | C own | own | C own | C own | C own | C own | C own | C own |
| 2. Former Tenant A | H shell | H own | own person | H read | H read | H own | H own | H own | H own |
| 3. Future Tenant A | F | F dates | own | — | — | — | — | — | — |
| 4. Tenant B same lease | C | C | own + household display | C own | C own | C lease | C lease* | C lease* | C lease* |
| 5. Tenant C same org, other unit | C their unit | their lease | own | their WOs | their threads | their docs | their lease | their lease | their lease |
| 6. Tenant D other org | — | — | — | — | — | — | — | — | — |
| 7. Property manager | S PM | S | S | S | S | S | S FIN-OPS | S | S |
| 8. Complete + Property staff | S PM | S | S | S | S | S | S if finance capability | S | S |
| 9. Complete + Facility-only | FO only | — | — | FO WOs | — | FO | — | — | — |
| 10. Vendor | vendor portal | — | — | assigned WO | — | — | — | — | — |
| 11. Anonymous | — | — | — | — | — | — | — | — | — |
| 12. Existing auth user accepting new invite | accept → then row 1 or 3 | bound lease only | bound person | after occupy | after occupy | after occupy | after occupy | after occupy | after occupy |

\*Household FIN-OPS today is lease-scoped. Tenant B sees charges on the shared lease while occupying. After A moves out, A’s historical bound is A’s `occupy_to`; B continues to see new lease charges. That is the intended household split.

Facility-only Complete staff must not gain PM finance (ADR-033). Unchanged.

---

## 24. Required schema changes

Smallest additive set. No third resident table. No July/FIN-OPS money columns.

### 24.1 `lease_residents` occupancy

| Column | Type | Notes |
|--------|------|-------|
| `pm_resident_id` | `uuid` FK `pm_residents` | Backfill by org+email. Required going forward. |
| `occupancy_status` | `text` | `scheduled \| occupying \| moved_out` |
| `occupy_from` | `date` | Default lease `start_date` |
| `occupy_to` | `date` null | Inclusive last access date |

Backfill: existing rows → `occupancy_status=occupying`, `occupy_from=lease.start_date`, `occupy_to=null` (or lease `end_date` if lease `ended`).

Do not drop `email` / `user_id` / `financial_status`.

### 24.2 `organization_invitation_tenant_bindings`

| Column | Type |
|--------|------|
| `invitation_id` | PK/FK unique |
| `organization_id` | FK |
| `property_id` | FK |
| `unit_id` | FK |
| `lease_id` | FK |
| `resident_id` | FK `pm_residents` |
| `lease_resident_id` | FK `lease_residents` |

CHECK: invitation roles contain `tenant`. Staff invitations have no binding row.

### 24.3 No new person statuses

Reuse existing checks on `pm_residents` and `organization_invitations`.

### 24.4 Helpers (replace/extend, do not fork money)

- `utc_today() date`
- `tenant_occupies_lease(org, lease)`
- `tenant_occupied_lease(org, lease)` (historical participation)
- `finance_resident_owns_lease` **tightened** to occupying **or** historical-bounded (see §26)
- Tenant document / lease / maintenance SELECT helpers that **exclude** `is_org_member` for role `tenant`

---

## 25. Required application changes

Implementation is **not** authorized by this Draft. After approval, slices should include:

| Area | Change |
|------|--------|
| Residents UX | Add Tenant on lease; Access column; Move Out confirmation |
| Invitation | Create binding; tenant email copy; accept branch |
| Portal layout | Occupancy mode: Active / Future / Former |
| `provisionResidentPortalAccess` | Called from accept; stop treating activation magic-link as the only onboard |
| Conversation / maintenance / billing APIs | Occupancy grant; fail closed |
| docs/165 | Install CTA after Tenant Portal success only |
| Copy | Add Tenant / Move Out; never Delete Tenant |

Managers still never see `operating_scope` or UUIDs.

---

## 26. Required RLS changes

| Policy / helper | Change |
|-----------------|--------|
| `finance_resident_owns_lease` | Occupying: unchanged lease match via `user_id` / bound `pm_resident_id`. Historical: same lease participation **and** charge `period_start` (else `due_at`, else `created_at::date`) ∈ `[occupy_from, occupy_to]`. Payments/receipts/allocations follow the related charge or payment lease **and** the same bound. |
| `financial_*` staff writes | Unchanged M4 `member_has_finance_capability` + write guard. |
| `can_access_tenant_conversation` / `is_lease_resident` | Occupying for write. Occupying **or** occupied-lease + `tenant_account_id` for SELECT. |
| `maintenance_work_orders` SELECT | Tenant must not pass via `is_org_member`. Own `resident_id` / requester only. INSERT/UPDATE require occupying. |
| `document_documents` SELECT | Staff keep member/manager. Tenant: entity is own lease or own `pm_residents` id, created_at date ≤ occupy_to when former. |
| `lease_agreements` SELECT | Tenant: occupy or occupied that id. Not all org leases. |
| `pm_residents` SELECT | Tenant: own `user_id` only. Staff writers unchanged. **Close** “any org member reads all residents” for role `tenant`. |
| Invitation accept | Still service_role; no invitee write policy. |

July freeze and M4 write policies stay. This package does not replay unused FIN-OPS stamps.

---

## 27. Audit / event requirements

Reuse `event_domain_events` + `audit_events`. Suggested types:

| Event | When |
|-------|------|
| `tenant.invited` | Add Tenant + invitation + binding |
| `tenant.invitation_accepted` | Accept (idempotent retries do not emit a second domain event) |
| `tenant.invitation_revoked` / `tenant.invitation_expired` | Status change |
| `tenant.moved_out` | Occupancy end (include names, property, unit, lease id, effective date, actor) |
| `tenant.move_out_cancelled` | Future date cancelled |
| `tenant.move_out_corrected` | Effective date corrected |
| `tenant.occupancy_started` | Future → occupying when date passes (job or on-read reconcile) |
| `tenant.transferred` | Unit A ended + Unit B created (two child events acceptable) |
| `resident.portal_access_provisioned` | Keep existing |

Payloads store customer labels plus ids for operators. Visibility `ops`. Do not log magic-link secrets.

---

## 28. Implementation slices

After approval only. Suggested order (no calendar estimates):

| Slice | Scope | Depends |
|-------|-------|---------|
| L0 | Occupancy columns + backfill + `pm_resident_id` | — |
| L1 | Occupancy helpers + tenant RLS tighten (fail closed) | L0 |
| L2 | Tenant invitation binding + accept branch | L0, docs/135 |
| L3 | Add Tenant UX + email | L2 |
| L4 | Portal occupancy modes + API gates | L1 |
| L5 | Move Out + cancel/correct + events | L0, L1 |
| L6 | Historical FIN-OPS / COM-002 / documents SELECT | L1 |
| L7 | docs/165 install hook on Tenant Portal | L4, docs/165 Approved |
| L8 | Automated tests + Production UAT | L1–L7 |

L7 must not ship if docs/165 is still Draft.

---

## 29. Migration / deployment ordering

1. Deploy application that **tolerates** new occupancy columns (null-safe read) **before** apply, or apply then deploy in one Owner-authorized window — prefer apply-then-deploy only if the app already ignores unknown columns (it will not). Standard M.P.A. order: **compatible app first**, then migration, then occupancy-required app.
2. Backfill occupancy from lease dates. Do not rewrite FIN-OPS.
3. Apply RLS tighten in the same window as the occupancy-required app so tenants are not locked out.
4. Then enable Add Tenant / Move Out UI.
5. PWA hook only after docs/165 approval + L4.

Do not apply this migration in the same change as Stripe execution, M5, or July work.

Rollback of RLS must restore prior helpers **without** deleting occupancy columns (additive).

---

## 30. Rollback / correction strategy

| Situation | Action |
|-----------|--------|
| Future Move Out wrong resident | Cancel before effective date. Audit `tenant.move_out_cancelled`. |
| Already-effective wrong Move Out | **Correct**: set occupancy back to `occupying`, `occupy_to` null (or new date). Emit `tenant.move_out_corrected`. Do **not** delete the event or the row. |
| Wrong Add Tenant / invitation | Revoke invitation if pending. If accepted and not yet occupying, Move Out with today or revoke occupancy `scheduled` → `moved_out` with note. Do not delete the person if they have any history. |
| Bad RLS deploy | Restore previous function bodies. Keep columns. |
| Need to undo schema | Leave columns unused; do not drop if rows are populated. |

Correction never “fixes” history by deleting charges, messages, or invitations.

---

## 31. Automated tests

| Class | Cases |
|-------|-------|
| Accept | New account; existing account; idempotent retry; email mismatch; expired; revoked; missing binding; ended lease; conflicting user_id; body cannot change lease |
| Occupancy | Active / future / moved-out date bounds (UTC date) |
| Household | A out / B stays; last resident does not end lease; replacement join |
| Return | Same email reuses person; old occupancy stays moved_out |
| Transfer | Unit A history intact; Unit B new row |
| FIN-OPS | Former A cannot SELECT B’s later charges on same lease; can SELECT own period-bounded charges; staff unchanged; July untouched |
| COM-002 | Former cannot insert; can select own old thread; cannot select new occupant thread |
| Maintenance | Former cannot create; cannot see new unit WOs; staff can |
| Documents | Tenant cannot `is_org_member` dump; former cannot see post-occupy_to docs |
| Session | Cookie remains; current-unit APIs 403 after immediate Move Out |
| Scope | Facility-only Complete denied PM finance; vendor denied; anonymous denied |
| PWA | Install not required for accept (docs/165 tests stay in that package) |

No Production mutation in CI.

---

## 32. Production UAT plan

Use existing UAT fixtures only. **Do not** first-write finance or use Canopy / PMX / Development as the ceremony org.

Suggested org: Property Demo (`a11ce002-0001-4000-8000-0000000000c2`) and/or Clinic Complete for staff-scope negatives. Known demo lease `a11ce002-0001-4000-8000-000000000401` is for **read** orientation only until Owner authorizes UAT tenants.

| # | Script | Pass |
|---|--------|------|
| U1 | Manager Add Tenant (name, email, lease) | Invitation sent; no password UI |
| U2 | New email: create account → accept → Tenant Portal | Binding FKs unchanged |
| U3 | Existing email: sign in → accept → no duplicate user | Same auth id |
| U4 | Optional PWA: Apple instructions on iPhone; Android prompt/menu on Android; skip works | docs/165 |
| U5 | Active tenant: home, own maintenance, own messages, own billing read | No staff chrome |
| U6 | Tenant C other unit cannot see A | RLS + UI |
| U7 | Move Out A, B stays | Confirmation shows name/property/unit/date |
| U8 | A session refresh: no current unit; own history remains | Cookie still signed in |
| U9 | New occupant charges/WOs/threads invisible to A | |
| U10 | Unpaid A charges still listed; amounts unchanged; checkout still execution-disabled | |
| U11 | Future Move Out cancel | Access remains |
| U12 | Effective Move Out correct | History + new event; no delete |
| U13 | Facility-only Complete cannot open tenant finance | ADR-033 |
| U14 | July hashes / FIN-OPS totals unchanged | |

Owner must authorize any live invitation send or Move Out. This design turn performed **none**.

---

## 33. Explicit hard stops

Do **not**, in this package or its implementation follow-on without a new Approved gate:

- Implement this design before Owner approval
- Modify Production from this record
- Create a migration or apply SQL in this turn
- Deploy
- Create a tenant, send a tenant invitation, or Move Out a resident
- Modify lease/resident relationships in Production
- Modify FIN-OPS money
- Reopen July finance
- Enable Stripe payment execution
- Implement M5
- Modify subscriptions / SKUs / pricing
- Implement native iOS or Android
- Implement Web Push
- Create a third resident identity domain
- Delete history to remove access
- Trust the browser with occupancy FKs
- Treat membership role `tenant` as current-unit access
- Implement docs/165 without Tenant Portal onboarding

---

## Recommended Owner confirmations (not blockers)

These have a designed default. Owner may override at approval:

1. **Last resident leaves** — default: do not auto-end the lease; offer a second End Lease step.
2. **Former tenant login** — default: membership stays; Former shell + historical records; fail closed if RLS is not ready.
3. **Today’s date** — default: UTC calendar date, matching existing lease dates.
4. **Renewal** — default: extend the same lease; successor lease is a later package.
5. **Household charges** — default: occupying household members share the lease ledger; former members are date-bounded.

---

## Approval

Product Owner must approve this record before any application code, UI, migration, or Production change.

**Status: Approved.** In-repo implementation authorized. Production apply and deploy are not authorized by this approval.
