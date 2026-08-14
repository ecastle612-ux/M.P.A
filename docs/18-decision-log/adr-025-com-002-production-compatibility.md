# ADR-025: COM-002 Tenant Communication Center production compatibility lineage

## Status
Proposed

## Date
2026-08-14

## Context

COM-002 Tenant Communication Center (ADR-024 / docs/80) is implemented on PR #188. Production release certification (docs/82) is **BLOCKED**: the approved conversation migration cannot apply on `mpa-prod` because that database never received the LAUNCH-001 notices tables (`comms_messages`, `comms_notifications`) or the FIN-OPS S1 resident helper (`lease_residents`, `is_lease_resident()`).

`mpa-prod` instead has an older communications store (`conversation_threads`, `communication_messages`, `in_app_notifications`) and a legacy resident store (`tenants`, `leases`). `mpa-preview` and the repository migration tree include the later lineage.

Replaying FIN-OPS S1 or the full LAUNCH-001 remediations file on production would pull in financial tables, replace `is_org_member()`, rewrite `lease_agreements` RLS, recreate `document_documents`, and alter notification tables that do not exist on production.

A senior engineer applying “the COM-002 migration” to production would be surprised by the failure and by any attempt to close the gap with those wholesale files.

This ADR does **not** change ADR-024 product shape (new conversation domain beside notices; no FO tenant inbox; no billing).

## Decision

1. Before applying `20260814010000_com_002_tenant_communication_center.sql` to `mpa-prod`, apply a **dedicated, additive prerequisite migration** (`com_002_prod_compat_prerequisites`) that creates only:
   - `lease_residents` (empty, FIN-OPS S1 shape)
   - `is_lease_resident()` (FIN-OPS S1 body; do not fork onto `pm_residents`)
   - `comms_messages` and `comms_notifications` (LAUNCH-001 notices shape, without `conversation_id`)
   - matching indexes and RLS
   - `platform.communications:read/write` capability rows if missing

2. The prerequisite must be **idempotent** (`if not exists` / `on conflict do nothing`) so preview and future repo-aligned databases are no-ops.

3. Do **not** apply FIN-OPS S1 or LAUNCH-001 remediations wholesale to production as the compatibility path.

4. Do **not** map, move, or delete existing `conversation_threads`, `communication_messages`, `conversation_participants`, `message_read_receipts`, or `in_app_notifications`. COM-002 v1 starts new threads in `comms_conversations`. A historical import, if ever wanted, is a separate Design → Document → Approve cycle.

5. Do **not** backfill `tenants` / `leases` into `pm_residents` / `lease_agreements` / `lease_residents` in this package.

6. Do **not** replace `is_org_member` or `is_org_manager`, and do not change `lease_agreements` RLS in this package.

7. Implementation of the prerequisite SQL is forbidden until this ADR is **Accepted** and docs/83 is **Approved**.

## Consequences

**Easier:** Production can receive the approved COM-002 migration without inventing a second thread model or enabling FIN-OPS billing schema. Preview stays compatible.

**More difficult:** Production temporarily has two communications tablespaces (legacy `conversation_*` and new `comms_*`) plus two resident stores (legacy `tenants`/`leases` and new `pm_residents`/`lease_*`). Operators must understand that COM-002 only messages new-model residents. Capability keys `communication:*` and `platform.communications:*` coexist until a later cleanup is designed.

## Alternatives Considered

- **Apply FIN-OPS S1 + LAUNCH-001 remediations as-is:** Rejected — out of COM-002 scope; would fail on missing notification tables; would replace identity helpers and expand financial schema.
- **Change the approved COM-002 migration to create `comms_notifications` inline and drop `is_lease_resident`:** Rejected — material change to an approved implementation; still needs a resident-access helper for RLS.
- **Point `is_lease_resident()` at `pm_residents` only:** Rejected — forks the helper from the repo/FIN-OPS definition and would be overwritten if FIN-OPS S1 is later applied.
- **Map legacy `conversation_threads` into `comms_conversations` now:** Rejected — different model; ADR-024 chose a new domain; three production threads are not a v1 blocker.
- **Skip prerequisites and deploy app-only:** Rejected — runtime inserts to `comms_notifications` and RLS helpers would fail.
- **Implement before approval:** Rejected — ADR-012.

## Related

- docs/83 — COM-002 Production Compatibility Package (Draft)
- docs/82 — production release certification (BLOCKED)
- ADR-024 — Tenant Communication Center (Accepted on PR #188)
- ADR-012 — Implementation Gate
- ADR-016 — Financial Operations (not enabled by this ADR)
- ADR-017 — LAUNCH-001 (not reopened; notices tables are created only as COM-002 prerequisites)
- ADR-019 — Product Constitution
