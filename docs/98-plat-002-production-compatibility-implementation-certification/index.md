# PLAT-002 PRODUCTION COMPATIBILITY AMENDMENT IMPLEMENTATION CERTIFICATION

**Title:** PLAT-002 PRODUCTION COMPATIBILITY AMENDMENT IMPLEMENTATION CERTIFICATION  
**Status:** READY  
**Date:** 2026-08-14  
**Program:** PLAT-002  
**Authority:** [docs/97](../97-plat-002-production-compatibility-amendment/index.md) Approved · [ADR-027](../18-decision-log/adr-027-plat-002-production-compatibility.md) Accepted  
**Parent cert:** [docs/96](../96-plat-002-production-authorization-migration-certification/index.md) BLOCKED  
**Approved design:** [docs/94](../94-plat-002-authorization-hardening/index.md) · [ADR-026](../18-decision-log/adr-026-authorization-hardening-pipeline.md)  
**Production:** **No Production apply** from this package  
**Application deployment:** Not performed  
**Billing / Stripe / roles / SKUs:** No changes

---

## Final verdict

**READY**

The approved successor `20260814180000_plat_002_production_compat.sql` is in the repo, idempotent, and validated on a local PostgreSQL 16 cluster that mirrors the two environments docs/97 requires. Production `mpa-prod` was **not** changed. Application SHA was **not** deployed.

A later Owner-authorized Production retry must apply **this successor only**, not `20260814160000`.

---

## Scope delivered

| Item | Delivery |
|------|----------|
| Historical file | `20260814160000_plat_002_authorization_hardening.sql` kept unchanged (do not replay on Production) |
| Successor | `20260814180000_plat_002_production_compat.sql` — approved helpers/policies + amendment |
| Conditional notifications | `to_regclass('public.maintenance_notifications')`; skip if null; tighten insert if present; **no CREATE TABLE** |
| Leftover drops | `maintenance_work_orders_{select,insert,update,delete}_authorized` |
| Child updates | `maintenance_updates_select` uses `can_select_work_order(work_order_id)` |
| Comms | `is_pm_comms_staff`; `can_access_tenant_conversation` no longer calls `is_pm_staff` |

---

## Validation (local — not Production)

Harness: `supabase/tests/plat-002-production-compat/validate.sh` against PostgreSQL 16.

| Check | Absent table (Production-shaped) | Present table (J6-shaped) |
|-------|:--------------------------------:|:-------------------------:|
| Successor applies | Pass (applied twice — idempotent) | Pass |
| `maintenance_notifications` created | **No** | Pre-existing table remains |
| Notifications insert policy | Skipped | Applied (manager or self) |
| Helpers present | Pass | Pass |
| `*_authorized` removed | Pass | Pass |
| `select` uses `can_select_work_order` | Pass | Pass |
| `manage_manager` uses `org_allows_work_surface` | Pass | Pass |
| Child SELECT inherits parent | Pass | Pass |
| Row counts unchanged (6 WO / 3 SKU subs) | Pass | Pass |

### Work-surface matrix

| SKU org | residential | facility |
|---------|:-----------:|:--------:|
| Property Manager | ● | — |
| Facility Operations | — | ● |
| Complete | ● | ● |
| unknown surface | — | — |

### Role / RLS (JWT `sub` + `authenticated`, FORCE RLS)

| Actor | Work orders | Comms staff |
|-------|-------------|-------------|
| PM manager | residential only | ● |
| FO manager | facility only | — |
| Complete manager | union | ● |
| Complete technician | (assignment rule; not asserted as dump) | — |
| Tenant | own residential only | — (own thread ●) |

### Contract tests

`apps/web` vitest: `plat-002-production-compat.test.ts` + `plat-002-rls.test.ts` — **11 passed**.

---

## Explicitly not done

- Production apply of the successor
- Replay of `20260814160000` on Production
- Application / Vercel deploy
- Creating `maintenance_notifications` on any environment from the successor
- Stripe / billing / role / SKU changes
- Live www API 401/403 certification

---

## Rollback (unchanged from docs/97 §3.3)

Restore prior policy text from docs/96; recreate the four `*_authorized` policies if rolling back C4 leftovers; replace `can_access_tenant_conversation` with `is_pm_staff` if rolling back C5. **No row deletes.**

---

**STOP.** Certification only. Do not apply to Production. Do not deploy.
