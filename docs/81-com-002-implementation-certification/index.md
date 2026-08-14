# 81 — COM-002 IMPLEMENTATION CERTIFICATION

**Title:** COM-002 IMPLEMENTATION CERTIFICATION  
**Status:** IMPLEMENTATION COMPLETE — not Production deployed  
**Date:** 2026-08-14  
**Approved design:** [docs/80](../80-com-002-tenant-communication-center/index.md) **Approved**  
**ADR:** [ADR-024](../18-decision-log/adr-024-com-002-tenant-communication-center.md) **Accepted**  
**Production deploy:** **NO**  
**Billing / Stripe / commercial flow:** **Unchanged**

---

## Scope certified

Phase A — conversation domain, messages, participants, read receipts, inbox APIs, authorization  
Phase B — tenant inbox UI, staff messaging UI, threads, history  
Phase C — MEDIA-001 attachments, Notification Center rows, activity timeline events  

Stopped after implementation certification. No Production deployment.

---

## What shipped

| Area | Implementation |
|------|----------------|
| Schema | `comms_conversations`, `comms_conversation_participants`, `comms_conversation_messages`, `comms_message_reads` |
| Notices | `comms_messages` unchanged — one-way notices remain |
| MEDIA-001 | `related_entity_type` += `conversation_message`; no second store |
| Staff APIs | `/api/shared/communications/conversations` start/list/thread/send/read/close |
| Tenant APIs | `/api/portal/tenant/conversations` list/thread/reply/read |
| Staff UI | Conversations desk beside notices on `/shared/communications`; thread routes |
| Tenant UI | `/portal/tenant/messages` + `[conversationId]`; Messages nav item |
| Context | Resident “Message tenant”; PM work-order “Message tenant” (not FO) |
| Notifications | `comms_notifications` with thread `href` + idempotent `notification_key` |
| Timeline | `event_domain_events` + `audit_events` (`conversation.*`); property + work-order aggregates |

Mutations live in Next.js API routes + service module (same trusted boundary as MEDIA-001 and operational notices). Reads use authenticated Supabase + RLS.

---

## Security verification

| Check | Result |
|-------|--------|
| Tenant lease isolation | Tenant plane requires `pm_residents.user_id` + `lease_residents`; other tenant cannot send/read |
| Organization isolation | Every row is `organization_id`-scoped; cross-org load fails closed |
| Property ACL | Staff start/send asserts property belongs to the org; FO-only SKU denied (`pm.portal_tenant` required) |
| Facility Operations tenant inbox | **Absent** — no FO nav; FO SKU fails `staffHasTenantCommsEntitlement` |
| Signed media authorization | Download/upload for `conversation_message` requires conversation access; signed URLs only; org path prefix unchanged |
| Tenant cannot start v1 | Staff `POST` start only; tenant APIs have no start route |

---

## Tests

| Suite | Result |
|-------|--------|
| `@mpa/shared` (includes conversation + MEDIA `conversation_message`) | **252 passed** |
| Conversation lifecycle (start/reply/receipts/close/reopen/WO uniqueness/FO WO reject/media attach) | **6 passed** |
| Staff conversation API authz (401 / FO 403 / PM allow) | **3 passed** |
| Tenant inbox API (401 / no lease 403 / own inbox) | **3 passed** |
| Conversation media authorization | **1 passed** |
| MEDIA-001 route regression | **5 passed** |
| Maintenance + facility authz regression | **13 passed** |
| `apps/web` `tsc --noEmit` | **Pass** |

Commands:

```bash
pnpm --dir packages/shared test
pnpm --dir apps/web exec vitest run \
  src/lib/communications src/lib/media \
  src/app/api/shared/communications/conversations \
  src/app/api/portal/tenant/conversations \
  src/app/api/shared/media \
  src/lib/maintenance/authz.test.ts \
  src/lib/facility/authz.test.ts
pnpm --dir apps/web typecheck
```

---

## Constitution

| Rule | Status |
|------|--------|
| Three products only | Capability, not a fourth product |
| Facility Operations | No tenant messaging |
| Complete Platform | Union via PM entitlements |
| Enterprise | Not a product or SKU |
| Commercial flow | Unchanged |
| Billing / Stripe | Unchanged |

---

## Production

**Do not deploy.** Apply the migration and ship UI only after Owner Production authorization.

Open questions from docs/80 used **defaults**: staff starts; notify participants + creator; history while lease access remains; staff names shown to tenants.
