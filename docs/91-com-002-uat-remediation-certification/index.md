# COM-002 UAT REMEDIATION CERTIFICATION

**Title:** COM-002 UAT REMEDIATION CERTIFICATION  
**Status:** READY FOR UAT RE-RUN  
**Date:** 2026-08-14  
**Recorded at:** 2026-08-14T03:12:00Z  
**Prior blocked UAT:** PR #197 · `docs/90-com-002-authenticated-production-uat-certification`  
**Remediation PR:** #198 · `cursor/com-002-uat-remediation-b7a1`  
**Approved design:** [docs/80](../80-com-002-tenant-communication-center/index.md) · [ADR-024](../18-decision-log/adr-024-com-002-tenant-communication-center.md)  
**Production alias:** `www.my-property-assistant.com`  
**UAT org:** M.P.A. UAT Property Demo (`a11ce002-0001-4000-8000-0000000000c2`)  
**Prod schema ledger:** `20260814030010` / `com_002_uat_remediation` (applied on `mpa-prod` / `vahnmcrpnuggxkivynvo`)  
**Application / Stripe / billing / commercial flow:** **Unchanged by this certification** (app remediations are in PR #198; not yet Production-deployed)

Identifier note: COM-002 Tenant Communication Center (ADR-024 / docs/80), not Self-Service Commercial.

---

## Final verdict

**READY FOR UAT RE-RUN**

Both UAT blockers from the blocked authenticated production UAT are remediated without changing ADR-024 architecture, messaging features, billing, Stripe, commercial flow, or FO tenant messaging.

Re-run the authenticated UAT after PR #198 is deployed so the tenant Notification Center bell and `read_at` UI path can be exercised on Production. Schema blocker 1 is already live on `mpa-prod`.

Stop here. This record does not authorize a Production application deploy and does not certify **PRODUCTION RELEASE SUCCESSFUL**.

---

## What was wrong

| Blocker | Root cause | Why UAT failed |
|---------|------------|----------------|
| 1. Tenant audit RLS | `audit_events` insert was manager-only (`is_org_manager`). Tenant send inserted the message, then `writePropertyAudit` threw. | UI showed `new row violates row-level security policy for table "audit_events"`. Retry created a duplicate message. `notifyCounterparty` never ran on tenant reply. Same error on tenant work-order create after the WO row persisted. |
| 2. Notification Center | Tenant reply never reached notify (blocker 1). Tenant portal had no bell. Notifications GET/PATCH required `platform.communications:read` (tenant **403**). Opening a thread updated participant `last_read_at` only. **Open** closed the popover and did not set `read_at`. | PM Notifications showed empty. Tenant had no Notifications control. All UAT `comms_notifications.read_at` stayed null. |
| Duplicate send | Accidental, not a second product feature. Failed audit after a successful insert caused the client to retry the same body with a new insert. | Two identical tenant replies (`Received, thank you.`). |

On Production, `event_domain_events` already allowed org-member insert (`event_domain_events_insert_member` from FO enablement). Repo migrations still had manager-only event insert; the additive tenant policy is included for both tables so local/prod stay aligned. Manager insert policies were not replaced.

---

## What changed (approved bug-fix scope only)

### Schema (additive RLS)

`supabase/migrations/20260814030000_com_002_uat_remediation.sql`

Second INSERT policies (Postgres ORs policies):

- `audit_events_insert_self_tenant`
- `event_domain_events_insert_self_tenant`

Constraints:

- `to authenticated` only
- `actor_id = auth.uid()`
- `is_org_member(organization_id)`
- active membership with `'tenant' = any(roles)`
- allowlisted `entity_type` / `aggregate_type`: `comms_conversations`, `maintenance_work_orders`, `pm_residents`, `property_properties`

Preserved:

- `audit_events_insert_manager`
- existing event insert policy
- no public / anon insert
- no broad authenticated insert
- organization isolation

Applied to `mpa-prod` as ledger `20260814030010` / `com_002_uat_remediation`.

### Application (PR #198 — deploy required for tenant bell / read UI)

- Notifications GET/PATCH use `requireNotificationCenterActor`: staff with `communications:read` **or** tenant conversation actor. FO without those still **403**.
- Resident portal header shows Notification Center; inbox link is `/portal/tenant/messages`.
- `markConversationRead` also sets `comms_notifications.read_at` for that conversation + user.
- Notification **Open** marks the row read, then navigates.
- Conversation send (and staff start) reuse one `idempotencyKey` for the in-flight attempt. Server already short-circuits on that key. History is not rewritten.

---

## Live verification (2026-08-14)

Controlled internal UAT accounts only. Passwords are not stored in this blueprint.

| Actor | Email | Role |
|-------|-------|------|
| Property Manager | `uat.pm.property.demo@my-property-assistant.com` | `property_manager` |
| Tenant | `uat.tenant.property.demo@my-property-assistant.com` | `tenant` |
| FO (security only) | `uat.fo.property.demo@my-property-assistant.com` | `facility_technician` |

### Blocker 1 — tenant audit authorization

REST probes as signed-in JWTs against `https://vahnmcrpnuggxkivynvo.supabase.co`:

| Case | Result |
|------|--------|
| Tenant insert `audit_events` self-actor + `comms_conversations` | **201** |
| Tenant insert `organization_subscriptions` (not allowlisted) | **403** |
| Tenant insert with PM `actor_id` (spoof) | **403** |
| Tenant insert other `organization_id` | **403** |
| FO insert `comms_conversations` | **403** |
| Anonymous insert | **401** |
| PM insert (manager policy unchanged) | **201** |

Probe-only audit rows were deleted after the check. Existing manager/staff audit behavior is unchanged.

Production UI (current deploy, schema already applied):

| Check | Result |
|-------|--------|
| Tenant reply on `COM-002 UAT thread` | **PASS** — no `audit_events` RLS error |
| Message persisted | `b22fb15d-91fb-4f1d-b7bc-fbb350b474e9` · body `COM-002 remediation tenant reply — audit should succeed.` |
| Tenant audit created | `e03d28b0-6a3c-4e18-81b7-259fc676d53e` · `conversation.message.sent` · actor tenant · `message_id` = that send |
| Tenant `conversation.read` audit | `cd6f1c37-8202-48c4-9fc0-8bf81f722d9b` (open thread after send) |

### Blocker 2 — Notification Center

| Check | Result |
|-------|--------|
| Tenant reply writes `comms_notifications` for PM | **PASS** · `f06e47bf-4e29-424b-af05-9b0420025ce5` · `user_id` PM · `href` `/shared/communications/conversations/d409029d-bcbe-4725-9f67-41b37e1e9f28` · key `conversation.message.sent:b22fb15d-…:0e1fc6e4-…` |
| PM bell / count | **PASS** on current Production — Notifications badge **1** |
| PM Open deep-link | **PASS** — opens the same thread |
| Tenant rows from earlier PM sends | Still present with thread hrefs under `/portal/tenant/messages/{id}` |
| Tenant bell on current Production | **Not present** — expected until PR #198 deploys |
| `read_at` after PM Open on current Production | Still **null** — expected until PR #198 deploys (`markConversationRead` + Open mark-read) |

Unit / route tests in PR #198 cover tenant GET/PATCH, FO deny, staff list, and `read_at` when a thread is marked read.

### Duplicate send

| Check | Result |
|-------|--------|
| Root cause | Audit throw after insert + UI retry without a stable key |
| Live send after RLS fix | One tenant remediation message; no duplicate |
| Server idempotency | Unchanged short-circuit on `idempotency_key` |
| UI key | PR #198 generates one UUID per in-flight send/start and reuses it on retry |
| History rewrite | None |

### Requested journey regression

| Journey | Result |
|---------|--------|
| PM → Tenant message | Prior UAT **PASS**; tenant notification rows remain |
| Tenant → PM reply | **PASS** on Production after schema fix (this record) |
| Attachment message | Prior UAT **PASS**; media `78a3b1d2-01f6-4a61-b5fb-e1226b3f528b` still `ready`; not re-broken |
| Work-order linked message | Prior UAT **PASS**; conversation `5dec0c8c-393a-4a65-8434-439691e53938` still `linked_entity_type=work_order` |
| Notification open/read | Create + PM deep-link **PASS** live; tenant bell + `read_at` require PR #198 deploy |
| Audit creation | Tenant actor **PASS** live |

### Security regression

| Check | Result |
|-------|--------|
| Tenant isolation | Tenant JWT lists only the two UAT conversations for this resident |
| PM property access | PM JWT lists the same two UAT conversations only |
| FO denial | FO JWT `comms_conversations` = `[]`; FO audit insert **403**; FO still has no tenant messaging |
| RLS not weakened | Disallowed entity / spoof actor / cross-org / anon all denied |

---

## Constraints held

- No redesign
- No new messaging features
- No billing / Stripe / commercial changes
- No FO tenant messaging
- ADR-024 Notification Center remains alerts that point at threads (not a fourth inbox)
- Implementation Gate: bug fix of approved COM-002; no new architecture pattern

---

## UAT re-run checklist

Deploy PR #198, then re-run authenticated UAT on the same internal org:

1. PM sends a message — tenant bell/count appears; Open opens `/portal/tenant/messages/{id}`; `read_at` set.
2. Tenant replies — no audit RLS error; no duplicate; PM bell/count; Open opens the staff thread; `read_at` set.
3. Attachment and work-order-linked send still work.
4. FO still denied.
5. Re-issue authenticated UAT certification as **PRODUCTION RELEASE SUCCESSFUL** or remain **BLOCKED**.

---

## Unchanged / out of scope

- Stripe, billing, Confirm Plan, product packaging
- Facility Operations tenant messaging
- Legacy `properties` / `units` dual-FK shadow rows for residential WO create (noted in the blocked UAT; not part of this remediation)
- Production application deploy
