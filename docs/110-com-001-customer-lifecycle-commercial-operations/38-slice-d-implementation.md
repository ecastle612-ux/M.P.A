# 38 — COM-001 Slice D Implementation Summary

**Package:** COM-001 — Customer Lifecycle & Commercial Operations  
**Slice:** **D — Offboarding + success automation**  
**Authorization:** [37](./37-slice-d-authorization.md) · [CORE-003 §52](../113-core-003-implementation-master-plan/52-com-001-slice-d-authorization.md)  
**Status:** ✅ **IMPLEMENTED** · ✅ **VALIDATED** ([39](./39-slice-d-validation.md) · **PASS**)  
**Date:** 2026-07-25  

> Validation: [39 — Slice D Validation](./39-slice-d-validation.md).  
> COM-001 Slice E · OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 **not** implemented.

---

## 1. Deliverables completed

| Area | Result |
|------|--------|
| Offboarding (A06) | Org-scoped stage machine: cancel → retention → final billing → export → freeze → archive (+ win-back recover) |
| No surprise purge | `purge_allowed` stays **false** on cancel / freeze / archive; legal hold pauses archive |
| Export | Inventory package (properties/units/tenants/leases/documents/memberships/invoices); default **30-day** window |
| Final billing | BILL-001 `cancelSubscriptionAtPeriodEnd` via `requestSaasCancelAtPeriodEnd` — no parallel money rail |
| Freeze | Mutations blocked flag + Ops middleware export-only redirect; `commercial_status=cancelled` |
| Archive | Retention clock default **180 days**; `commercial_status=archived`; historical rows preserved |
| CS 30/90 | Schedule from Finish Setup → Active; due emit once; complete/skip |
| Renewal alerts | Sync from BILL `current_period_end`; T-90/T-60/T-30/T-14/T-7; emit once |
| OPS events | Secret-free Slice D types on OPS-001 Slice A bus |
| Surfaces | Org settings card + Master Admin Slice D panel — UX-012 `--mpa-*` only |

---

## 2. Files changed

### Schema

| Path | Change |
|------|--------|
| `supabase/migrations/20260726060000_com001_slice_d_offboarding_success.sql` | **Added** — `cancelled`/`archived` commercial_status; `commercial_offboarding_states`; `commercial_cs_motions`; `commercial_renewal_alerts` |

**Applied on:** Supabase `mpa-prod` as `com001_slice_d_offboarding_success`

### BILL-001 compatible extension

| Path | Change |
|------|--------|
| `apps/web/src/lib/integrations/saas-billing/contracts.ts` | `cancelSubscriptionAtPeriodEnd` |
| `apps/web/src/lib/integrations/saas-billing/stripe-provider.ts` | Stripe cancel-at-period-end |
| `apps/web/src/lib/integrations/saas-billing/noop-provider.ts` | Noop implementation |
| `apps/web/src/lib/saas/server.ts` | `requestSaasCancelAtPeriodEnd` |

### Commercial services

| Path | Change |
|------|--------|
| `apps/web/src/lib/commercial/offboarding-types.ts` | Stages · export/archive defaults · snapshot types |
| `apps/web/src/lib/commercial/offboarding.ts` | Sequence services · gate · win-back · no-purge invariant |
| `apps/web/src/lib/commercial/cs-motions.ts` | Schedule / due / complete day_30 · day_90 |
| `apps/web/src/lib/commercial/renewal-alerts.ts` | Sync / due emit from BILL period end |
| `apps/web/src/lib/commercial/ops-events.ts` | Slice D event types |
| `apps/web/src/lib/commercial/index.ts` | Barrel exports |
| `apps/web/src/lib/commercial/offboarding.test.ts` | Purge / defaults / milestone unit tests |
| `apps/web/src/lib/ops/catalog.ts` | Slice D catalog types |
| `apps/web/src/lib/auth/recovery/commercial-activate.ts` | Best-effort `scheduleCsMotions` after Active |
| `apps/web/src/middleware.ts` | Freeze/archive → export-only Ops navigation |

### APIs

| Path | Change |
|------|--------|
| `apps/web/src/app/api/organizations/[organizationId]/offboarding/route.ts` | GET state · POST cancel/export/freeze/archive/recover |
| `apps/web/src/app/api/organizations/[organizationId]/cs-motions/route.ts` | GET refresh · POST schedule/complete |
| `apps/web/src/app/api/organizations/[organizationId]/renewal-alerts/route.ts` | GET refresh · POST sync |
| `apps/web/src/app/api/master-admin/commercial/offboarding/route.ts` | CS/Support Slice D lookup + actions |

### UI (UX-012 Slice A tokens)

| Path | Change |
|------|--------|
| `apps/web/src/components/commercial/org-offboarding-card.tsx` | Customer/CS offboarding + CS/renewal status |
| `apps/web/src/app/(app)/settings/organization/page.tsx` | Embed Slice D card |
| `apps/web/src/components/master-admin/commercial-ops-panel.tsx` | Ops-minimum Slice D lookup/actions |

### Documentation

| Path | Change |
|------|--------|
| This file (`38`) | Implementation summary |
| `docs/111-ops-001…/02-event-catalog.md` | Slice D events |
| COM-001 / CORE-003 boards | Status → Implemented; recommend Validate |

---

## 3. Offboarding workflow

```
confirmCancellation
  → retention_offer (or skip → final_billing)
  → recordRetentionOffer (declined/skipped → final_billing | accepted → recoverWinBack)
  → coordinateFinalBilling (BILL cancel_at_period_end + export inventory + 30d window)
  → freezeOrganization (requires export_ready; mutations blocked; archive schedule +180d)
  → archiveOrganization (after schedule / force; purge still gated; legal hold blocks)
```

| Invariant | Enforcement |
|-----------|-------------|
| Cancel ≠ purge | `cancelEnablesPurge() === false`; `purge_allowed` forced false through archive |
| Export before freeze | Freeze requires `export_ready_at` (auto-coordinates billing once if needed) |
| Org isolation | All tables keyed by `organization_id`; RLS member select |
| Historical preserve | Archive sets status only — no hard-delete job in Slice D |
| Win-back | Same-org recover pre-archive → `commercial_status=active` |

---

## 4. Export / freeze / archive lifecycle

| Clock | Default | Field |
|-------|---------|-------|
| Export window | **30 days** | `export_window_ends_at` |
| Archive / recovery retention | **180 days** | `archive_scheduled_at` / `recovery_window_ends_at` |
| Deletion schedule | Gated | `deletion_scheduled_at` · `purge_allowed` remains false |
| Legal hold | Pauses archive | `legal_hold` |

Export inventory counts (org-scoped): properties, units, tenants, leases, documents, memberships, open invoices.

Freeze navigation: Ops shell (non–Master Admin) redirects to `/settings/organization` when stage is `frozen` / `archive_scheduled` / `archived`.

---

## 5. Customer Success 30/90 automation

| Motion | Trigger | Behavior |
|--------|---------|----------|
| `day_30` | Finish Setup → Active (`scheduleCsMotions`) | Idempotent upsert; due emit once (`due_emitted_at`) |
| `day_90` | Same | Same |
| Complete / skip | CS / org manage | Status `completed` \| `skipped` + OPS event |

Refresh is retry-safe: re-running due hooks does not re-emit when `due_emitted_at` is set. Health band at due reused from Slice C (no health redesign).

---

## 6. Renewal alert hooks

| Milestone | Days before `current_period_end` |
|-----------|----------------------------------|
| t90 | 90 |
| t60 | 60 |
| t30 | 30 |
| t14 | 14 |
| t7 | 7 |

- Synced from BILL-001 SaaS snapshot (`getOrgSaasSnapshot`).  
- Insert-if-missing per `(organization_id, milestone_key, period_end_at)`.  
- Due → `emitted` once; secret-free OPS `commercial.renewal.alert_due` + timeline `renewal_notice`.

---

## 7. OPS event additions

| Event | When |
|-------|------|
| `commercial.offboarding.stage_changed` | Stage transitions |
| `commercial.offboarding.export_ready` | Export inventory ready |
| `commercial.offboarding.frozen` | Freeze |
| `commercial.offboarding.archived` | Archive |
| `commercial.offboarding.recovered` | Win-back |
| `commercial.cs_motion.scheduled` | 30/90 scheduled |
| `commercial.cs_motion.due` | Motion due (once) |
| `commercial.cs_motion.completed` | Complete / skip |
| `commercial.renewal.alert_due` | Renewal milestone due (once) |

Payloads: ids · stage · motion/milestone keys · status codes only — no credentials or payment secrets.

---

## 8. Remaining COM-001 Slice E work

| Item | Status |
|------|--------|
| Staff commercial dashboard ([22](./22-commercial-dashboard.md)) | 🔒 Locked — requires `AUTHORIZE COM-001 SLICE E` after Slice D Validated |
| Marketplace data model stubs ([25](./25-implementation-marketplace.md)) | 🔒 Locked with Slice E |
| OPS-001 Slice B notify productization | 🔒 Separate authorize |
| UX-012 Slice B Command Center chrome | 🔒 Separate authorize |
| PMX-004 Phase 2 | 🔒 Separate authorize |
| Full [09] reactivation matrix beyond win-back | Out of Slice D |

---

## 9. Preserved behavior

- AUTH-001 A–E — Cancelled / export-window posture reused via `commercial_status` + freeze middleware; no identity redesign.  
- COM-001 A–C — Pipeline, progress/trial, health/discovery/timeline unchanged.  
- OPS-001 Slice A — Event bus reused; no notify productization.  
- UX-012 Slice A — `--mpa-*` tokens only.  
- BILL-001 — Cancel-at-period-end extension only; no Checkout redesign.

---

## 10. Recommendation

Validation recorded: [39](./39-slice-d-validation.md) · **`VALIDATE COM-001 SLICE D` → PASS**.

COM-001 Slice E is **eligible** for a separate authorize phrase. Do **not** begin COM-001 Slice E · OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 without their own authorize phrases.
