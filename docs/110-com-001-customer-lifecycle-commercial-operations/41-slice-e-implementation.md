# 41 — COM-001 Slice E Implementation Summary

**Package:** COM-001 — Customer Lifecycle & Commercial Operations  
**Slice:** **E — Commercial dashboard (+ marketplace prep)**  
**Authorization:** [40](./40-slice-e-authorization.md) · [CORE-003 §54](../113-core-003-implementation-master-plan/54-com-001-slice-e-authorization.md)  
**Status:** ✅ **IMPLEMENTED** · ✅ **VALIDATED** ([42](./42-slice-e-validation.md) · **PASS**)  
**Date:** 2026-07-25  

> Validation: [42 — Slice E Validation](./42-slice-e-validation.md).  
> OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 · certified partner marketplace UI **not** implemented.

---

## 1. Deliverables completed

| Area | Result |
|------|--------|
| Staff commercial dashboard (A08) | Cross-org aggregates from COM A–D + BILL mirrors; Master Admin only |
| Plane separation | Dashboard API under `/api/master-admin/commercial/dashboard` only — no customer org route |
| Primary widgets | New customers · trials · active orgs · implementation queue · past due · health · revenue (est. list MRR) · renewals |
| Secondary widgets | Pipeline funnel · offboarding in-flight · discovery CTR · marketplace engagement counts · support unavailable |
| Marketplace prep (A07) | Partner stub table + ImplementationEngagement model; mpa_internal path operable; no partner UI |
| ADMIN-003 composition | Dashboard panel composed on existing `/master-admin/commercial` (no nav redesign) |
| OPS events | Secret-free `commercial.dashboard.opened` · `commercial.engagement.*` on Slice A bus |

---

## 2. Files changed

### Schema

| Path | Change |
|------|--------|
| `supabase/migrations/20260726070000_com001_slice_e_dashboard_marketplace.sql` | **Added** — `commercial_implementation_partners`, `commercial_implementation_engagements` |

**Applied on:** Supabase `mpa-prod` as `com001_slice_e_dashboard_marketplace`

### Commercial services

| Path | Change |
|------|--------|
| `apps/web/src/lib/commercial/dashboard-types.ts` | Dashboard snapshot types |
| `apps/web/src/lib/commercial/dashboard.ts` | Staff aggregate builder + optional dashboard-opened emit |
| `apps/web/src/lib/commercial/marketplace-types.ts` | Engagement / partner stub types |
| `apps/web/src/lib/commercial/marketplace.ts` | Partner stub upsert · engagement upsert/list |
| `apps/web/src/lib/commercial/ops-events.ts` | Slice E event types |
| `apps/web/src/lib/commercial/index.ts` | Barrel exports |
| `apps/web/src/lib/commercial/dashboard.test.ts` | Model + OPS catalog unit tests |
| `apps/web/src/lib/ops/catalog.ts` | Slice E catalog types |
| `docs/111-ops-001…/02-event-catalog.md` | Document Slice E events |

### APIs (staff-only)

| Path | Change |
|------|--------|
| `apps/web/src/app/api/master-admin/commercial/dashboard/route.ts` | GET aggregates |
| `apps/web/src/app/api/master-admin/commercial/engagements/route.ts` | GET/POST marketplace prep |

### UI (UX-012 Slice A tokens · ADMIN-003 composition)

| Path | Change |
|------|--------|
| `apps/web/src/components/master-admin/commercial-dashboard-panel.tsx` | Staff dashboard + engagement prep card |
| `apps/web/src/app/(app)/master-admin/commercial/page.tsx` | Compose dashboard above existing ops panel |

---

## 3. Commercial dashboard architecture

```
Master Admin /master-admin/commercial
  → requireMasterAdminPageAccess
  → CommercialDashboardPanel
       → GET /api/master-admin/commercial/dashboard (requireMasterAdminApiAccess)
            → service-role queries:
                 organizations.commercial_status
                 commercial_implementation_progress
                 commercial_health_scores
                 commercial_opportunities
                 commercial_offboarding_states
                 commercial_renewal_alerts
                 commercial_feature_discovery_states
                 commercial_implementation_engagements / partners
                 saas_subscriptions / saas_invoices
            → secret-free commercial.dashboard.opened (optional)
```

| Widget | Source |
|--------|--------|
| New customers (30d) | `organizations` active + `created_at` window |
| Trials | `commercial_status=trial` + `saas_subscriptions.status=trialing` |
| Active orgs | `commercial_status=active` |
| Implementation queue | progress `score < 100` |
| AI / Professional prefs | opportunity `implementation_preference` |
| Past due | `saas_subscriptions.status=past_due` |
| Revenue | Estimated list MRR from active/trialing × `PLAN_DISPLAY` list prices |
| Health bands | `commercial_health_scores.band` |
| Renewals | `commercial_renewal_alerts` status / milestone keys |
| Support | Marked unavailable (no linked ticket SoT) |

---

## 4. Marketplace preparation

| Table | Role |
|-------|------|
| `commercial_implementation_partners` | Partner directory stubs (`stub`/`pending`/`active`/`suspended`) |
| `commercial_implementation_engagements` | ImplementationEngagement: path · provider_type · partner_id nullable · status · progress_score · `access_grant_id` reserved |

Constraints:
- `mpa_internal` ⇒ `partner_id` must be null  
- `certified_partner` ⇒ partner stub id required (API-enforced; no picker UI)  
- `access_grant_id` reserved for AUTH-001 Professional time-boxed grants — not issued in Slice E  

Staff can record mpa_internal engagements from the Commercial HQ card. Partner marketplace UI / activation deferred.

---

## 5. ADMIN-003 composition

- Reuses existing HQ route `/master-admin/commercial` and `MasterAdminSubnav` item **Commercial**.  
- No new top-level navigation.  
- Dashboard panel stacked above existing Slice A–D `CommercialOpsPanel`.  
- Does not replace Mission Control / ADMIN-003 Operations Center.

---

## 6. OPS event additions

| Event | When |
|-------|------|
| `commercial.dashboard.opened` | Staff dashboard load (`emitOpened=1`) |
| `commercial.engagement.created` | New engagement row |
| `commercial.engagement.status_changed` | Engagement status transition |

Payloads: aggregate counts / path / provider_type / status only — no Stripe secrets or credentials.

---

## 7. Remaining work outside COM-001

| Item | Status |
|------|--------|
| OPS-001 Slice B notify productization | 🔒 Separate authorize |
| UX-012 Slice B Command Center chrome | 🔒 Separate authorize |
| PMX-004 Phase 2 | 🔒 Separate authorize |
| Certified partner marketplace UI / picker / ratings | 🔒 Post–E separate Authorize |
| Linked support-ticket SoT for Support widget | External / as available |
| COM package complete after Slice E Validated | Pending `VALIDATE COM-001 SLICE E` |

---

## 8. Preserved behavior

- AUTH-001 A–E — staff gate via Master Admin capability; Finish Setup / Professional grants unchanged.  
- COM-001 A–D — consumed as inputs; models not redesigned.  
- OPS-001 Slice A — catalog + emit only.  
- UX-012 Slice A — `--mpa-*` tokens on dashboard panel.  
- BILL-001 — subscription/invoice mirrors + display list prices only.

---

## 9. Recommendation

Validation recorded: [42](./42-slice-e-validation.md) · **`VALIDATE COM-001 SLICE E` → PASS**.

COM-001 approved slices A–E are **COMPLETE**. Do **not** begin OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 · partner marketplace UI without their own authorize phrases.
