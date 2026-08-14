# COM-002 PRODUCTION COMPATIBILITY IMPLEMENTATION CERTIFICATION

**Title:** COM-002 PRODUCTION COMPATIBILITY IMPLEMENTATION CERTIFICATION  
**Status:** IMPLEMENTATION COMPLETE — not applied to production  
**Date:** 2026-08-14  
**Approved design:** [docs/83](../83-com-002-production-compatibility-package/index.md) **Approved**  
**ADR:** [ADR-025](../18-decision-log/adr-025-com-002-production-compatibility.md) **Accepted**  
**Production apply:** **NO**  
**Production deploy:** **NO**  
**Billing / Stripe / commercial flow:** **Unchanged**

Identifier note: this record certifies **M1** for COM-002 Tenant Communication Center (ADR-024 / docs/80), not COM-002 Self-Service Commercial.

---

## Scope certified

Approved M1 only:

1. `lease_residents` foundation  
2. `is_lease_resident()` helper  
3. `comms_messages` foundation  
4. `comms_notifications` foundation (no `conversation_id`)  
5. Required indexes  
6. Required RLS policies  
7. `platform.communications:read/write` capability rows if missing  

Stopped after implementation certification. **No `mpa-prod` apply. No deployment. No M2.**

---

## Migration files

| File | Role |
|------|------|
| `supabase/migrations/20260814005000_com_002_prod_compat_prerequisites.sql` | M1 — additive, idempotent |

M2 (`20260814010000_com_002_tenant_communication_center.sql`) is **not** in this package (lives on PR #188).

---

## Tables created

M1 creates these objects when absent (`create table if not exists`):

| Table | Indexes | RLS |
|-------|---------|-----|
| `lease_residents` | `lease_residents_user_idx` | `lease_residents_select`, `lease_residents_manage_manager` |
| `comms_messages` | `comms_messages_org_created_idx`, `comms_messages_recipient_idx` | `comms_messages_select_member`, `comms_messages_insert_manager` |
| `comms_notifications` | `comms_notifications_user_idx` | `comms_notifications_select_own`, `comms_notifications_insert_member`, `comms_notifications_update_own` |

Helper: `is_lease_resident(uuid)` — FIN-OPS S1 body; reads `lease_residents` only.

---

## Apply evidence

### Preview (`mpa-preview` / `drcbipqrxfqpjilsfxip`) — applied

| Field | Value |
|-------|--------|
| Migration name | `com_002_prod_compat_prerequisites` |
| Preview ledger version | `20260814011821` |
| Result | **SUCCESS** (idempotent — objects already present from LAUNCH-001 / FIN-OPS S1) |
| `comms_notifications.conversation_id` | **Absent** (M2 not applied) |

Row counts before and after apply (unchanged):

| Table | Before | After |
|-------|--------|-------|
| `lease_residents` | 0 | 0 |
| `comms_messages` | 0 | 0 |
| `comms_notifications` | 0 | 0 |
| `document_documents` | 0 | 0 |
| `platform.communications:*` caps | 2 | 2 |

Helper definition hashes unchanged:

| Function | MD5 before | MD5 after |
|----------|------------|-----------|
| `is_org_member` | `3754c4e0dcfaf93b34aa157f93584ff3` | same |
| `is_org_manager` | `789385206672df2e6cf0e05cb7879228` | same |
| `is_lease_resident` | `64cfcda94f3a9b5039176394d5c4cacf` | same |

### Production (`mpa-prod` / `vahnmcrpnuggxkivynvo`) — **not applied**

| Check | Result |
|-------|--------|
| M1 in production migration ledger | **NO** — latest remains `20260813232103_fo_prod_enablement_d_events_audit_compat` |
| `lease_residents` / `comms_messages` | **Missing** |
| `conversation_threads` | 3 (unchanged) |
| `communication_messages` | 2 (unchanged) |
| `in_app_notifications` | 19 (unchanged) |

---

## Security validation

Preview RLS after M1 (expressions match docs/83):

| Policy | Using / check |
|--------|----------------|
| `lease_residents_select` | `is_org_member(organization_id) OR user_id = auth.uid()` |
| `lease_residents_manage_manager` | `is_org_manager(organization_id)` |
| `comms_messages_select_member` | `is_org_member OR recipient_user_id = auth.uid() OR owner_user_id = auth.uid()` |
| `comms_messages_insert_manager` | `is_org_manager OR is_org_member` |
| `comms_notifications_select_own` | `user_id = auth.uid() OR is_org_manager` |
| `comms_notifications_insert_member` | `is_org_member` |
| `comms_notifications_update_own` | `user_id = auth.uid() OR is_org_manager` |

| Guard | Result |
|-------|--------|
| `is_org_member` / `is_org_manager` not replaced | **PASS** |
| No `drop table` / no legacy comms DML | **PASS** (file + preview counts) |
| No FIN-OPS financial tables created | **PASS** |
| No `document_documents` rewrite | **PASS** |
| No FO tenant messaging objects | **PASS** |
| SQL safety tests | **PASS** — `prod-compat-prerequisites.test.ts` |

---

## Test results

| Suite | Result |
|-------|--------|
| `@mpa/shared` communications (includes M1 safety) | **4 passed** |
| `@mpa/shared` full | **249 passed** / 45 files |
| `apps/web` `tsc --noEmit` | **PASS** |
| Preview M1 apply | **SUCCESS** — `20260814011821` |
| Production M1 apply | **NOT PERFORMED** |

Commands:

```bash
pnpm --dir packages/shared test src/communications
pnpm --dir packages/shared test
pnpm --dir apps/web typecheck
```

---

## Constitution

| Rule | Status |
|------|--------|
| Three products only | Compatibility prerequisite, not a product |
| Facility Operations | No tenant messaging |
| Commercial flow | Unchanged |
| Billing / Stripe | Unchanged |
| Implementation Gate | M1 only; production apply still gated |

---

## Stop

Implementation certification complete. **Do not apply M1 to `mpa-prod`. Do not deploy.**

Next authorization (not this record): merge COM-002 implementation, apply M1 then M2 to production, then production UAT (docs/82).
