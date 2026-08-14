# COM-002 AUTHENTICATED PRODUCTION UAT CERTIFICATION

**Title:** COM-002 AUTHENTICATED PRODUCTION UAT CERTIFICATION  
**Status:** BLOCKED  
**Date:** 2026-08-14  
**Recorded at:** 2026-08-14T02:52:00Z  
**Release:** `main` @ `14dc7b4d37ae4d6d35ef5df5b640bb2656fb0941`  
**Production alias:** `www.my-property-assistant.com`  
**UAT org:** M.P.A. UAT Property Demo (`a11ce002-0001-4000-8000-0000000000c2`)  
**Application / schema / Stripe / billing / commercial flow:** **Unchanged**

Identifier note: COM-002 Tenant Communication Center (ADR-024 / docs/80), not Self-Service Commercial.

---

## Final verdict

**BLOCKED**

Two-way messaging, media attach, work-order-linked conversation, tenant isolation, and FO denial were exercised live. Certification is **not** PRODUCTION RELEASE SUCCESSFUL because Notification Center click-through / read-state failed as specified, and tenant writes surface `audit_events` RLS errors.

Stop here. No application, migration, Stripe, billing, or commercial change is authorized by this record.

---

## Accounts used

| Actor | Email | Role |
|-------|-------|------|
| Property Manager | `uat.pm.property.demo@my-property-assistant.com` | `property_manager` |
| Tenant | `uat.tenant.property.demo@my-property-assistant.com` | `tenant` |
| FO (security only) | `uat.fo.property.demo@my-property-assistant.com` | `facility_technician` |

Passwords are not stored in this blueprint.

---

## 1. Property Manager message flow

**PASS**

| Check | Result |
|-------|--------|
| Login | `/pm/mission-control` |
| Communications desk | `/shared/communications` — Start conversation + Inbox |
| Start conversation with tenant | Tenant target **UAT Tenant** |
| Send message | `Hello, this is a test message from M.P.A. Property Management.` |
| Conversation created | `d409029d-bcbe-4725-9f67-41b37e1e9f28` · subject `COM-002 UAT thread` · `open` |
| Message saved | `comms_conversation_messages` row from PM `0e1fc6e4-…` |
| Thread history visible | PM message shown with property/unit/tenant context |
| Tenant participant attached | `comms_conversation_participants` tenant + staff |

---

## 2. Tenant inbox flow

**PASS** (with residual write error)

| Check | Result |
|-------|--------|
| Login | `/portal/tenant` |
| Inbox loads | `/portal/tenant/messages` |
| New message appears | `COM-002 UAT thread` |
| Unread indicator | Green **New** badge |
| Open conversation | `/portal/tenant/messages/d409029d-bcbe-4725-9f67-41b37e1e9f28` |
| Read status (thread) | Participant `last_read_at` updated |
| Reply | `Received, thank you.` persisted |

Residual: sending the reply showed `new row violates row-level security policy for table "audit_events"`. The message still saved. A second send after the error created a duplicate reply (two identical tenant messages).

---

## 3. PM reply flow

**PASS**

PM reopened the same thread. Both tenant replies and the original PM message were visible. Sender labels: Property team / Resident. Inbox showed unread before open.

---

## 4. Media attachment

**PASS** (authorized + unauthenticated deny)

| Check | Result |
|-------|--------|
| Attach image | PM **Upload file** on the existing thread |
| Upload succeeds | `media_attachments` `78a3b1d2-01f6-4a61-b5fb-e1226b3f528b` · `conversation_message` · `ready` · `image/png` |
| Attachment displays | PM thread preview; tenant can see the same image |
| Signed URL for authorized users | Image rendered in both PM and tenant threads |
| Unauthorized access denied | Unauthenticated `GET /api/shared/media/78a3b1d2-…/url` → **401** `Unauthenticated` |

Domain events: `conversation.attachment.added` on the conversation and property.

---

## 5. Work order connection

**PASS** after UAT-only shadow rows; first tenant submit **failed**

First tenant submit failed:

`insert or update on table "maintenance_work_orders" violates foreign key constraint "maintenance_work_orders_property_id_fkey"`

Cause: `maintenance_work_orders.property_id` / `unit_id` must exist in both new-model (`property_properties` / `property_units`) and legacy (`properties` / `units`). The UAT org originally had only the new-model rows.

UAT-only shadow rows (same UUIDs, no schema change) were inserted so the requested WO path could be re-run. Tenant submit then created WO `ba38f82f-a3f8-4e2c-99b9-247283adadde` (UI still showed `audit_events` RLS error; the row persisted).

| Check | Result |
|-------|--------|
| Message tenant from residential WO | `/shared/communications/conversations/new?workOrderId=ba38f82f-…` |
| Conversation links to work order | `5dec0c8c-393a-4a65-8434-439691e53938` · `linked_entity_type=work_order` · UI badge **Work order** |
| Timeline / event record | `work_order.created`, `conversation.started`, `conversation.message.sent` on `maintenance_work_orders` |

---

## 6. Notification Center

**FAIL**

| Check | Result |
|-------|--------|
| New message creates notification | **Partial** — `comms_notifications` rows created **for the tenant only** (first thread + WO thread). **No** PM notification rows for tenant replies. |
| Clicking notification opens correct thread | **Not demonstrated.** Tenant portal has **no** Notifications control. PM Notifications panel showed **No notifications yet**. |
| Read state updates | **FAIL** — all three UAT `comms_notifications` rows still `read_at` null after the tenant opened threads. Thread `last_read_at` did update. |

---

## 7. Security validation

**PASS** for the exercised checks

| Check | Result |
|-------|--------|
| Tenant only sees own conversations | Tenant JWT REST: only the UAT conversation(s) in this org |
| PM only sees authorized residents/properties | PM desk targets and threads limited to UAT Tenant / Demo Apartments |
| FO cannot access tenant communications | FO login → `/unauthorized?reason=role`. FO JWT REST `comms_conversations` for the UAT org returns **[]** |
| Organization isolation | These users only read the UAT org conversation set. Unauthenticated conversation APIs **401** |

FO user was created only for this security exercise (`facility_technician` in the internal UAT org).

---

## Incident status

| Item | Status |
|------|--------|
| Production incident | **None declared** — residual defects below |
| Application deploy | Unchanged — `14dc7b4d` |
| Stripe / billing / commercial flow | Unchanged |
| Schema / migrations | None |
| Conversations created | 2 (general + work-order-linked) |

### Residual defects (block SUCCESSFUL)

1. Tenant message send and tenant work-order create show `audit_events` RLS violations. Writes often persist; the UI reports failure and retries can duplicate messages.  
2. Notification Center does not meet the UAT bar: no tenant bell, no PM bell entries, notification `read_at` never set.  
3. Residential work-order create against a new-model-only property requires a legacy `properties`/`units` shadow row because of dual FKs.

---

## Unblock requirements

1. Fix `audit_events` insert so tenant conversation and maintenance writes do not error.  
2. Make Notification Center create, deep-link, and mark-read work for the counterparty (including tenant UI or an equivalent).  
3. Re-run Notification Center + tenant-write UAT.  
4. Re-issue this certification as **PRODUCTION RELEASE SUCCESSFUL** or remain **BLOCKED**.

No feature additions, migrations, billing, Stripe, commercial-flow, or legacy comms mapping are authorized by this record.
