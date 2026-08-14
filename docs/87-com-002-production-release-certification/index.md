# COM-002 PRODUCTION RELEASE CERTIFICATION

**Title:** COM-002 PRODUCTION RELEASE CERTIFICATION  
**Status:** BLOCKED  
**Date:** 2026-08-14  
**Recorded at:** 2026-08-14T01:32:00Z  
**Design:** [docs/80](../80-com-002-tenant-communication-center/index.md) · [ADR-024](../18-decision-log/adr-024-com-002-tenant-communication-center.md)  
**Implementation cert:** [docs/81](../81-com-002-implementation-certification/index.md)  
**Merge:** [PR #188](https://github.com/ecastle612-ux/M.P.A/pull/188) **MERGED**  
**Database:** M1 + M2 already on `mpa-prod` (ledger `20260814012322`, `20260814012357`) — **no schema change in this record**  
**Billing / Stripe / commercial flow:** **Unchanged**  
**Legacy communication migration:** **Not performed**

Identifier note: COM-002 Tenant Communication Center (ADR-024 / docs/80), not Self-Service Commercial (ADR-018 / docs/37).

---

## Final verdict

**BLOCKED**

Production application deploy of certified `main` succeeded. Authenticated Property Manager, tenant, media, work-order, notification, and isolation UAT were **not run**. This record does not certify customer-ready COM-002 use.

Stop here. No further application, schema, Stripe, billing, or commercial change is authorized by this record.

---

## 1. Deployment evidence

Vercel Production auto-deployed when PR #188 merged to `main`. This record **did not** create a second deploy and **did not** change application code.

| Field | Value |
|-------|--------|
| Vercel deployment ID | `dpl_AgZ1AWNkpUvYDn77LLZphjEZiKPT` |
| Created | 2026-08-14T01:27:45.100Z |
| Ready | 2026-08-14T01:28:47.445Z |
| Status | **READY** |
| Target | `production` |
| Git ref | `main` |
| Commit | `14dc7b4d37ae4d6d35ef5df5b640bb2656fb0941` |
| Inspector | https://vercel.com/ecastle612-uxs-projects/m-p-a-web/AgZ1AWNkpUvYDn77LLZphjEZiKPT |
| Aliases | `www.my-property-assistant.com`, `my-property-assistant.com`, `m-p-a-web.vercel.app` |
| GitHub Production deployment | `5898910837` |
| GitHub status | **success** — 2026-08-14T01:28:48Z |

### Merge

| Field | Value |
|-------|--------|
| PR | [#188](https://github.com/ecastle612-ux/M.P.A/pull/188) |
| Merged at | 2026-08-14T01:27:40Z |
| Merge commit / `main` SHA | `14dc7b4d37ae4d6d35ef5df5b640bb2656fb0941` |
| Parents | `dac469a7` + `3f4d229a` |

Live HTML from `www.my-property-assistant.com` includes `dpl=dpl_AgZ1AWNkpUvYDn77LLZphjEZiKPT`. The production alias is this deployment.

### Unauthenticated smoke (production alias)

| Request | Result |
|---------|--------|
| `GET /` | **200** |
| `GET /login` | **200** |
| `GET /shared/communications` | **307** → `/login` |
| `GET /shared/communications/conversations/new` | **307** → `/login` |
| `GET /shared/communications/conversations/{id}` | **307** → `/login` |
| `GET /portal/tenant/messages` | **307** → `/login` |
| `GET /portal/tenant/messages/{id}` | **307** → `/login` |
| `GET /api/shared/communications/conversations` | **401** `Unauthenticated` |
| `POST /api/shared/communications/conversations` | **401** `Unauthenticated` |
| `GET /api/shared/communications/notifications` | **401** `Unauthenticated` |
| `GET /api/shared/communications/targets` | **401** `Unauthenticated` |
| `GET /api/portal/tenant/conversations` | **401** `Unauthenticated` |
| `GET /api/shared/media/{existing-id}/url` | **401** `Unauthenticated` |

COM-002 staff desk, tenant inbox, and conversation APIs are on the live production commit and require authentication. That is not a substitute for authenticated UAT.

---

## 2. Property Manager UAT

**NOT RUN.**

No controlled Property Manager password is available to this agent. Production passwords were not reset and no accounts were invented.

| Check | Result |
|-------|--------|
| Login | **NOT RUN** |
| Communications desk opens | **NOT RUN** |
| Start conversation with tenant | **NOT RUN** |
| Send message | **NOT RUN** |
| View thread history | **NOT RUN** |
| Close / reopen conversation | **NOT RUN** |

Production has active `property_manager` (19) and `organization_admin` (11) memberships. That is not a usable UAT session.

---

## 3. Tenant UAT

**NOT RUN.**

| Check | Result |
|-------|--------|
| Login | **NOT RUN** |
| Tenant inbox opens | **NOT RUN** |
| Receive PM message | **NOT RUN** |
| Reply | **NOT RUN** |
| View conversation history | **NOT RUN** |
| Unread / read status | **NOT RUN** |

`mpa-prod` still has **0** `pm_residents`, **0** `lease_agreements`, **0** `lease_residents`. Tenant conversation APIs require a new-model resident + lease resident row. One active `tenant` membership exists; it cannot complete COM-002 tenant UAT without those rows. This record does not seed residents.

---

## 4. Media UAT

**NOT RUN** for attach / signed-URL success.

| Check | Result |
|-------|--------|
| Attach image to conversation | **NOT RUN** |
| Upload succeeds | **NOT RUN** |
| Signed URL access works | **NOT RUN** (requires authorized actor) |
| Unauthorized access denied | **PARTIAL** — unauthenticated `GET /api/shared/media/{id}/url` returns **401** `Unauthenticated` against an existing maintenance attachment |

No `media_attachments.related_entity_type = conversation_message` rows exist. Current production media rows (8) are all `maintenance`. Count moved from 7 (prior migration cert) to 8 at 2026-08-14T01:29:18Z — operational maintenance media, not COM-002, and not a schema change.

---

## 5. Work order connection

**NOT RUN.**

`comms_conversations` is empty. No live residential work-order → conversation link or history preservation can be demonstrated. Staff start-conversation accepts `linkedEntityType: work_order` in the deployed code; that is not a live pass.

---

## 6. Notification validation

**NOT RUN.**

| Check | Result |
|-------|--------|
| Notification Center entry created | **NOT RUN** |
| Clicking notification opens correct thread | **NOT RUN** |

`comms_notifications` exists with `conversation_id` and is **empty**. Unauthenticated `GET /api/shared/communications/notifications` returns **401**.

---

## 7. Security validation

Live authenticated isolation exercise: **NOT PERFORMED.**

| Check | Production result |
|-------|-------------------|
| Tenant isolation | **NOT RUN** — no tenant conversation actors / rows |
| PM property access | **NOT RUN** |
| FO users denied tenant communications | **NOT RUN** live. Deployed staff gate allows `organization_admin`, `property_manager`, `leasing_agent`, `maintenance_technician` only. Production FO role `facility_technician` (1 active) is outside that set. |
| Organization isolation | **NOT RUN** live. Conversation tables have RLS enabled. |

### Database posture (read-only, `mpa-prod` / `vahnmcrpnuggxkivynvo`)

| Object | State |
|--------|-------|
| `comms_conversations` | 0 rows · RLS on |
| `comms_conversation_participants` | 0 rows · RLS on |
| `comms_conversation_messages` | 0 rows · RLS on |
| `comms_message_reads` | 0 rows · RLS on |
| `comms_notifications` | 0 rows · RLS on |
| `lease_residents` | 0 rows · RLS on |
| Legacy `conversation_threads` | 3 (unchanged) |
| Legacy `communication_messages` | 2 (unchanged) |

Schema-level RLS and unauthenticated 401/307 walls are not a substitute for authenticated cross-tenant / cross-org / FO denial UAT.

---

## 8. Incident status

| Item | Status |
|------|--------|
| Production incident | **None** |
| Application deploy | **Ready** — `dpl_AgZ1AWNkpUvYDn77LLZphjEZiKPT` @ `14dc7b4d` |
| Customer-facing COM-002 traffic | Routes live; **zero** conversations created by this record |
| Database | M1+M2 remain applied; **no schema change** |
| Stripe / billing / commercial flow | **Unchanged** |
| Legacy communication mapping | **Not performed** |

---

## Unblock requirements

1. Provide controlled Property Manager and tenant credentials for `mpa-prod`.  
2. Ensure the tenant is a new-model `pm_residents` + `lease_agreements` + `lease_residents` actor (or Product Owner–approved equivalent).  
3. Re-run authenticated PM, tenant, media, work-order, notification, and isolation UAT on `www.my-property-assistant.com`.  
4. Re-issue this certification as **PRODUCTION RELEASE SUCCESSFUL** or remain **BLOCKED**.

No feature additions, billing, Stripe, commercial-flow, legacy comms mapping, or Facility Operations tenant-messaging work is authorized by this record.
