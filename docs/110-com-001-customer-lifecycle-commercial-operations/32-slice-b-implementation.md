# 32 — COM-001 Slice B Implementation Summary

**Package:** COM-001 — Customer Lifecycle & Commercial Operations  
**Slice:** **B — Implementation progress + trial experience**  
**Authorization:** [31](./31-slice-b-authorization.md) · [CORE-003 §48](../113-core-003-implementation-master-plan/48-com-001-slice-b-authorization.md)  
**Status:** ✅ **IMPLEMENTED** · ✅ **VALIDATED** ([33](./33-slice-b-validation.md) · **PASS**)  
**Date:** 2026-07-24  

> Validation: [33 — Slice B Validation](./33-slice-b-validation.md).  
> COM-001 Slice C · OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 **not** implemented.

---

## 1. Deliverables completed

| Area | Result |
|------|--------|
| Implementation score | Org-scoped 0–100% milestone ladder (Purchased → Production Ready); idempotent refresh |
| Milestone tracking | Persistable milestones + waive/defer/solo-ack; Production Ready gated by Finish Setup + recovery contact |
| Visibility | Customer card (Organization settings); Master Admin / CS lookup API + commercial panel |
| Trial lifecycle | 14-day trial · 3-day grace · reminder hooks · status machine |
| BILL-001 convert | Same-org upgrade via Stripe Customer Portal (`startTrialConversion`) |
| OPS events | Secret-free `commercial.implementation.*` / `commercial.trial.*` on Slice A bus |
| Surfaces | UX-012 `--mpa-*` tokens; ops-minimum only (not Slice E dashboard) |

---

## 2. Files changed

### Schema

| Path | Change |
|------|--------|
| `supabase/migrations/20260725040000_com001_slice_b_progress_trial.sql` | **Added** — `commercial_implementation_progress`, `commercial_trial_states` |

**Applied on:** Supabase `mpa-prod` as `com001_slice_b_progress_trial`

### Commercial services

| Path | Change |
|------|--------|
| `apps/web/src/lib/commercial/progress-types.ts` | Milestone / trial types + defaults |
| `apps/web/src/lib/commercial/progress.ts` | Score compute + persist + waive/defer |
| `apps/web/src/lib/commercial/trial.ts` | Trial refresh, reminders, BILL convert |
| `apps/web/src/lib/commercial/ops-events.ts` | Slice B event types |
| `apps/web/src/lib/commercial/index.ts` | Barrel exports |
| `apps/web/src/lib/commercial/progress.test.ts` | Score + reminder unit tests |
| `apps/web/src/lib/auth/recovery/commercial-activate.ts` | Refresh score after Finish Setup → active |
| `apps/web/src/lib/ops/catalog.ts` | Slice B catalog types |
| `docs/111-ops-001…/02-event-catalog.md` | Document Slice B events |

### APIs

| Path | Change |
|------|--------|
| `apps/web/src/app/api/organizations/[organizationId]/implementation-progress/route.ts` | GET/POST progress |
| `apps/web/src/app/api/organizations/[organizationId]/trial/route.ts` | GET/POST trial + convert |
| `apps/web/src/app/api/master-admin/commercial/progress/route.ts` | CS/Support lookup |

### UI (UX-012 Slice A tokens)

| Path | Change |
|------|--------|
| `apps/web/src/components/commercial/implementation-progress-card.tsx` | Customer score card |
| `apps/web/src/components/commercial/trial-status-banner.tsx` | Trial / grace / upgrade CTA |
| `apps/web/src/app/(app)/settings/organization/page.tsx` | Embed progress card |
| `apps/web/src/app/(app)/settings/billing/page.tsx` | Embed trial banner |
| `apps/web/src/components/master-admin/commercial-ops-panel.tsx` | Ops-minimum progress/trial lookup |

---

## 3. Implementation score model

```
purchased (0%) → organization_created (10%) → stripe_connected (25%)
  → properties_imported (40%) → units_imported (55%) → tenants_imported (70%)
  → team_invited (85%) → production_ready (100%)
```

- Score = **highest contiguous completed/waived milestone** (monotonic).  
- **Production Ready** requires `organizations.commercial_status = active` **and** ready secondary recovery contact (AUTH-001 Finish Setup).  
- Purchased / Organization Created cannot be waived.  
- Stripe Connected / portfolio milestones may be waived or deferred with reason; Team Invited supports solo-admin acknowledgment.

---

## 4. Trial lifecycle

| Status | Meaning |
|--------|---------|
| `not_trial` | No trial subscription |
| `trial_active` | Within BILL `trial_ends_at` |
| `trial_grace` | Up to 3 days after expiry (view + billing focused) |
| `converted` | Paid plan via BILL-001 (same org) |
| `expired_cancelled` | Grace ended |

Clock default: derived from BILL-001 `trial_ends_at` (Payment Successful window).  
Reminder keys (secret-free OPS hooks): `day0`, `day3`, `day7`, `t3`, `t1`, `expiry`, `grace`.  
Watermark policy default: `pm_ui_badge` (PM UI only).

---

## 5. BILL-001 conversion integration

```
Trial active / grace
  → startTrialConversion
  → createSaasPortalSession (same organizationId)
  → customer upgrades in Stripe Portal
  → webhook mirrors paid plan
  → trial status → converted
```

No new organization is created on convert. Checkout redesign is out of scope.

---

## 6. Commercial progress events

| Event | When |
|-------|------|
| `commercial.implementation.score_updated` | Score / highest milestone changed |
| `commercial.implementation.milestone_updated` | Waive / defer / solo-ack |
| `commercial.trial.status_changed` | Trial status transition |
| `commercial.trial.reminder_due` | Reminder hook due |
| `commercial.trial.convert_started` | Portal convert started |

---

## 7. Remaining COM-001 Slice C work (not started)

Locked until **`AUTHORIZE COM-001 SLICE C`** after Slice B Validated:

- Customer health score ([19](./19-customer-health-score.md))  
- Feature discovery ([20](./20-feature-discovery.md))  
- Customer communication timeline ([23](./23-customer-communication-timeline.md))  

Also still locked: OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2.

---

## 8. Acceptance mapping (implementation intent)

| ID | Coverage |
|----|----------|
| CB-01 | Milestone ladder + score persist |
| CB-02 | Org-scoped milestones + signals |
| CB-03 | Customer card + Master Admin lookup |
| CB-04 | Production Ready gates Finish Setup + recovery |
| CB-05 | 14d / grace / watermark policy / trial caps via BILL + matrix |
| CB-06 | Reminder keys + OPS `reminder_due` |
| CB-07 | Grace status + portal convert |
| CB-08 | No public signup; COM-A activation preserved |
| CB-09 | Secret-free OPS; AUTH activate hook only refreshes score |
| CB-10 | This document · boards · scope held |

---

## 9. Recommendation

Proceed to:

```
VALIDATE COM-001 SLICE B
```

Do **not** begin COM-001 Slice C until Slice B Validation **PASS**.
