# COM-002 PRODUCTION MIGRATION CERTIFICATION

**Title:** COM-002 PRODUCTION MIGRATION CERTIFICATION  
**Status:** READY FOR DEPLOYMENT  
**Date:** 2026-08-14  
**Project:** `mpa-prod` (`vahnmcrpnuggxkivynvo`)  
**Approved:** [docs/83](../83-com-002-production-compatibility-package/index.md) · [ADR-025](../18-decision-log/adr-025-com-002-production-compatibility.md) · [docs/84](../84-com-002-production-compatibility-implementation-certification/index.md) · ADR-024 / docs/80 (PR #188)  
**Application deploy:** **NOT PERFORMED**  
**Billing / Stripe / commercial flow:** **Unchanged**

Identifier note: COM-002 Tenant Communication Center (ADR-024), not Self-Service Commercial.

---

## Final verdict

**READY FOR DEPLOYMENT**

M1 and M2 are on `mpa-prod`. Legacy communication and tenant/property row counts are unchanged. Security policies are active. **Do not deploy from this record** — deploy remains a separate authorization.

---

## 1. M1 apply

| Field | Value |
|-------|--------|
| File | `supabase/migrations/20260814005000_com_002_prod_compat_prerequisites.sql` |
| Production ledger | `20260814012322` / `com_002_prod_compat_prerequisites` |
| First attempt | **FAILED** — `role_permission_grants_role_check` rejects `maintenance_technician` (prod allows `facility_technician`) |
| Applied | **SUCCESS** — same approved objects; omitted only the invalid `maintenance_technician` capability grant |
| Repo file | **Unchanged** (no application code change) |

### Objects after M1

| Object | Result |
|--------|--------|
| `lease_residents` | Created — 0 rows |
| `is_lease_resident()` | Created — MD5 `64cfcda94f3a9b5039176394d5c4cacf` |
| `comms_messages` | Created — 0 rows |
| `comms_notifications` | Created — 0 rows; no `conversation_id` yet |
| Indexes | `lease_residents_user_idx`, `comms_messages_org_created_idx`, `comms_messages_recipient_idx`, `comms_notifications_user_idx` |
| `platform.communications:read/write` | Inserted |
| `is_org_member` / `is_org_manager` | Unchanged — MD5 `3754c4e0…` / `b8e7b358…` |

M1 RLS matched docs/84 / docs/83 (`lease_residents_select`, `lease_residents_manage_manager`, notices select/insert/update policies).

---

## 2. M2 apply

| Field | Value |
|-------|--------|
| File | `supabase/migrations/20260814010000_com_002_tenant_communication_center.sql` (PR #188) |
| Production ledger | `20260814012357` / `com_002_tenant_communication_center` |
| Result | **SUCCESS** — applied as approved |

| Object | Result |
|--------|--------|
| `comms_conversations` | Created — 0 rows · RLS on |
| `comms_conversation_participants` | Created — 0 rows · RLS on |
| `comms_conversation_messages` | Created — 0 rows · RLS on |
| `comms_message_reads` | Created — 0 rows · RLS on |
| `is_pm_staff()` | Created |
| `can_access_tenant_conversation()` | Created |
| `comms_notifications.conversation_id` | Added (nullable FK) |
| MEDIA-001 `related_entity_type` | Widened with `conversation_message` |
| `media_attachments_select_member` | Conversation-aware select policy |

Conversation RLS present: `comms_conversations_select` / `insert_staff` / `update_staff`, `comms_participants_select` / `write`, `comms_thread_messages_select` / `insert` / `update_staff`, `comms_message_reads_select` / `insert`.

---

## 3. Database validation

Pre-apply vs post-M2 (identical):

| Table | Before | After |
|-------|--------|-------|
| `conversation_threads` | 3 | 3 |
| `communication_messages` | 2 | 2 |
| `conversation_participants` | 2 | 2 |
| `message_read_receipts` | 0 | 0 |
| `in_app_notifications` | 19 | 19 |
| `tenants` | 35 | 35 |
| `leases` | 18 | 18 |
| `pm_residents` | 0 | 0 |
| `lease_agreements` | 0 | 0 |
| `property_properties` | 8 | 8 |
| `media_attachments` | 7 | 7 |
| `organizations` | 20 | 20 |

| Check | Result |
|-------|--------|
| Destructive changes | **None** |
| Legacy communication untouched | **PASS** |
| Tenant/property data unchanged | **PASS** |
| `lease_agreements` RLS unchanged | **PASS** — still `is_org_member` / `is_leasing_writer` |
| New conversation tables empty | **PASS** — no backfill |
| FO tenant inbox objects | **Not created** |

---

## 4. Security checks

| Check | Result |
|-------|--------|
| RLS enabled on M1 + M2 tables | **PASS** |
| Tenant access via `can_access_tenant_conversation` | **PASS** — `is_pm_staff` OR (`is_lease_resident` AND `pm_residents.user_id`) |
| Staff insert restricted to `is_pm_staff` | **PASS** |
| Message insert requires `sender_user_id = auth.uid()` | **PASS** |
| MEDIA conversation attachments require conversation access | **PASS** |
| Other MEDIA types still `is_org_member` | **PASS** |
| `is_org_member` / `is_org_manager` not replaced | **PASS** |
| Billing / Stripe tables | **Untouched** |

Observation (non-blocking): production `role_permission_grants` does not accept `maintenance_technician`. That single approved grant was omitted at apply time. COM-002 staff entitlement remains application-layer (`platform.communications` + `pm.portal_tenant`). `is_pm_staff()` still recognizes the `maintenance_technician` membership role.

---

## Stop

Database is ready. **No application deployment from this record.**

Next: deploy certified COM-002 application (`main` after PR #188) and run authenticated UAT.
