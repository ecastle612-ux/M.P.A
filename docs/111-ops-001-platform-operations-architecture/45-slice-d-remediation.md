# 45 — OPS-001 Slice D Remediation (Production Migration)

**Package:** OPS-001 — Platform Operations Architecture  
**Slice:** D — AI Operations Director + Automation Engine + Operational Analytics  
**Purpose:** Apply approved Slice D migration to `mpa-prod` **before** validation (substrate readiness)  
**Program record:** [CORE-003 §89](../113-core-003-implementation-master-plan/89-ops-001-slice-d-remediation.md)  
**Authorization / Implementation:** [43](./43-slice-d-authorization.md) · [44](./44-slice-d-implementation.md)  
**Status:** ✅ **REMEDIATION COMPLETE** (R-D1) · ✅ Validation **PASS** ([46](./46-slice-d-validation.md))  
**Date:** 2026-07-26  
**Target environment:** Supabase `mpa-prod` (`vahnmcrpnuggxkivynvo`)

> Remediation **only** — production migration apply + schema verification.  
> Application logic **unchanged**. Migration file **not** altered. No replacement migrations.  
> Validation completed separately in [46](./46-slice-d-validation.md) · ✅ **PASS**. Slice E **not** authorized.

---

## 1. Remediation outcome

| ID | Finding | Action | Result |
|----|---------|--------|--------|
| **R-D1** | Approved Slice D migration not yet on `mpa-prod`; automation / AI / KPI tables absent | Applied `ops001_slice_d_director_automation_analytics` via Supabase MCP `apply_migration` (SQL identical to repo file `20260726210000_ops001_slice_d_director_automation_analytics.sql`) | ✅ |
| **R-D2** | Production object verification vs approved migration | Tables · indexes · constraints · FKs · RLS · seeds · schedule verified | ✅ |
| **R-D3** | Preserve A–C / AUTH / COM / no scope expansion | Spot-checked OPS A–C tables + AUTH/COM migration ledger; no app/Slice E changes | ✅ |

---

## 2. Migration applied confirmation

| Field | Evidence |
|-------|----------|
| **Name** | `ops001_slice_d_director_automation_analytics` |
| **Repo file** | `supabase/migrations/20260726210000_ops001_slice_d_director_automation_analytics.sql` |
| **Prod ledger** | `supabase_migrations.schema_migrations` → version **`20260726214255`**, name **`ops001_slice_d_director_automation_analytics`** |
| **Apply channel** | Supabase MCP `apply_migration` → `success: true` |
| **Project** | `mpa-prod` (`vahnmcrpnuggxkivynvo`) |
| **Schema delta** | Exact approved migration content — no additive DDL beyond file |
| **Application code** | **Unchanged** this session |

---

## 3. Production verification — objects created

### 3.1 Tables (AI Director · Automation ledger · KPI substrate)

| Table | Present | RLS enabled | Role |
|-------|---------|-------------|------|
| `public.ops_automation_rules` | ✅ | ✅ true | Automation Engine rules |
| `public.ops_automation_fires` | ✅ | ✅ true | Automation fire ledger |
| `public.ops_ai_recommendations` | ✅ | ✅ true | AI Operations Director substrate |
| `public.ops_kpi_snapshots` | ✅ | ✅ true | Operational Analytics / KPI substrate |

**Monitoring substrate:** No dedicated monitoring table in the approved migration (by design). Monitoring is API/query over outbox + workflow + automation + AI + KPI tables ([44](./44-slice-d-implementation.md) · `/api/ops/monitoring`). Verified underlying tables present (A–C + D).

**Views:** ✅ **None** created (migration defines none).  
**Functions / triggers:** ✅ **None** created (migration defines none).

### 3.2 Indexes

| Index | Table | Present |
|-------|-------|---------|
| `ops_automation_rules_pkey` | `ops_automation_rules` | ✅ |
| `ops_automation_rules_org_template_uidx` | `ops_automation_rules` | ✅ |
| `ops_automation_rules_platform_template_uidx` | `ops_automation_rules` | ✅ |
| `ops_automation_rules_trigger_idx` | `ops_automation_rules` | ✅ |
| `ops_automation_fires_pkey` | `ops_automation_fires` | ✅ |
| `ops_automation_fires_rule_id_idempotency_key_key` | `ops_automation_fires` | ✅ |
| `ops_automation_fires_org_status_idx` | `ops_automation_fires` | ✅ |
| `ops_automation_fires_event_idx` | `ops_automation_fires` | ✅ |
| `ops_ai_recommendations_pkey` | `ops_ai_recommendations` | ✅ |
| `ops_ai_recommendations_organization_id_idempotency_key_key` | `ops_ai_recommendations` | ✅ |
| `ops_ai_recommendations_org_status_idx` | `ops_ai_recommendations` | ✅ |
| `ops_ai_recommendations_subject_idx` | `ops_ai_recommendations` | ✅ |
| `ops_kpi_snapshots_pkey` | `ops_kpi_snapshots` | ✅ |
| `ops_kpi_snapshots_organization_id_kpi_key_window_start_wind_key` | `ops_kpi_snapshots` | ✅ |
| `ops_kpi_snapshots_org_key_idx` | `ops_kpi_snapshots` | ✅ |

### 3.3 Constraints · foreign keys

| Constraint | Type | Match |
|------------|------|-------|
| `ops_automation_rules_pkey` | PK | ✅ |
| `ops_automation_rules_org_or_template` | CHECK | ✅ |
| `ops_automation_rules_trigger_kind_check` | CHECK (`event`\|`schedule`) | ✅ |
| `ops_automation_rules_organization_id_fkey` | FK → `organizations(id)` CASCADE | ✅ |
| `ops_automation_fires_pkey` | PK | ✅ |
| `ops_automation_fires_rule_id_idempotency_key_key` | UNIQUE | ✅ |
| `ops_automation_fires_status_check` | CHECK (pending…awaiting_approval) | ✅ |
| `ops_automation_fires_organization_id_fkey` | FK → `organizations` | ✅ |
| `ops_automation_fires_rule_id_fkey` | FK → `ops_automation_rules` | ✅ |
| `ops_ai_recommendations_pkey` | PK | ✅ |
| `ops_ai_recommendations_organization_id_idempotency_key_key` | UNIQUE | ✅ |
| `ops_ai_recommendations_action_class_check` | CHECK | ✅ |
| `ops_ai_recommendations_confidence_band_check` | CHECK | ✅ |
| `ops_ai_recommendations_status_check` | CHECK | ✅ |
| `ops_ai_recommendations_organization_id_fkey` | FK → `organizations` | ✅ |
| `ops_kpi_snapshots_pkey` | PK | ✅ |
| `ops_kpi_snapshots_organization_id_kpi_key_window_start_wind_key` | UNIQUE | ✅ |
| `ops_kpi_snapshots_organization_id_fkey` | FK → `organizations` | ✅ |

✅ Named constraints match approved migration.

### 3.4 Seeded playbooks (automation ledger ready)

| template_key | trigger | enabled | platform | priority |
|--------------|---------|---------|----------|----------|
| `maintenance.overdue.v1` | `maintenance.overdue` | true | ✅ | 5 |
| `lease.expiring.v1` | `lease.expiring` | true | ✅ | 10 |

---

## 4. RLS verification

| Table | RLS | Policy | CMD |
|-------|-----|--------|-----|
| `ops_automation_rules` | ✅ | `ops_automation_rules_select_member` | SELECT |
| `ops_automation_fires` | ✅ | `ops_automation_fires_select_member` | SELECT |
| `ops_ai_recommendations` | ✅ | `ops_ai_recommendations_select_member` | SELECT |
| `ops_kpi_snapshots` | ✅ | `ops_kpi_snapshots_select_member` | SELECT |

Service-role engine writes bypass RLS (same A–C pattern) — documented in migration comments; no app-logic change this session.

---

## 5. Scheduled job verification

| Field | Value |
|-------|-------|
| `name` | `ops_kpi_materialize` |
| `job_type` | `ops_kpi_materialize` |
| `schedule_kind` | `interval` |
| `interval_seconds` | `300` |
| `timezone` | `UTC` |
| `enabled` | `true` |
| `organization_id` | `null` (platform) |
| `schedule_id` | `40074afa-99c9-45ea-8d66-c62edc55499e` |

✅ Matches approved migration seed into `ops_schedules`.

---

## 6. Preserve confirmation (no regressions)

| Surface | Evidence | Status |
|---------|----------|--------|
| OPS-001 Slice A | `event_domain_events` · `ops_activity_timeline` · `ops_event_consumer_receipts` present | ✅ |
| OPS-001 Slice B | `ops_reminders` · `ops_schedules` present · RLS on | ✅ |
| OPS-001 Slice C | `ops_tasks` · `ops_workflow_*` present · pilot `maintenance.standard.v1` count=1 | ✅ |
| AUTH-001 | `auth001_*` migrations = 6 on ledger · invitation/recovery tables spot-present | ✅ |
| COM-001 | `com001_*` migrations = 5 · `commercial_%` tables = 12 | ✅ |
| OPS migrations | A–D = 4 (`ops001_slice_a`…`ops001_slice_d`) | ✅ |
| PMX 1–8 / UX A–B | App/package surfaces — **not** modified by this SQL remediation | ✅ preserved |
| Application logic | **Unchanged** this session | ✅ |
| Slice E / FAC redesign | **Not** touched | ✅ |

---

## 7. Deployment evidence

| Item | Value |
|------|-------|
| Apply API | Supabase MCP `apply_migration` |
| Response | `{ "success": true }` |
| Migration version on prod | `20260726214255` |
| Migration name on prod | `ops001_slice_d_director_automation_analytics` |
| Pre-apply state | Slice D tables **absent**; A–C **present** |
| Post-apply state | Slice D tables · RLS · seeds · KPI schedule **present** |
| Schema beyond approved file | **None** |
| Validation run this session | **No** |
| Slice E authorize | **No** |

---

## 8. Recommendation

1. ✅ Treat **R-D1** production substrate as remediable complete for Slice D validation readiness.  
2. ✅ Validation **PASS** ([46](./46-slice-d-validation.md)).  
3. ✅ Recommend **`AUTHORIZE OPS-001 SLICE E`** (separate session).  
4. ❌ Do **not** authorize or implement OPS-001 Slice E under this remediation.  
5. ❌ Do **not** expand schema beyond the approved migration.

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Remediation (prod migration) | ✅ **R-D1 COMPLETE** | 2026-07-26 |
| Validation | ✅ **PASS** ([46](./46-slice-d-validation.md)) | 2026-07-26 |
| Slice E | 🔒 Eligible — not issued | — |
