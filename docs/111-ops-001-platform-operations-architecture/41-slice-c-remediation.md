# 41 — OPS-001 Slice C Remediation (OC-SUBSTRATE-01)

**Package:** OPS-001 — Platform Operations Architecture  
**Slice:** C — Task Engine + Workflow Orchestration + Priority Engine  
**Source finding:** [40 — Slice C Validation](./40-slice-c-validation.md) · ❌ **FAIL** · **OC-SUBSTRATE-01**  
**Program record:** [CORE-003 §86](../113-core-003-implementation-master-plan/86-ops-001-slice-c-remediation.md)  
**Authorization / Implementation:** [38](./38-slice-c-authorization.md) · [39](./39-slice-c-implementation.md)  
**Status:** ✅ **REMEDIATION COMPLETE** (R-C1) · ✅ Re-validation **PASS** ([42](./42-slice-c-validation-rerun.md))  
**Date:** 2026-07-26  
**Target environment:** Supabase `mpa-prod` (`vahnmcrpnuggxkivynvo`)

> Remediation **only** for OC-SUBSTRATE-01.  
> Application logic **unchanged**. No schema beyond the approved migration.  
> Re-validation recorded in [42](./42-slice-c-validation-rerun.md) · ✅ **PASS**. Slice D **not** authorized.

---

## 1. Remediation outcome

| ID | Finding | Action | Result |
|----|---------|--------|--------|
| **R-C1** | Authorized migration not on `mpa-prod`; `ops_tasks` / `ops_workflow_*` absent | Applied `ops001_slice_c_tasks_workflows_priority` via Supabase MCP `apply_migration` (SQL identical to repo file `20260726190000_ops001_slice_c_tasks_workflows_priority.sql`) | ✅ |
| **R-C2** | Live re-validation probes | ✅ Completed in [42](./42-slice-c-validation-rerun.md) · probe `ops001-slice-c-v1` | ✅ |
| **R-C3** | Preserve FAIL history | [40](./40-slice-c-validation.md) unchanged as historical FAIL | ✅ |

---

## 2. Migration applied confirmation

| Field | Evidence |
|-------|----------|
| **Name** | `ops001_slice_c_tasks_workflows_priority` |
| **Repo file** | `supabase/migrations/20260726190000_ops001_slice_c_tasks_workflows_priority.sql` |
| **Prod ledger** | `supabase_migrations.schema_migrations` → version **`20260726201214`**, name **`ops001_slice_c_tasks_workflows_priority`** |
| **Apply channel** | Supabase MCP `apply_migration` → `success: true` |
| **Project** | `mpa-prod` (`vahnmcrpnuggxkivynvo`) |
| **Schema delta** | Exact approved migration content — no additive DDL beyond file |

---

## 3. Production verification — tables created

| Table | `to_regclass` | RLS enabled |
|-------|---------------|-------------|
| `public.ops_tasks` | ✅ present | ✅ true |
| `public.ops_workflow_templates` | ✅ present | ✅ true |
| `public.ops_workflow_instances` | ✅ present | ✅ true |
| `public.ops_workflow_step_events` | ✅ present | ✅ true |

**Priority substrate:** No separate priority table (by design). Priority is enforced as check constraints on `ops_tasks.priority` and `ops_workflow_instances.priority` (`critical` · `high` · `medium` · `low`) — matches approved migration / Priority Engine scale.

**Pilot seed:**

| Field | Value |
|-------|-------|
| `template_id` | `maintenance.standard.v1` |
| `version` | 1 |
| `trigger_event_type` | `maintenance.request.created` |
| `enabled` | true |
| `startStep` | `assign_vendor` |
| `step_count` | 4 |

---

## 4. Indexes

| Index | Present |
|-------|---------|
| `ops_tasks_pkey` | ✅ |
| `ops_tasks_organization_id_idempotency_key_key` | ✅ |
| `ops_tasks_org_priority_status_idx` | ✅ |
| `ops_tasks_org_subject_idx` | ✅ |
| `ops_tasks_org_owner_idx` | ✅ |
| `ops_tasks_source_event_idx` | ✅ |
| `ops_workflow_templates_pkey` | ✅ |
| `ops_workflow_instances_pkey` | ✅ |
| `ops_workflow_instances_organization_id_template_id_subject__key` | ✅ |
| `ops_workflow_instances_org_status_idx` | ✅ |
| `ops_workflow_instances_subject_idx` | ✅ |
| `ops_workflow_step_events_pkey` | ✅ |
| `ops_workflow_step_events_instance_id_step_id_action_causati_key` | ✅ |
| `ops_workflow_step_events_instance_idx` | ✅ |

---

## 5. Constraints

| Constraint | Table | Type |
|------------|-------|------|
| `ops_tasks_pkey` | `ops_tasks` | PK |
| `ops_tasks_organization_id_idempotency_key_key` | `ops_tasks` | UNIQUE |
| `ops_tasks_priority_check` | `ops_tasks` | CHECK |
| `ops_tasks_status_check` | `ops_tasks` | CHECK |
| `ops_tasks_created_by_check` | `ops_tasks` | CHECK |
| `ops_tasks_organization_id_fkey` | `ops_tasks` | FK → organizations |
| `ops_tasks_workflow_instance_fkey` | `ops_tasks` | FK → workflow instances |
| `ops_workflow_templates_pkey` | `ops_workflow_templates` | PK |
| `ops_workflow_instances_pkey` | `ops_workflow_instances` | PK |
| `ops_workflow_instances_…_subject__key` | `ops_workflow_instances` | UNIQUE (org, template, subject) |
| `ops_workflow_instances_priority_check` / `status_check` | `ops_workflow_instances` | CHECK |
| `ops_workflow_instances_organization_id_fkey` / `template_id_fkey` | `ops_workflow_instances` | FK |
| `ops_workflow_step_events_*` | `ops_workflow_step_events` | PK · UNIQUE · CHECK · FK |

✅ Matches approved migration.

---

## 6. RLS verification

| Table | RLS | Notes |
|-------|-----|-------|
| `ops_tasks` | ✅ enabled | Member select/insert/update |
| `ops_workflow_templates` | ✅ enabled | Select-all policy (registry) |
| `ops_workflow_instances` | ✅ enabled | Member select |
| `ops_workflow_step_events` | ✅ enabled | Member select |

Service-role engine writes bypass RLS (same A/B pattern) — documented in migration comments; no app-logic change.

---

## 7. Policy verification

| Policy | Table | CMD |
|--------|-------|-----|
| `ops_tasks_select_member` | `ops_tasks` | SELECT |
| `ops_tasks_insert_member` | `ops_tasks` | INSERT |
| `ops_tasks_update_member` | `ops_tasks` | UPDATE |
| `ops_workflow_templates_select_all` | `ops_workflow_templates` | SELECT |
| `ops_workflow_instances_select_member` | `ops_workflow_instances` | SELECT |
| `ops_workflow_step_events_select_member` | `ops_workflow_step_events` | SELECT |

✅ Six policies — exact match to approved migration.

---

## 8. Trigger / function verification

| Check | Result | Notes |
|-------|--------|-------|
| User-defined triggers on Slice C tables | **0** | Approved migration defines **no** triggers — expected |
| New Slice C RPCs / functions | **0** | Approved migration defines **no** new functions — expected |
| Pre-existing OPS A–B RPCs | Preserved | Not modified (`ops_claim_domain_events`, etc.) |

---

## 9. Deployment evidence

| Item | Value |
|------|-------|
| Apply API | Supabase MCP `apply_migration` |
| Response | `{ "success": true }` |
| Migration version on prod | `20260726201214` |
| Migration name on prod | `ops001_slice_c_tasks_workflows_priority` |
| Application code | **Unchanged** |
| Schema beyond approved file | **None** |

---

## 10. Recommendation

| Field | Result |
|-------|--------|
| **OC-SUBSTRATE-01 remediated?** | ✅ **YES** |
| **Re-run validation now?** | ✅ Done — [42](./42-slice-c-validation-rerun.md) **PASS** |
| **Authorize Slice D?** | ❌ **NO** (eligible after PASS — separate phrase) |

**Next phrase (dedicated authorize session):**

```
AUTHORIZE OPS-001 SLICE D
```

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Remediation authority | ✅ **R-C1 COMPLETE** — Slice C substrate on `mpa-prod` | 2026-07-26 |
| Validation re-run | ✅ **PASS** ([42](./42-slice-c-validation-rerun.md)) | 2026-07-26 |
| OPS-001 Slice D | ❌ Not authorized · ✅ eligible | 2026-07-26 |
