# 137 — Complete Delegated Operations Invitation Remediation Production Migration Certification

**Title:** COMPLETE DELEGATED OPERATIONS INVITATION & MEMBERSHIP ACCEPTANCE PRODUCTION MIGRATION CERTIFICATION  
**Status:** **READY FOR PRODUCTION MIGRATION APPLICATION**  
**Date:** 2026-08-15  
**Program:** Complete Delegated Operations (invitation workflow only)  
**Authority:** [docs/135](../135-complete-delegated-operations-invitation-remediation/index.md) **Approved** · [docs/136](../136-complete-delegated-operations-invitation-implementation-certification/index.md) **READY FOR PRODUCTION MIGRATION CERTIFICATION** · [ADR-033](../18-decision-log/adr-033-member-operating-scope.md) remains closed  
**Related:** [docs/127](../127-complete-delegated-operations/index.md) · docs/134 (cert branch) · ADR-026 · ADR-031 · PLAT-005  
**Gate:** Design → Document → Approve → Implement → **Production migration certification** (ADR-012)  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` (us-west-2, ACTIVE_HEALTHY)  
**Not the target:** `mpa-preview` / `drcbipqrxfqpjilsfxip` (us-east-1)  
**This package:** **Read-only Production analysis only.**  

---

## Verdict

**READY FOR PRODUCTION MIGRATION APPLICATION.**

`20260815220000` / `docs_135_invitation_acceptance_remediation` is a **valid successor** to the live Production ledger tip `20260815193129` / `adr_033_dataplane_member_scope`. The repo filename stamp is later than the tip. **Do not invent a different stamp. Do not invent or apply substitute SQL.**

This record **does not apply** the migration. It **does not deploy**. It **does not** create or send Production invitations, modify memberships, assign operating scopes, reset passwords, or touch Stripe / billing / SKUs / FIN-OPS.

**Exact migration authorized for a later Owner apply step (not this package):**

| Field | Value |
|-------|--------|
| File | `supabase/migrations/20260815220000_docs_135_invitation_acceptance_remediation.sql` |
| Ledger version | `20260815220000` |
| Ledger name | `docs_135_invitation_acceptance_remediation` |
| SHA-256 | `1c24058a47ef924ded3f18731b13967b80a373a066e65fa99d732924568c8638` |
| Lines | 97 |

**Apply order remains:** schema first → current ADR-033 application stays live temporarily → later docs/135 application deploy → controlled invitation UAT. Split-state is **safe** (section 10).

---

## What this package did not do

- Did not call `apply_migration`
- Did not write to Production
- Did not deploy the application
- Did not merge anything
- Did not create or send Production invitations
- Did not modify Production memberships or operating scopes
- Did not reset passwords
- Did not change Stripe / billing / pricing / subscriptions / SKUs / roles / entitlement keys
- Did not implement FIN-OPS, create `financial_charges`, replay S0/S1/S2, replay historical ADR-033 migrations, or modify July finance data

---

## 1. Production lineage

Read 2026-08-15 against `mpa-prod` / `vahnmcrpnuggxkivynvo` via Supabase MCP `list_projects`, `get_project`, `list_migrations`, and `execute_sql` only.

### 1.1 Target confirmation

| Project | Ref | Region | Status | Role |
|---------|-----|--------|--------|------|
| `mpa-prod` | `vahnmcrpnuggxkivynvo` | us-west-2 | ACTIVE_HEALTHY | **This certification target** |
| `mpa-preview` | `drcbipqrxfqpjilsfxip` | us-east-1 | ACTIVE_HEALTHY | **Not the target** |

### 1.2 Ledger tip

| Field | Live value |
|-------|------------|
| Current tip | `20260815193129` / `adr_033_dataplane_member_scope` |
| Expected predecessor | **Confirmed** — `20260815193129` / `adr_033_dataplane_member_scope` |
| ADR-033 base | **Live** — `20260815185722` / `adr_033_member_operating_scope` |
| ADR-033 Slice D (dataplane) | **Live** — tip above |
| `20260815220000` registered | **No** |
| Equivalent invitation-remediation successor | **None** |
| Forbidden unused stamps `20260815200000` / `20260815210000` | **Absent** — do not apply |

Recent Production lineage (apply-time versions):

| Version | Name |
|---------|------|
| `20260815170604` | `plat_005_privileged_rpc_execute_hardening` |
| `20260815175833` | `plat_006_finance_capability_grants` |
| `20260815185722` | `adr_033_member_operating_scope` |
| `20260815193129` | `adr_033_dataplane_member_scope` |

Older invitation lineage (`20260725011317` / `auth001_slice_c_invitations_credentials`, `20260728022516` / `auth001_invitation_property_scopes`) is historical foundation, not this package.

Repo filenames `20260815200000` and `20260815210000` are ADR-033 certified sources that landed under **different live stamps**. Replaying them is forbidden.

### 1.3 Successor validity

`20260815220000` > tip `20260815193129`. The certified file can register under its repo version. **STOP condition for a different stamp is not triggered.**

### 1.4 Production application SHA

GitHub Production environment deployment `5923987277`:

| Field | Value |
|-------|--------|
| SHA | `9b92db375dac75d469ed859134c629d46af536e8` |
| Created | `2026-08-15T19:42:36Z` |
| Meaning | Live ADR-033 application. Selects/writes `email_status` (absent on Production). Accept uses the caller session client, not `service_role`. |

That SHA does **not** include docs/135. A Preview of this branch is not Production.

---

## 2. Live invitation schema

### 2.1 `organization_invitations` columns (explicit)

Present: `id`, `organization_id`, `email`, `roles`, `invited_by`, `token` (`uuid`, default `gen_random_uuid()`), `status`, `expires_at`, `accepted_by`, `accepted_at`, `created_at`, `updated_at`, `provisioned_user_id`, `username`, **`delivery_status`**, **`last_delivered_at`**, `activated_at`, `property_ids`, **`operating_scope`**.

| Required confirmation | Live |
|-----------------------|------|
| `delivery_status` exists | **Yes** (`text`, nullable) |
| `last_delivered_at` exists | **Yes** (`timestamptz`, nullable) |
| `email_status` remains absent | **Yes** — also absent: `email_sent_at`, `email_provider_id`, `email_error` |
| `operating_scope` on invitations | **Yes** (nullable) |
| `operating_scope` on memberships | **Yes** (nullable) |

### 2.2 CHECK constraints

| Constraint | Live definition |
|------------|-----------------|
| `organization_invitations_status_check` | `pending` \| `accepted` \| `revoked` \| `expired` |
| `organization_invitations_delivery_status_check` | NULL or `pending` \| `sent` \| `failed` |
| `organization_invitations_operating_scope_check` | NULL or `property_operations` \| `facility_operations` \| `both` |
| `organization_invitations_roles_check` | `<@` `organization_admin`, `property_manager`, `leasing_agent`, **`facility_technician`**, `property_owner`, `tenant`, `vendor` — **no `maintenance_technician` yet** |
| `organization_memberships_roles_check` | Same allowed set as invitations |
| `organization_memberships_operating_scope_check` | NULL or `property_operations` \| `facility_operations` \| `both` |
| `organization_memberships_status_check` | `active` \| `inactive` |

### 2.3 Unique constraints / indexes used by trusted accept

| Object | Live |
|--------|------|
| `organization_invitations_token_key` | UNIQUE (`token`) |
| `organization_invitations_pending_email_org_uidx` | UNIQUE (`organization_id`, `lower(email)`) WHERE `status = 'pending'` |
| `organization_memberships_organization_id_user_id_key` | UNIQUE (`organization_id`, `user_id`) — **used by trusted accept upsert/race handling** |
| `organization_operating_scope_events_invitation_accepted_uidx` | **Absent** — migration will add it |

### 2.4 RLS policies

**Invitations**

| Policy | Command | Live expression |
|--------|---------|-----------------|
| `invitations_insert_authorized` | INSERT | `has_org_capability(..., 'invitation:create')` |
| `invitations_select_authorized` | SELECT | `invitation:read` **OR** jwt email match |
| `invitations_update_authorized` | UPDATE | `invitation:create` **OR jwt email match** ← migration removes the email-match path |

**Memberships**

| Policy | Command | Live expression |
|--------|---------|-----------------|
| `memberships_insert_authorized` | INSERT | `membership:update` **OR** org `created_by = auth.uid()` |
| `memberships_select_self_or_authorized` | SELECT | self or `membership:read` |
| `memberships_update_authorized` | UPDATE | `membership:update` |
| `memberships_delete_authorized` | DELETE | `membership:update` |

No invitee-self-insert membership policy exists. The certified migration does not add one.

**Scope events:** insert requires `is_org_manager`; select requires an active membership. Trusted accept writes events via `service_role`.

No invitation-accept `SECURITY DEFINER` function exists. No `GRANT EXECUTE` of a new accept RPC to `anon` / `authenticated` is proposed.

### 2.5 Invitation row counts and status distribution

**7** invitation rows. All satisfy the live (and migration-recreated) `delivery_status` CHECK. No backfill required.

| `status` | `delivery_status` | n |
|----------|-------------------|---|
| `accepted` | `failed` | 1 |
| `accepted` | `pending` | 3 |
| `expired` | `failed` | 1 |
| `pending` | NULL | 1 |
| `revoked` | `failed` | 1 |

No `sent` values. One historical pending row has NULL transport (allowed).

Invitation identifiers (read-only):

| id | status | delivery_status | operating_scope | roles |
|----|--------|-----------------|-----------------|-------|
| `0da3b02d-1697-43b4-bd35-054185c9931e` | pending | NULL | NULL | tenant |
| `1b659e20-4ef7-4b75-9433-f3a734da151a` | accepted | failed | NULL | property_manager |
| `fae401aa-e51b-4bc9-90bf-fbd5cc05c42e` | revoked | failed | NULL | tenant |
| `20044491-1bc2-4b01-80f3-0da6bbc17660` | expired | failed | NULL | vendor |
| `1068e2d9-9432-4a56-a4f8-ddca89d0e5cf` | accepted | pending | both | organization_admin |
| `f3fe428d-7055-4a56-ae37-4d9168ad615a` | accepted | pending | property_operations | property_manager |
| `2bfe9032-0934-4dc6-ab1a-21fca4cadb08` | accepted | pending | facility_operations | property_manager |

Existing rows remain compatible with the certified statements.

---

## 3. Certified migration statement classification

File: `supabase/migrations/20260815220000_docs_135_invitation_acceptance_remediation.sql`  
SHA-256: `1c24058a47ef924ded3f18731b13967b80a373a066e65fa99d732924568c8638`

| # | Statement | Class | Production effect |
|---|-----------|-------|-------------------|
| 1 | `ALTER TABLE organization_invitations ADD COLUMN IF NOT EXISTS delivery_status text` | Additive / no-op | Column already live |
| 2 | `ADD COLUMN IF NOT EXISTS last_delivered_at timestamptz` | Additive / no-op | Column already live |
| 3 | `DROP CONSTRAINT IF EXISTS organization_invitations_delivery_status_check` | Recreate same CHECK | Live definition is identical |
| 4 | `ADD CONSTRAINT ... delivery_status IS NULL OR IN ('pending','sent','failed')` | Recreate same CHECK | Historical rows already satisfy it |
| 5–6 | Comments on `delivery_status` / `last_delivered_at` | Metadata | No row change |
| 7 | `DROP POLICY invitations_update_authorized` | RLS replace | Removes jwt-email UPDATE |
| 8 | `CREATE POLICY invitations_update_authorized` USING/CHECK `invitation:create` only | RLS harden | Approved docs/135 / docs/136 |
| 9–10 | Drop/recreate `organization_invitations_roles_check` | Additive CHECK | Adds `maintenance_technician`; keeps `facility_technician` |
| 11–12 | Drop/recreate `organization_memberships_roles_check` | Additive CHECK | Same allowed set; no row rewrite |
| 13 | `CREATE UNIQUE INDEX IF NOT EXISTS organization_operating_scope_events_invitation_accepted_uidx` | Additive unique | Safe: 3 accepted events / 3 distinct `invitation_id`s |

### 3.1 Approved docs/135 / docs/136 objects — present

- Invitation UPDATE authorization hardening
- Additive technician role CHECK compatibility (`maintenance_technician` **and** `facility_technician`)
- `invitation.accepted` event uniqueness / idempotency support
- Transport columns preserved (`delivery_status` + `last_delivered_at`)

### 3.2 Forbidden objects — absent from the file

| Forbidden | Confirmed absent |
|-----------|------------------|
| Add `email_status` | Yes |
| Rename or drop `delivery_status` | Yes |
| Invitee-self-insert membership access | Yes |
| Grant membership INSERT to ordinary invitees | Yes |
| New anon/authenticated `SECURITY DEFINER` RPC | Yes — no `CREATE FUNCTION`, no `GRANT` |
| Rewrite existing memberships | Yes |
| Rewrite operating scopes | Yes |
| Create `facility_manager` | Yes |
| Alter RBAC grants | Yes |
| Alter SKUs / subscriptions / billing / Stripe | Yes |
| Create FIN-OPS tables / touch `financial_charges` | Yes |
| Replay historical ADR-033 migrations | Yes |
| Weaken PLAT-005 RPC hardening | Yes — no privileged RPC change |

---

## 4. Transport compatibility

Canonical contract remains the live Production lineage:

| Layer | Values |
|-------|--------|
| Business status | `pending` / `accepted` / `revoked` / `expired` |
| Transport | `delivery_status` (`NULL` or `pending` / `sent` / `failed`) + `last_delivered_at` |

The migration recreates the **same** `delivery_status` CHECK already live. It does not add `skipped` to the column. Application `skipped` remains a computed API notice when no provider send occurred.

All 7 historical invitation rows are valid without backfill or destructive conversion. NULL `delivery_status` stays legal. `last_delivered_at` stays nullable (all 7 currently NULL).

---

## 5. Acceptance security compatibility

Approved trusted flow (docs/135 Option B; implemented in docs/136; **not live until later app deploy**):

```
authenticated user
  → token validation
  → invitation re-read
  → email / user / org / status / expiry validation
  → persisted role + operating_scope
  → service_role membership mutation
  → conditional pending → accepted transition
  → one invitation.accepted event
```

Schema support after this migration:

| Requirement | Result |
|-------------|--------|
| Unique token lookup | Live UNIQUE (`token`) |
| Unique pending email per org | Live unique index |
| Membership uniqueness for insert/upsert/race | Live UNIQUE (`organization_id`, `user_id`) |
| Conditional `pending` → `accepted` | Live `status` CHECK unchanged |
| One accepted event | Unique partial index added; no current duplicates |
| Invitee cannot UPDATE persisted role/scope/token | UPDATE policy loses jwt-email path |
| Invitee SELECT-by-email for preview | SELECT policy unchanged |
| Ordinary authenticated invitees cannot INSERT arbitrary memberships | `memberships_insert_authorized` unchanged |
| Removing email-match UPDATE does not block trusted accept | `service_role` bypasses RLS; live accept already never reached invitation UPDATE because membership INSERT fails first |

Live Production accept (`9b92db37`) passes the **caller** Supabase client into `acceptInvitation`. Membership INSERT then fails `memberships_insert_authorized`. Closing invitee UPDATE does not make that path worse; it closes the remaining invitee write hole.

No new client-callable accept RPC is introduced. PLAT-005 surface stays: existing `has_org_capability` / `is_org_manager` EXECUTE for `authenticated` only; no invitation/accept function exists.

---

## 6. Technician CHECK

The replacement CHECK accepts both approved existing values:

- `maintenance_technician` (application role key after docs/135 Slice A)
- `facility_technician` (live historical memberships)

| Check | Result |
|-------|--------|
| `facility_manager` introduced | **No** |
| Existing membership rewritten | **No** |
| Role grants / RBAC catalog changed | **No** |
| Existing Production rows satisfy the resulting constraint | **Yes** |

Live distinct roles:

| Source | Roles present |
|--------|----------------|
| Memberships | `facility_technician` (2), `organization_admin` (12), `property_manager` (22), `property_owner` (1), `tenant` (3), `vendor` (3) |
| Invitations | `organization_admin` (1), `property_manager` (3), `tenant` (2), `vendor` (1) |

No `maintenance_technician` rows yet (app cannot write that value until the CHECK widens). No `facility_manager` rows. Every live role is a subset of the new allowed array.

---

## 7. ADR-033 safety

Binding formula is unchanged:

```
effective access =
  SKU surfaces
  ∩ member operating scope
  ∩ role/module permission
  ∩ action
```

The migration does not alter SKU assignment, `operating_scope` CHECKs, capability grants, or authorization helpers.

Controlled Complete UAT org `a11ce001-0001-4000-8000-00000000c11c` representations remain valid **without modification** (read-only this package):

| Persona | Role | Scope | Status |
|---------|------|-------|--------|
| Erick `uat.adr033.erick@…` | `organization_admin` | `both` | active |
| Sarah `uat.adr033.sarah@…` | `property_manager` | `property_operations` | active |
| Mike `uat.adr033.mike@…` | `property_manager` | `facility_operations` | active |

These rows were **not** created or updated during certification.

Membership `operating_scope` distribution: 31 NULL (existing Complete NULL→BOTH compatibility remains), 1 `both`, 1 `property_operations`, 1 `facility_operations`. The migration does not rewrite NULL scopes.

---

## 8. Last-BOTH / delegation safety

The migration creates **no schema path** that bypasses application enforcement for:

| Control | Schema effect |
|---------|----------------|
| Scoped inviter grant caps | None — app-only (`inviterMayGrantInvitation`) |
| Role demotion protection | None — app-only (`wouldLeaveCompleteWithoutBothAdmin` + `nextRoles`) |
| Scope-change protection | Same helper; membership UPDATE RLS still requires `membership:update` |
| Existing-member invitation accept/upsert | Unique (`organization_id`, `user_id`) remains; accept overwrite stays in trusted Next.js |
| Last BOTH administrator protection | No SQL trigger/function added that could skip the app check |

Invitees still cannot INSERT memberships. Invitees lose the jwt-email UPDATE path that could have rewritten persisted role/scope before accept.

Destructive live tests against existing Complete admins were **not** performed.

---

## 9. Data-safety baseline (2026-08-15, this cert read)

| Object | Count / identifiers |
|--------|---------------------|
| `organizations` | **21** |
| `organization_memberships` | **34** (32 active; 3 scoped) |
| `organization_invitations` | **7** (ids in §2.5) |
| `organization_operating_scope_events` | **8** — 3 `invitation.created`, 3 `invitation.accepted`, 2 `membership.updated` |
| Subscriptions by SKU | **6** — 1 `mpa_complete_platform` active · 5 `mpa_property_manager` active · **0** `mpa_facility_operations` |
| Work orders (`maintenance_work_orders`) | **33** — 14 `facility` / 19 `residential` |
| FAC-003 `facility_assets` | **6** |
| FAC-003 `facility_stock_items` | **2** |
| FAC-003 `facility_stock_movements` | **9** |
| COM-002 `comms_conversations` | **2** |
| COM-002 `comms_messages` | **0** |
| OPS-001 `document_documents` | **1** |
| OPS-001 `workspace_tables` | **7** |
| July `financial_activity` | **12** |
| `financial_charges` | **Absent** |

COM-002 live tables remain `comms_conversations` / `comms_messages` (Tenant Communication Center, ADR-024). Identifier collision: this is **not** COM-002 Self-Service Commercial (ADR-018).

Scope-event identifiers (read-only): `46b33f8f-…`, `ae2e29bb-…`, `5b2f7415-…` (created); `4c6673d4-…`, `16860a10-…`, `75167beb-…` (accepted); `d7caf1a5-…`, `f739691a-…` (membership.updated). Accepted events are 1:1 with invitation ids `1068e2d9`, `f3fe428d`, `2bfe9032`.

docs/126 FIN-OPS remains **AUDIT COMPLETE · BLOCKED FOR REMEDIATION DESIGN**.

---

## 10. Split-state analysis

Designed release order:

```
migration first
  → current ADR-033 application remains live temporarily
  → later application deploy
  → controlled invitation UAT
```

| Live path after schema apply, before docs/135 deploy | Breaks? |
|------------------------------------------------------|---------|
| Existing invitation **creation** | **No new break.** Live app (`9b92db37`) already INSERTs `email_status`, which remains absent. Migration does not add it. Create stays failed until the later app deploy. |
| Existing Team UI | **No new break.** Team list already SELECTs `email_status`. SELECT policy is unchanged. |
| Invitation listing | **No new break.** Same `email_status` contract mismatch. Invitee SELECT-by-email remains. |
| Current membership authorization | **Unchanged.** Membership RLS, `has_org_capability`, SKU ∩ scope ∩ role ∩ action stay as ADR-033. |
| ADR-033 operating scopes | **Unchanged.** Scope CHECKs, columns, and the 3 scoped rows are not rewritten. |
| Existing Complete NULL compatibility | **Unchanged.** 31 NULL membership scopes remain legal. |
| Current accept | **No new functional break.** Live accept already fails membership INSERT RLS. Removing invitee UPDATE closes a write hole the live accept never successfully used. |
| Technician CHECK widen | **Safe.** Additive. Existing rows satisfy it. Live app does not write `maintenance_technician`. |
| Accepted-event unique index | **Safe.** No duplicate `invitation.accepted` per invitation. |

Applying the schema **before** the docs/135 application is therefore **safe**. It does not authorize skipping the later deploy or UAT.

If this analysis had found a live-path regression, the verdict would be **BLOCKED**. It did not.

---

## 11. Rollback

Safe rollback boundary after a later apply (not performed here):

**May**

- Revert a later docs/135 application deploy independently
- Restore `invitations_update_authorized` to include jwt-email **only** if a documented invitee UPDATE path is re-approved (it should not be)
- `DROP INDEX IF EXISTS organization_operating_scope_events_invitation_accepted_uidx`
- Restore the narrower role CHECKs **only if** no `maintenance_technician` row exists

**Must not**

- Delete organizations
- Delete memberships
- Delete historical invitations
- Rewrite operating scopes
- Alter subscriptions / SKUs
- Touch Stripe / billing
- Touch FIN-OPS / `financial_activity` / create or drop `financial_charges`
- Remove ADR-033 base `20260815185722` or Slice D `20260815193129`
- Drop `delivery_status` or `last_delivered_at`
- Apply unused stamps `20260815200000` / `20260815210000`

Do not roll back ADR-033 dataplane to undo this invitation remediation.

---

## 12. Hard stops

| Stop | Status |
|------|--------|
| Target is Preview | Not triggered — target is `mpa-prod` |
| Tip is not `20260815193129` | Not triggered |
| `20260815220000` already registered | Not triggered |
| Equivalent invitation-remediation successor already applied | Not triggered |
| Successor stamp would need to differ from the repo version | Not triggered |
| `email_status` already present (would imply a different transport lineage) | Not triggered |
| `delivery_status` missing | Not triggered |
| Historical invitation rows would fail the recreated CHECK | Not triggered |
| Duplicate `invitation.accepted` events would fail the unique index | Not triggered |
| Existing roles would fail the widened CHECK | Not triggered |
| Migration would add invitee membership INSERT or a client accept RPC | Not triggered |
| Migration would touch Stripe / SKUs / FIN-OPS / ADR-033 formula | Not triggered |
| Split-state would break live authorization or NULL compatibility | Not triggered |

---

## Out of scope (honored)

- Production apply / deploy / merge
- Real invitations, password resets, membership/scope mutations
- FIN-OPS / `financial_charges` / Stripe / billing / SKUs / prices / roles / entitlement keys
- Redesign of ADR-033
- New ADR
- Client-callable accept RPC
- Invitee membership INSERT policy
- Controlled invitation UAT (later package after apply + deploy)

---

## Next Owner step

A **separate** Production migration **application** package may apply **only**:

`supabase/migrations/20260815220000_docs_135_invitation_acceptance_remediation.sql`

Then a separate application deploy. Then the docs/135 later UAT matrix. None of those steps are authorized by this record.

---

## Final verdict

**READY FOR PRODUCTION MIGRATION APPLICATION**
