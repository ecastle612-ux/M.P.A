# DEV-004A — Migration History Reconciliation & Database Integrity

**Status:** Complete (history reconciled; `db pull` blocked only by missing local Docker)  
**Type:** Infrastructure repair (no product schema redesign)  
**Project:** `mpa-prod` (`vahnmcrpnuggxkivynvo`)  
**Gate:** Repair only — does not change approved product DDL intent

---

## Executive summary

Local `supabase/migrations/*.sql` and remote `supabase_migrations.schema_migrations` diverged because remote DDL was often applied via **Supabase MCP `apply_migration`**, which records **auto-generated timestamps** that do not match the repository filenames. Local remains the **authoritative migration source of truth**.

Repair used only Supabase-recommended `migration repair` + `db push --include-all`. All 18 local migrations now match remote history 1:1. `db push` / `db push --dry-run` report **Remote database is up to date.**

---

## Root cause

1. **Dual apply paths:** Repo migrations (hand-timestamped) vs MCP/agent applies (CLI-generated timestamps + split files).
2. **Same logical migrations, different version IDs.**
3. **Remote-only split migrations** for Phase 9, Phase 10, and API-002A not present as separate git files.
4. **Bogus remote history:** `20260717180522_api003_...` recorded after a placeholder MCP apply; screening tables were absent.
5. **Local-ahead foundations** (RX-001, MX-001, MHF-001, API-001, API-003) never pushed via CLI.

---

## Migration inventory (post-repair)

All versions below are **local = remote**:

| Version | Name |
|---------|------|
| `20260714010000` | phase3_identity_organization_foundation |
| `20260714020000` | phase3_authorization_foundation |
| `20260714030000` | phase3_user_profile_foundation |
| `20260714040000` | phase3_security_hardening |
| `20260714103000` | phase4_core_property_foundation |
| `20260714154000` | phase5a_tenant_foundation |
| `20260714200000` | phase6_maintenance_foundation |
| `20260714210000` | phase7_vendor_foundation |
| `20260714220000` | phase8_lease_foundation |
| `20260714230000` | phase9_resident_communication_foundation |
| `20260715040000` | phase10_financial_operations_foundation |
| `20260715120000` | phase11_ai_operations_foundation |
| `20260716190000` | rx001_applicant_lifecycle_foundation |
| `20260716220000` | mx001_migration_center_foundation |
| `20260716230000` | mhf001_unified_communication_foundation |
| `20260717065843` | api001_onesignal_notification_foundation |
| `20260717105212` | api002a_universal_media_foundation |
| `20260717180000` | api003_background_screening_foundation |

No duplicate version IDs. No unmatched remote-only rows.

---

## Repair actions executed

### 1. Revert orphan remote history (19 versions)

```bash
supabase migration repair --linked --status reverted --yes \
  20260714232751 20260715023830 20260715031250 20260715042411 \
  20260715051937 20260715052650 20260715052720 20260715052721 \
  20260715052755 20260715052756 20260715052823 \
  20260715091649 20260715091708 20260715091947 \
  20260715132017 \
  20260717110732 20260717110937 20260717110956 \
  20260717180522
```

### 2. Mark already-live local versions as applied (8 versions)

```bash
supabase migration repair --linked --status applied --yes \
  20260714154000 20260714200000 20260714210000 20260714220000 \
  20260714230000 20260715040000 20260715120000 20260717105212
```

### 3. Push local-ahead migrations

```bash
supabase db push --include-all --yes
```

Applied: RX-001 → MX-001 → MHF-001 → API-001 → API-003.

### 4. Migration applyability fix (not a product redesign)

`20260716220000_mx001_migration_center_foundation.sql` created the composite unique index on `migration_checkpoints (id, organization_id)` **after** the FK that requires it. Reordered so the unique index is created first. No business logic or table shape change.

---

## Verification results

| Check | Result |
|-------|--------|
| `supabase migration list` | All 18 rows local=remote |
| `supabase db push --dry-run` | Remote database is up to date |
| `supabase db push` | Remote database is up to date |
| Schema smoke (SQL) | `applicants`, `migration_jobs`, `in_app_notifications`, `media_assets`, `screening_parties` present |
| `supabase db pull` | **Blocked:** Docker Desktop not running (`Cannot connect to the Docker daemon`). History integrity itself is healthy; pull needs local Docker for shadow DB. |

---

## Operating policy (going forward)

1. Schema changes land only via git files under `supabase/migrations/` created with `supabase migration new`.
2. Deploy with `supabase db push` (or CI). Prefer **not** using MCP `apply_migration` for repo-tracked DDL.
3. If MCP must be used in an emergency, immediately `migration repair` / rename so versions match git.

---

## Remaining risks

| Risk | Notes |
|------|--------|
| Residual DDL drift vs MCP-era remote | Possible subtle differences in policies/indexes for phases applied via MCP then history-mapped. Use `db pull` once Docker is available; capture drift as a new migration if needed. |
| `db pull` requires Docker | Environment prerequisite, not history corruption. |
| CLI PostHog shutdown noise | Exit code may be non-zero even when repair/push succeeded; trust JSON `message` body. |

---

## Definition of done

- [x] Inventory of local vs remote complete
- [x] Remote history repaired to match local SoT for already-applied foundations
- [x] Pending local migrations applied via `db push`
- [x] `supabase migration list` shows no unmatched remote/local rows
- [x] `supabase db push --dry-run` and `supabase db push` succeed without reconciliation errors
- [~] `supabase db pull` — deferred until Docker Desktop is available (not a history mismatch)
- [x] Future migrations can be applied normally (`Remote database is up to date`)
