# 135 — Complete Delegated Operations Invitation & Membership Acceptance Remediation

**Title:** COMPLETE DELEGATED OPERATIONS — INVITATION & MEMBERSHIP ACCEPTANCE REMEDIATION  
**Status:** **Approved**  
**Date:** 2026-08-15  
**Approved:** 2026-08-15 — Product Owner `APPROVE docs/135`  
**Program:** Complete Delegated Operations (invitation workflow only)  
**Gate:** Design → Document → Approve → **Implement (authorized)**  
**This package:** Approved design. Implementation is authorized for slices A, B, C, and E only. **No Production apply. No deploy.**  
**Parent authorization:** [ADR-033](../18-decision-log/adr-033-member-operating-scope.md) Accepted — **CLOSED and successful**  
**Parent design:** [docs/127](../127-complete-delegated-operations/index.md) Approved  
**Authoritative Production release:** [docs/134](../134-complete-delegated-operations-production-release-certification/index.md) — **PRODUCTION RELEASE SUCCESSFUL** (cert branch; facts below are re-audited read-only against live Production)  
**Related:** [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md) · [ADR-019](../18-decision-log/adr-019-product-constitution.md) · [ADR-026](../18-decision-log/adr-026-authorization-hardening-pipeline.md) · ADR-031 (trusted application mutation architecture; accepted on PLAT-005; file may live on that package’s branch) · [ADR-032](../18-decision-log/adr-032-report-shape-and-post-auth-home.md) · PLAT-002 · PLAT-005 · PLAT-006 · COM-002 Tenant Communication Center (ADR-024 / `docs/80`) · FAC-003 · OPS-001 · [docs/126](../126-fin-ops-production-reconciliation-audit/index.md) (remains blocked)

---

## Verdict

**Approved.** Implementation of slices A, B, C, and E is authorized. Production apply and deploy remain separate Owner steps.

ADR-033 authorization is not reopened. The remaining work is the **normal customer invitation workflow**: create a Complete staff invitation and accept it so the resulting membership receives the **server-persisted** role and `operating_scope` without database or admin workarounds.

This record chooses:

1. **One transport contract:** keep Production `delivery_status` + `last_delivered_at`. Adapt the application. Do not add `email_status`. Do not rename or drop `delivery_status`.
2. **One accept trust boundary:** Option **B** — trusted Next.js server mutation with `service_role` after validating the session and the invitation. Optional `service_role`-only SQL function for atomicity. No new anon/authenticated SECURITY DEFINER RPC.
3. **No new ADR.** The authorization model, SKUs, roles, and entitlement keys stay as ADR-033 / ADR-026 / PLAT-005 already decided. This package is compatibility and mutation-path remediation.

**Product Owner must approve this record before any application code, migration, or Production change.**

---

## Binding constraints

| Must | Must not |
|------|----------|
| Preserve Erick BOTH / Sarah Property / Mike Facility | Redesign member operating scope, roles, SKUs, or entitlements |
| Create Sarah/Mike-class members through the invitation API | Allow arbitrary authenticated users to insert themselves into organizations |
| Bind accept to persisted invitation values | Trust browser-submitted role or `operating_scope` on accept |
| Keep business `status` separate from transport status | Claim inbox delivery confirmation Resend does not provide |
| Enforce last BOTH administrator in design | Run destructive last-BOTH UAT against existing Complete Gmail admins |
| Reuse team events + `organization_operating_scope_events` | Create a second audit system |
| Preserve PLAT-002 / PLAT-005 / PLAT-006 / COM-002 / FAC-003 / OPS-001 | Touch FIN-OPS, Stripe, billing, prices, or `financial_*` |

Identifier collision: **COM-002** in the regression list means **Tenant Communication Center** (ADR-024), not Self-Service Commercial (ADR-018 / `docs/37`).

---

## Production baseline (read-only audit, 2026-08-15)

| Layer | Value |
|-------|--------|
| Application SHA | `9b92db375dac75d469ed859134c629d46af536e8` |
| Database ledger tip | `20260815193129` / `adr_033_dataplane_member_scope` |
| Forbidden unused stamps | `20260815200000` and `20260815210000` remain **absent** (do not apply) |
| Target | `mpa-prod` / `vahnmcrpnuggxkivynvo` |
| SKUs | 1 Complete · 5 Property Manager · 0 Facility Operations |
| Complete UAT org | `a11ce001-0001-4000-8000-00000000c11c` |
| Controlled personas | Erick `organization_admin` + `both` · Sarah `property_manager` + `property_operations` · Mike `property_manager` + `facility_operations` |

This package does **not** modify those memberships, send invitations, reset passwords, or assign scopes.

---

## 1. Production mismatch audit

### 1.1 Defect 1 — invitation create / list contract

During docs/134 UAT, official invitation **create** failed because the application insert/select referenced columns Production does not have.

| Application (`invitation-service.ts`, generated types, Team UI, J2 admin, support resend) | Live Production `organization_invitations` |
|------------------------------------------------------------------------------------------|--------------------------------------------|
| `email_status` (`pending` \| `sent` \| `failed` \| `skipped`) | **absent** |
| `email_sent_at` | **absent** |
| `email_provider_id` | **absent** |
| `email_error` | **absent** |
| — | `delivery_status` (`NULL` or `pending` \| `sent` \| `failed`) |
| — | `last_delivered_at` |

Live Production also has invitation columns the current app does not write: `provisioned_user_id`, `username`, `activated_at`, `property_ids`. Leave them unused.

`operating_scope` is already live and is **not** part of Defect 1.

Create path today (`createAndSendInvitation`):

1. INSERT with `email_status: "pending"` and `operating_scope`.
2. SELECT the `email_*` columns.
3. Send via Resend when `RESEND_API_KEY` is set; otherwise treat as `skipped`.
4. UPDATE `email_status` / `email_provider_id` / `email_error` / `email_sent_at`.
5. Record `invitation.created` scope event when scope is present; emit team event/audit `invitation.created` / `invitation.sent`.

The INSERT fails at PostgREST schema cache on `email_status`. List GET and `getTeamReadiness` also SELECT `email_status` and are therefore broken on Production. Support resend UPDATEs `email_status` and would fail the same way. Support resend also **does not send mail** — it only resets columns and returns “Resend queued.”

### 1.2 Defect 2 — invitation accept membership RLS

Accept route: `POST /api/invitations/[token]/accept`  
Client: `createAuthServerClient()` — the **caller’s authenticated cookie session**, not `service_role`.

`acceptInvitation` then `upsert`s `organization_memberships` through that same PostgREST client.

Live INSERT policy `memberships_insert_authorized`:

```
has_org_capability(organization_id, 'membership:update')
OR organizations.created_by = auth.uid()
```

The invitee is not yet a member, so they do not have `membership:update`. They are not the organization creator. INSERT is denied. This matches the docs/134 UAT error.

The accept page POSTs **only the token**. It does not submit role or scope. That part of the security contract is already correct at the HTTP boundary. The failure is the membership mutation client.

### 1.3 Additional findings (in scope because they block a clean customer path)

| Finding | Evidence | Effect |
|---------|----------|--------|
| Invitee UPDATE is too broad | Live `invitations_update_authorized` allows `lower(email) = jwt email` with no column restriction | A signed-in invitee can PATCH `roles` / `operating_scope` / `organization_id` / `token` via PostgREST **before** accept. Trusted-server accept that later copies the row would honor the tamper. |
| Accept is not transactional | Membership upsert, then best-effort scope event, then invitation UPDATE | Partial state is possible once INSERT is fixed. |
| Last-BOTH helper ignores role demotion | `wouldLeaveCompleteWithoutBothAdmin` overrides scope/status only, not `roles` | PATCH that removes `organization_admin` from the last BOTH admin is not denied. |
| Accept upsert can overwrite an existing member | `onConflict: organization_id,user_id` | A pending invite for an existing last BOTH admin could replace `both` with a narrower scope. |
| Technician role CHECK drift | App writes `maintenance_technician`. Production CHECKs allow `facility_technician` only | Sarah/Mike (`property_manager`) are unaffected. Technician invites would fail after Defect 1 is fixed. Historical rows use `facility_technician` (2 memberships). |
| Token type is safe today | Production `token` is `uuid` default `gen_random_uuid()`. App INSERT does not send `token` | Do not later insert a 48-char hex token. Keep UUID generation. |
| Logged-out preview | `GET /api/invitations/[token]` uses the user client; RLS is capability or email match | Token possession alone does not SELECT the row. Preview works after sign-in as the invited email. |

### 1.4 What already works

- Create API **validation** already requires Complete staff invitations to choose an operational responsibility (`validateInviteOperatingScope` → `400 Choose an operational responsibility.`).
- Team UI already shows Role + Operational responsibility for Complete staff invites, with customer-facing labels.
- Single-product orgs hide the scope control; the server stores the implied SKU scope.
- Accept UI does not send role/scope.
- Unique pending invitation per `(organization_id, lower(email))`.
- Unique membership per `(organization_id, user_id)`.
- Invitation business `status` check: `pending` \| `accepted` \| `revoked` \| `expired`.

---

## 2. Invitation schema lineage

### 2.1 Repository (never reached Production)

`supabase/migrations/20260806080000_launch_001_j2_team_invites.sql` adds:

- `email_status` NOT NULL default `pending` CHECK (`pending`, `sent`, `failed`, `skipped`)
- `email_sent_at`, `email_provider_id`, `email_error`
- invitation/membership role CHECK including `maintenance_technician`

That stamp is **not** on the Production ledger. J2 application code and generated `packages/supabase/src/types.ts` were written against this intended overlay.

### 2.2 Live Production (authoritative)

`organization_invitations` columns, in order:

`id`, `organization_id`, `email`, `roles`, `invited_by`, `token` (uuid, unique, default `gen_random_uuid()`), `status`, `expires_at` (default now+7 days), `accepted_by`, `accepted_at`, `created_at`, `updated_at`, `provisioned_user_id`, `username`, `delivery_status`, `last_delivered_at`, `activated_at`, `property_ids`, `operating_scope`

`delivery_status` does **not** appear on `organization_invitations` in any current repo migration. Closest repo uses of the name are different tables (`communications` messages; `maintenance_notifications.email_delivery_status`). Invitation `delivery_status` is an **out-of-repo / earlier Production-compat** column.

### 2.3 Historical invitation rows (depend on `delivery_status`)

Live counts (7 rows):

| `status` | `delivery_status` | n |
|----------|-------------------|---|
| accepted | failed | 1 |
| accepted | pending | 3 |
| expired | failed | 1 |
| pending | NULL | 1 |
| revoked | failed | 1 |

No live invitation has `delivery_status = sent`. Values in use are `pending`, `failed`, and NULL. Dropping or renaming the column would break those rows and any future SELECT that names it.

`operating_scope` CHECK already matches ADR-033: NULL or `property_operations` \| `facility_operations` \| `both`.

---

## 3. `email_status` vs `delivery_status` decision

**Canonical transport field: Production `delivery_status`.**  
**Canonical transport timestamp: Production `last_delivered_at`.**  
**Canonical business field: existing `status` (unchanged).**

| Option | Action | Verdict |
|--------|--------|---------|
| Add `email_status` beside `delivery_status` | Two transport concepts | **Rejected** — user rule: do not create duplicate status concepts |
| Rename/drop `delivery_status` → `email_status` | DDL on a live column with 7 historical rows; still missing `email_provider_id` / `email_error`; CHECK would need `skipped` | **Rejected** — not compatibility-safe; not smallest |
| Apply never-landed J2 `20260806080000` as-is | Would add `email_status` and change role CHECKs without removing `delivery_status` | **Rejected** — duplicate transport + unrelated role rewrite |
| **Adapt the application to live columns** | Write/read `delivery_status` and `last_delivered_at` | **Chosen** |

### Mapping

| Application intent | Persist on Production | API / UI notice |
|--------------------|----------------------|-----------------|
| pending (not sent yet) | `delivery_status = pending`, `last_delivered_at` NULL | pending |
| Resend API accepted | `delivery_status = sent`, `last_delivered_at = now()` | sent |
| Resend API rejected | `delivery_status = failed` | failed |
| `RESEND_API_KEY` missing | `delivery_status = pending` (CHECK has no `skipped`) | computed `skipped` in JSON/notice only |
| Provider webhook “delivered” | **Do not write** | Do not claim delivered |

`email_provider_id` and `email_error` are **not** added in this package. Provider id already lands on team event/audit `invitation.sent`. Failure text stays in that audit payload and in the HTTP notice. Additive diagnostic columns may be designed later if operators cannot support invitations from existing events.

Do not extend `delivery_status` to `skipped` unless a later package proves the API cannot distinguish “not configured” without a persisted value.

---

## 4. Invitation create contract

### 4.1 Who may create

Next.js `POST /api/organizations/[organizationId]/invitations` remains the only customer create path.

1. Authenticated session.
2. `invitation:create` via `resolveAuthorizationContext` / `evaluatePermission` (PLAT-002 fail-closed).
3. Parse email + roles.
4. Resolve org SKU.
5. `validateInviteOperatingScope` — Complete staff **must** send an explicit scope; PM/FO staff get the implied SKU scope; portal roles get NULL scope.
6. **New (this package):** inviter grant cap — a member whose **effective** scope is not `both` must not persist `operating_scope = both` or a scope outside their own effective surfaces (docs/127 §6).
7. INSERT through the inviter’s authenticated client (they already pass `invitations_insert_authorized` / `invitation:create`).
8. Persist `delivery_status = pending` (not `email_status`).
9. Do not send `token` — let Production default `gen_random_uuid()`.
10. Send email if configured; UPDATE `delivery_status` / `last_delivered_at`.
11. Record `organization_operating_scope_events` reason `invitation.created` when a staff scope is stored.
12. Emit existing team event/audit `invitation.created` and, if sent, `invitation.sent`.

### 4.2 Request body (create only)

The inviter **is** allowed to choose role and operational responsibility. Those values are authorized by `invitation:create` plus the grant-cap rule, then **persisted on the invitation**. Accept must ignore any later client copy of them.

### 4.3 Duplicate pending email

Unique index `organization_invitations_pending_email_org_uidx` already forbids a second pending row for the same org + email. Create should return a clear 409 and point the admin at resend / copy link, not insert a duplicate.

### 4.4 Resend

Support resend (and any customer resend added later) must:

- load a **pending** invitation
- actually call the existing invitation email sender
- write `delivery_status` / `last_delivered_at` using the mapping in §3
- not invent a second mailer

### 4.5 List / Team UI

GET invitations and Team pending list read `delivery_status` (and may expose it as `emailStatus` in JSON for compatibility with the current panel). Display customer copy: “Email pending / sent / failed.” Map computed skipped → “Accept link available in Team (email not sent).”

---

## 5. Invitation acceptance trust boundary

### Options compared

| | A. Narrow RLS INSERT on a valid invitation | B. Trusted Next.js + `service_role` | C. SECURITY DEFINER accept RPC granted to `authenticated` / `anon` |
|--|--------------------------------------------|-------------------------------------|---------------------------------------------------------------------|
| Client | Invitee PostgREST | Existing accept route | Browser or server |
| Token check | RLS cannot see the URL token unless it is passed into SQL | Server reads token, then mutates | Function arg |
| Escalation risk | Easy to write “any pending invite for my email” and skip expiry/org/status; invitee UPDATE already lets them rewrite the row | Server copies persisted values after re-read | Same as A if callable from the browser; fights PLAT-005 |
| PLAT-005 | Widens client mutation surface | No new client-callable privileged RPC | New privileged RPC exposure |
| Existing pattern | No invitee-self-insert policy has ever existed in repo or Production | `service_role` already used for provisioning, portal access, claim-password, support resend, Stripe webhooks | PLAT-005 removed unnecessary client EXECUTE on privileged RPCs |
| Atomicity | Still multi-statement from the client | Server can call a **service_role-only** function | Native transaction |

**Decision: B.**

Optional implementation detail under B: one `SECURITY DEFINER` function **revoked from `anon` and `authenticated`**, executable only by `service_role`, that performs membership upsert + invitation accept + single `invitation.accepted` scope event in one transaction. That is not Option C. It does not restore client-callable privileged RPC surface.

### Why not A

Invitation possession must not become a generic membership INSERT bypass. An RLS policy keyed only on “a pending invitation exists for `auth.email()`” lets any signed-in user insert a membership for that org without the accept route’s expiry, token, and status checks — and without writing `accepted_by`. Token is not in the JWT. Encoding the token into RLS requires a helper the browser can also call. That is a larger, easier-to-get-wrong surface than the existing Next.js route.

### Why not C (client-callable)

PLAT-005 intentionally removed client execution from privileged RPCs. An accept RPC granted to `authenticated` would reintroduce that class of exposure. If the RPC is granted only to `service_role`, it collapses to B.

---

## 6. Membership RLS analysis

### 6.1 Live policies (`organization_memberships`)

| Policy | Command | Rule |
|--------|---------|------|
| `memberships_select_self_or_authorized` | SELECT | `user_id = auth.uid()` OR `membership:read` |
| `memberships_insert_authorized` | INSERT | `membership:update` OR org `created_by = auth.uid()` |
| `memberships_update_authorized` | UPDATE | `membership:update` |
| `memberships_delete_authorized` | DELETE | `membership:update` |

There is **no** invitee-self-insert policy on Production. Repo history (`20260714010000` creator-or-manager, then `20260714040000` / PLAT-002 capability rename) never granted “valid invitation ⇒ INSERT.” Accept has always been RLS-fragile unless the actor already had `membership:update`.

### 6.2 Live invitation policies

| Policy | Command | Rule |
|--------|---------|------|
| `invitations_insert_authorized` | INSERT | `invitation:create` |
| `invitations_select_authorized` | SELECT | `invitation:read` OR jwt email matches row email |
| `invitations_update_authorized` | UPDATE | `invitation:create` OR jwt email matches row email (USING **and** WITH CHECK) |

Invitee SELECT-by-email is appropriate for post-login preview. Invitee UPDATE is **not** appropriate (see §1.3 and §7).

### 6.3 Scope events

INSERT policy `operating_scope_events_insert_manager` requires `is_org_manager(organization_id)`. The invitee is not a manager at accept time. Current accept already swallows scope-event failure. Under B, the trusted client writes the event so accept audit is not best-effort.

### 6.4 What B changes about RLS

- **Do not** add an invitee INSERT policy on `organization_memberships`.
- **Do** remove email-match from invitation UPDATE (admin/`invitation:create` remains). Accept marks the row via `service_role`.
- Membership INSERT/UPDATE/DELETE policies stay fail-closed for interactive clients.
- No change to PLAT-002 capability names.

---

## 7. Role + `operating_scope` security contract

A successful Complete invitation binds **all** of:

| Bind | Source of truth |
|------|-----------------|
| Organization | Invitation `organization_id` |
| Email / user | Invitation `email` must equal authenticated user email (case-insensitive). `accepted_by` = that user id |
| Role | Invitation `roles` as persisted at create (or admin edit of a **pending** invite) |
| Operating scope | Invitation `operating_scope` as persisted |
| Business status | Must be `pending` at the start of accept; becomes `accepted` in the same trusted transaction |
| Expiration | `expires_at` > now() |
| Token | URL token matches unique `token` |

### 7.1 Accept must not trust the browser

`POST /api/invitations/[token]/accept` remains body-less (or ignores body). Role and scope come only from the invitation row **re-read inside the trusted mutation** after token + email + status + expiry checks.

Forbidden escalations (must fail even if the client sends them):

- `property_operations` → `both`
- `facility_operations` → `both`
- `property_manager` → `organization_admin`
- organization swap
- email swap onto another identity

### 7.2 Close the invitee UPDATE hole

Remove jwt-email from `invitations_update_authorized`. Otherwise §7.1 is theater: the invitee rewrites the persisted row, then the server copies it.

Admin edit of a **pending** invitation (role/scope) remains allowed for actors with `invitation:create`, and is audited (`invitation.updated` team event + scope event when scope changes). That is the only legitimate change path after create.

### 7.3 Inviter grant cap (create / admin edit)

From docs/127 §6, not new product policy:

| Inviter effective scope | May persist on invitation |
|-------------------------|---------------------------|
| `both` | `property_operations`, `facility_operations`, `both` (role still constrained by `roleAllowsOperatingScope`) |
| `property_operations` | `property_operations` only |
| `facility_operations` | `facility_operations` only |

A scoped admin must not mint a BOTH member or the other half. This is evaluated on the **server** from the inviter’s membership, not from the request’s self-description.

### 7.4 Technician compatibility (not a new role)

Do **not** add `facility_manager`. Do **not** revive `facility_technician` as a `USER_ROLES` value (docs/127 forbids that).

After Defect 1 is fixed, technician invites would fail the live CHECK. Smallest safe DDL (separate slice, Owner-authorized later): **widen** invitation and membership role CHECKs to allow `maintenance_technician` **in addition to** existing `facility_technician`. Do not rewrite the two historical `facility_technician` memberships in this package.

Sarah/Mike (`property_manager`) do not depend on that widen.

---

## 8. Complete invitation UX

Customer-facing Team / invitation UI (already largely present in `team-invite-panel.tsx`):

**Role**

- Organization Admin
- Property Manager (customer copy may read “Manager” where `toInviteRoleLabel` already does)
- Leasing Agent
- Maintenance Technician / Facility Technician label by SKU (`toInviteRoleLabel`)
- Vendor
- Owner

**Operational responsibility** (Complete staff invites only)

- Property Operations
- Facility Operations
- Both

Do **not** expose SKU keys, RBAC capability keys, entitlement internals, or `work_surface`.

### Mapping (no new roles)

| Customer choice | Persist |
|-----------------|---------|
| Property Operations Manager | `property_manager` + `property_operations` |
| Facility Operations Manager | `property_manager` + `facility_operations` |
| Operations Manager (Both) | `property_manager` + `both` |
| Organization Admin + Both | `organization_admin` + `both` |
| Organization Admin + one half | `organization_admin` + that half, **only if** a BOTH admin remains after the invite is accepted (invite itself does not remove anyone; last-BOTH applies if accept would overwrite an existing admin — §11) |
| Leasing Agent | `leasing_agent` + `property_operations` only |

Copy already states that operational responsibility does not change the subscription.

---

## 9. Single-product compatibility

| SKU | Scope control | Server-stored scope |
|-----|---------------|---------------------|
| Property Manager | Hidden | `property_operations` |
| Facility Operations | Hidden | `facility_operations` |
| Complete | Required for new staff invites | Explicit choice |

SKU remains the outer bound (`effectiveSurfaces` ignores stored scope on non-Complete). Stored `both` on a PM org must not unlock Facility. FO SKU + stored `both` remains helper-certified (0 live FO subscriptions). This package does not create an FO subscription.

Portal invites (vendor / owner / tenant) continue to store NULL `operating_scope`.

---

## 10. Idempotency and concurrency

Accept is a state machine, not a blind upsert.

```
load invitation by token (service_role)
  missing token                         → 404
  status = revoked                      → 410 / 409 “revoked”
  status = expired OR expires_at < now  → 410
  status = accepted
      AND accepted_by = caller
      AND membership exists             → 200 idempotent (no new membership, no new scope event)
  status = accepted AND other user      → 409
  status = pending AND email mismatch   → 403 “Sign in with the invited email”
  status = pending AND email match      → enter accept transaction
```

### 10.1 Accept transaction (trusted)

1. Lock or conditional-update the invitation: `UPDATE … SET status = 'accepted', accepted_by, accepted_at WHERE id = $id AND status = 'pending' RETURNING *`. Zero rows → another worker won; re-read and follow the idempotent accepted path.
2. Re-validate email, expiry, org, roles, `operating_scope` from the **returned** row (pre-tamper values if UPDATE policy is tightened first).
3. Membership:
   - **No row:** INSERT `roles` + `operating_scope` from the invitation. `status = active`.
   - **Active row, same roles + scope:** no write. Do not insert a second membership (unique `(organization_id, user_id)` already prevents this).
   - **Active row, different roles/scope:** apply invitation values only if §11 last-BOTH still holds; otherwise 409 and **roll back** the invitation accept (or do the membership check **before** the status flip — preferred).
   - **Inactive row:** reactivate with invitation values, same last-BOTH check.
4. Insert **one** `organization_operating_scope_events` row with reason `invitation.accepted` for this `invitation_id` if and only if this transaction is the first successful accept of that invitation. Dedup key in application: skip if an `invitation.accepted` event already exists for that `invitation_id`. (No second audit table. Optional unique index on `(invitation_id, reason)` where reason = `invitation.accepted` may be added in the implement slice if Owner wants a DB guarantee.)
5. Team event/audit `invitation.accepted` once.

### 10.2 Recoverable partial state

If a future bug leaves **membership present + invitation still pending**, retry is the recovery path: the state machine sees the membership, completes the invitation accept, and does not create a duplicate member or a duplicate `invitation.accepted` event.

Do not treat that partial state as success in the first response. The trusted transaction should make it rare.

### 10.3 Other cases

| Case | Behavior |
|------|----------|
| Double click / browser retry | First transaction wins; second is 200 idempotent |
| Email-link retry after success | 200 idempotent |
| Concurrent accepts | Conditional `status = pending` update serializes |
| Already a member, new pending invite, same grant | Accept marks invite accepted; no duplicate event |
| Already a member, new pending invite, **escalating** grant | Only if inviter was authorized at create **and** last-BOTH holds; otherwise 409 — admin uses Team PATCH |
| Wrong signed-in email | 403; no mutation |
| Expired / revoked | No membership write |

---

## 11. Last-BOTH-admin enforcement

ADR-033 / docs/127: a Complete organization must retain at least one **active** `organization_admin` whose **effective** operating scope is `both`. NULL stored scope still counts as BOTH via compatibility. This package does **not** mutate the existing Complete Gmail admins and does **not** run destructive live denial against them.

### 11.1 Operations that must run the helper

| Operation | Today | This design |
|-----------|-------|-------------|
| Membership PATCH scope | Yes | Keep |
| Membership PATCH status → inactive | Yes (via `nextStatus`) | Keep |
| Membership PATCH roles (demote last admin) | **No** — helper ignores `nextRoles` | **Extend helper** with `nextRoles` |
| Membership DELETE / remove | No customer DELETE route; RLS allows `membership:update` | Any future remove API must call the helper as “target no longer present.” Do not add a customer DELETE in this package unless Team already needs it; if added, last-BOTH is mandatory. |
| Invitation create | N/A (does not remove anyone) | No last-BOTH denial on create of an *additional* scoped member |
| Invitation accept overwrite of existing member | No | **Must** run helper on the post-accept membership set |
| Admin / billing transfer | Contract: BOTH admins only (docs/127) | Out of code scope here except: do not weaken; any transfer API touched later must require a remaining BOTH admin |

### 11.2 Safe test strategy (later implementation UAT — not this package)

Use the **controlled UAT personas** (Erick additional BOTH) or a disposable Complete UAT org. Do **not** demote or delete the existing Gmail Complete admins.

Prove:

- Erick can be scoped to Property while a compatibility-BOTH Gmail admin remains (already shown in docs/134; do not repeat as a destructive test).
- On a disposable org with a single stored-BOTH admin: scope change, role demotion, and inactivation are **denied**.
- Adding Sarah/Mike via invitation does not require touching those Gmail rows.

---

## 12. Audit and event behavior

Reuse only:

1. `organization_operating_scope_events` (ADR-033) — `invitation.created`, `invitation.accepted`, `membership.updated`, and admin `invitation.updated` when pending scope changes.
2. Existing team events + team audit (`invitation.created`, `invitation.sent`, `invitation.accepted`, support `invitation.resend`).

A support or admin investigator must be able to answer:

| Question | Where |
|----------|-------|
| Who invited | `organization_invitations.invited_by` + team audit `invitation.created` |
| Organization | `organization_id` |
| Requested role | invitation `roles` |
| Requested scope | invitation `operating_scope` + `invitation.created` event |
| When sent | invitation `created_at` / `last_delivered_at` + `invitation.sent` |
| Transport state | `delivery_status` (sent = provider accepted the send, not inbox confirmation) |
| When accepted | `accepted_at` + `invitation.accepted` |
| Resulting membership | unique `(organization_id, user_id)` |
| Resulting scope | membership `operating_scope` + `invitation.accepted` event |
| Who later changed scope | `organization_operating_scope_events` `membership.updated` + actor |

Do not add a parallel audit table. Do not log secrets or raw tokens in event payloads.

---

## 13. Email delivery

Existing mechanism: `sendInvitationEmail` in `@mpa/email` via Resend when `RESEND_API_KEY` is set. **Do not redesign the mailer.**

| Lifecycle | Field |
|-----------|-------|
| Business | `status`: pending → accepted \| revoked \| expired |
| Transport | `delivery_status`: pending → sent \| failed |
| Computed only | skipped (no API key) |

Resend’s send API success means the provider **accepted** the message. This package must not display “delivered to inbox” unless a later package integrates Resend delivery webhooks (out of scope).

Failed send still leaves a pending invitation and an in-app accept link for the inviter (current Team “copy accept link” behavior). That is the support path when mail fails.

---

## 14. Rollback strategy

| Slice | Rollback |
|-------|----------|
| Application adapt to `delivery_status` | Revert the app deploy. Historical `delivery_status` values remain valid. No down-migration required. |
| Invitation UPDATE policy tighten | Restore email-match UPDATE only if a documented accept path still needs it (it should not, after B). |
| `service_role` accept | Revert app. Memberships created while live remain valid rows. Re-invite is the customer recovery. |
| Optional service_role-only accept function | `REVOKE` / drop function. No client GRANT to unwind. |
| Additive `maintenance_technician` CHECK | Leave the widened CHECK (safe). Do not shrink it if any new row uses the value. |
| Failed accept transaction | Conditional update means invitation stays `pending`; no orphan “accepted” without membership if membership is written in the same transaction. |

Do not roll back ADR-033 dataplane (`20260815193129`). Do not apply or revert `20260815200000` / `20260815210000`.

---

## 15. Implementation slices (after Approve only)

Nothing below is authorized until Product Owner approval.

| Slice | Intent | Touches | Production DDL? |
|-------|--------|---------|-----------------|
| **A** | Transport contract | `invitation-service.ts`, invitations GET/POST, support resend (actually send), J2 admin reads, Team panel field name, types usage | **No** — app only |
| **B** | Trusted accept + close invitee UPDATE | Accept route/service, `createServiceRoleClient`, invitation UPDATE policy migration, optional service_role-only function | **Yes** — RLS (and optional function). Separate Owner apply. |
| **C** | Last-BOTH + grant cap + accept overwrite | `wouldLeaveCompleteWithoutBothAdmin` + memberships PATCH + create validation + accept state machine | App; no finance/Stripe |
| **D** | Technician CHECK widen + UX polish | Additive role CHECK; labels only | **Yes** — additive CHECK only. Not required for Sarah/Mike. |
| **E** | Automated tests | Shared helpers, invitation service mocks, accept state machine, grant cap | No |

Suggested first implement authorization after Approve: **A + B + C + E**. Slice D is compatible follow-on so technician invites do not become the next Production incident.

Ledger: any Production DDL uses a **new** stamp after `20260815193129`. Do not reuse the unused `20260815200000` / `20260815210000` filenames.

---

## 16. Automated test matrix (implement slice)

| ID | Case | Expect |
|----|------|--------|
| T1 | Create Complete staff invite without scope | 400 |
| T2 | Create Complete Sarah-shaped invite | INSERT uses `delivery_status`, stores `property_manager` + `property_operations` |
| T3 | Create Complete Mike-shaped invite | `property_manager` + `facility_operations` |
| T4 | Create on PM SKU | No scope control required; stored `property_operations` |
| T5 | Create on FO SKU | Stored `facility_operations` |
| T6 | Missing Resend key | Persist `pending`; API notice skipped |
| T7 | Resend success | Persist `sent` + `last_delivered_at`; event `invitation.sent` |
| T8 | Duplicate pending email | 409 |
| T9 | Accept happy path | Membership + invitation accepted + one `invitation.accepted` event; values from invitation row |
| T10 | Accept with forged body role/scope | Ignored; persisted invitation wins |
| T11 | Accept wrong email | 403; no membership |
| T12 | Accept expired / revoked | 410/409; no membership |
| T13 | Double accept | 200; one membership; one accept event |
| T14 | Concurrent accept | One winner; other idempotent |
| T15 | Existing matching membership | Idempotent accept |
| T16 | Existing last BOTH admin + narrower invite | 409; BOTH remains |
| T17 | Invitee PostgREST UPDATE of `operating_scope` | Denied after policy tighten |
| T18 | Invitee PostgREST INSERT membership | Denied (no new INSERT policy) |
| T19 | Scoped inviter grants `both` | 403/400 |
| T20 | PATCH last BOTH admin role away from `organization_admin` | 400 |
| T21 | PATCH last BOTH admin scope to Property | 400 |
| T22 | PATCH additional BOTH admin to Property while another BOTH remains | 200 |
| T23 | Facility-only member still denied tenant comms (COM-002) | Unchanged 403 |
| T24 | Property-only member still denied FAC-003 | Unchanged 403 |
| T25 | PLAT-002 fail-closed + PLAT-006 shape isolation + OPS-001 source entitlements | Regression fixtures unchanged |
| T26 | No `financial_*` / Stripe / SKU writes in the diff | Static / review |

---

## 17. Later Production UAT matrix (not this package)

Run only after Approve → Implement → Owner-authorized deploy. Do **not** perform these steps in the design package.

| U | Case | Notes |
|---|------|-------|
| U1 | Complete admin creates Sarah-shaped invite via Team UI | Real create API; no SQL insert |
| U2 | Complete admin creates Mike-shaped invite | Same |
| U3 | Email `delivery_status` pending → sent or failed | Copy-link fallback if failed |
| U4 | Invitee signs in as invited email and accepts | Membership appears with persisted scope |
| U5 | Wrong-email accept | Denied |
| U6 | Retry accept | Idempotent |
| U7 | List Team shows role + operational responsibility labels only | No SKU/capability keys |
| U8 | PM org invite | No scope picker; PM SKU outer bound holds |
| U9 | Last-BOTH denial on a **disposable** Complete org | Not against existing Gmail admins |
| U10 | Regression spot-check Erick/Sarah/Mike authorization | Do not recreate them via SQL if U1–U4 already produced equivalents; do not reset passwords in design |

Do not send invitations to real external customers during the first UAT pass unless the Owner names the inboxes.

---

## 18. Out of scope

- Any application, UI, migration, or Production SQL from this record
- Redesign of ADR-033 authorization, SKUs, roles, or entitlement keys
- Adding `facility_manager`
- Reviving `facility_technician` as a `USER_ROLES` value
- Renaming or dropping Production `delivery_status`
- Adding `email_status` / `email_provider_id` / `email_error`
- New anon/authenticated SECURITY DEFINER RPC
- Client-side membership INSERT policy
- Resend delivery webhooks / inbox confirmation
- Destructive last-BOTH test on existing Complete Gmail admins
- Password resets; Production membership or scope mutations
- Sending real invitations from this design package
- Guided Setup rewrite (already shipped; primary admin stays BOTH)
- Admin billing-transfer product redesign (contract unchanged)
- FO paid subscription creation
- docs/126 FIN-OPS: no `financial_charges`, no `financial_*` schema, no S0/S1/S2 replay, no July finance migration, no finance RLS, no `pm.finance:*` grant changes, no Stripe/billing
- Commercial: no Complete / Property Manager / Facility Operations price, product, subscription, or SKU change
- Operating scope is **not** a billable product

---

## 19. Approve gate

### Why no new ADR

| Question | Answer |
|----------|--------|
| Does this change the authorization formula? | No. ADR-033 (`SKU ∩ scope ∩ role ∩ action`) stays closed. |
| Does this add a SKU, role, or entitlement key? | No. |
| Does this change who may call privileged RPCs from the browser? | No. PLAT-005 remains: no new client-callable privileged RPC. |
| Is trusted-server mutation new architecture? | No. It applies ADR-026 fail-closed + ADR-031 trusted Next.js mutation (already used for provisioning, portal access, commerce claim, finance webhooks). |
| Is `delivery_status` a new domain concept? | No. It is the live Production transport column. The app is wrong, not the architecture. |

A new ADR would be required only if Owner later rejected B and chose a client-callable accept RPC or a generic invitee membership INSERT policy. Those alternatives are rejected here.

### Approval checklist

Product Owner approves that:

1. Application will adopt `delivery_status` / `last_delivered_at` (not `email_status`).
2. Accept will be a trusted Next.js / `service_role` mutation (Option B).
3. Invitee UPDATE on invitations will be removed.
4. Accept copies only persisted invitation role and scope.
5. Last-BOTH extends to role demotion and accept overwrite; live destructive test stays deferred.
6. Implementation waits for an explicit Approve of **this** record.
7. FIN-OPS and commercial hard stops remain in force.

### After approval

Implement only the approved slices. Material changes restart Design → Document → Approve.

---

## Final verdict

**Approved.** Implementation of slices A, B, C, and E is authorized. Production apply and deploy remain separate Owner steps.
