# ADR-024: COM-002 Tenant Communication Center

## Status
Proposed

## Date
2026-08-14

## Context

Tenants and property managers need two-way, durable messaging: inbox, threads, history, in-message attachments, and read/unread state. The platform today provides **one-way operational notices** (`comms_messages`, `comms_notifications`, `/shared/communications`) and an honesty-only resident Messages surface. Launch certification listed “two-way threaded messaging beyond operational notices” as out of scope.

Reusing `comms_messages` as a chat store would collapse notices and threads, break audience/channel semantics, and violate UX Principle 10 (communication stays attached to operational objects). Inventing a second media store would fork MEDIA-001 (ADR-023). Putting tenants on `org_members` would violate the four-plane model (ADR-003).

The Blueprint already uses the program code **COM-002** for Self-Service Commercial (ADR-018). This ADR is a **different** program — Tenant Communication Center — requested under the same code. It does not amend ADR-018. Cite this decision as **ADR-024** or **COM-002 Tenant Communication Center**.

Related:

- Feature design: `docs/80-com-002-tenant-communication-center/index.md`
- ADR-003 four-plane authorization
- ADR-005 domain events
- ADR-006 embedded AI (not chatbot-first)
- ADR-007 Edge Functions own business mutations
- ADR-012 Implementation Gate
- ADR-019 Product Constitution
- ADR-023 MEDIA-001

## Decision

1. Introduce a **Tenant Communication Center** as a Shared Platform / Property Manager capability (Complete Platform by union). It is **not** a commercial product, SaaS tier, or Enterprise SKU. Facility Operations does not gain a tenant inbox. Billing and the binding commercial flow do not change.

2. Persist two-way threads in a **new conversation domain** beside notices:
   - `comms_conversations`
   - `comms_conversation_participants`
   - `comms_conversation_messages`
   - `comms_message_reads`  
   Do **not** reuse `comms_messages` as the thread store. Keep `/shared/communications` notices.

3. v1 cardinality: **one tenant account ↔ one organization**, scoped by `organization_id`, `property_id`, `lease_id`. Optional `linked_entity_type` / `linked_entity_id` (`work_order`, `lease`, `property`) attaches context. Work-order chat is the **same** model, not a second system.

4. Participants: exactly one tenant participant (tenant plane via `tenant_lease_access`); staff participate as a property-scoped desk. Each message records `sender_user_id` and `sender_plane`. Owners, vendors, and multi-tenant groups are out of v1.

5. Read state: inbox unread via `participant.last_read_at`; per-message receipts via `comms_message_reads`. Read events do not notify the sender in v1.

6. Attachments **reuse MEDIA-001**. Parent type `conversation_message`. Private storage and short-lived signed URLs only. Download iff the caller can read the parent message. PDF-as-blob is not in v1; Document Center may be **linked**, not copied.

7. Mutations (start, send, mark-read, close) belong to **Edge Functions** (ADR-007). Reads use RLS. Every mutation writes `audit_events` and `event_domain_events` (ADR-005). Notification Center consumes `conversation.message.sent` — no fourth inbox. No AI chat (ADR-006).

8. Security: tenant isolation by lease access; staff by org membership + communications entitlement + property ACL; organization isolation on every row and storage path. Fail closed.

9. This ADR is **Proposed**. Implementation, migrations, and production changes are **forbidden** until Product Owner + Architect set status to **Accepted** and docs/80 to **Approved**.

## Consequences

**Easier:** One thread model for inbox and work-order context; MEDIA-001 and Notification Center stay single systems; notices remain one-way; four-plane auth stays intact.

**More difficult:** Two communications tablespaces (notices vs threads) must stay clearly named; MEDIA-001 constraint must gain `conversation_message` at implement; staff fan-out and post-lease history need Approve answers (docs/80 Q1–Q5); program-code collision with commercial COM-002 requires careful citation.

## Alternatives Considered

- **Reuse `comms_messages` as threads:** Rejected — one-way audience/channel model cannot express participants, receipts, or replies without a breaking rewrite of notices.
- **Generic org-wide chat inbox:** Rejected — violates Principle 10 and tenant/property isolation.
- **Per-workflow chat tables (one for work orders, one for leases):** Rejected — duplicates security, MEDIA, and unread logic.
- **Second blob store for message files:** Rejected — forks ADR-023.
- **Tenants as `org_members`:** Rejected — violates ADR-003.
- **AI assistant in the tenant inbox:** Rejected — violates ADR-006; out of v1.
- **Implement before approval:** Rejected — violates ADR-012.
- **New commercial SKU / Enterprise product:** Rejected — violates ADR-019.
