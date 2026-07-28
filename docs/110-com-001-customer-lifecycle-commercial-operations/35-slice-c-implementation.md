# 35 — COM-001 Slice C Implementation Summary

**Package:** COM-001 — Customer Lifecycle & Commercial Operations  
**Slice:** **C — Health score + feature discovery + communication timeline**  
**Authorization:** [34](./34-slice-c-authorization.md) · [CORE-003 §50](../113-core-003-implementation-master-plan/50-com-001-slice-c-authorization.md)  
**Status:** ✅ **IMPLEMENTED** · ✅ **VALIDATED** ([36](./36-slice-c-validation.md) · **PASS**)  
**Date:** 2026-07-25  

> Validation: [36 — Slice C Validation](./36-slice-c-validation.md).  
> COM-001 Slice D · OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 **not** implemented.

---

## 1. Deliverables completed

| Area | Result |
|------|--------|
| Health score | Org-scoped 0–100 with Healthy → Needs Attention → At Risk → Critical; deterministic penalties; explainable drivers; CS cadence posture |
| Health drivers | Approved factor set only ([19]): login, adoption, AI, setup (Slice B), payment, support (as available), onboarding, notifications |
| Feature discovery | Entitlement-safe catalog; dismiss/snooze/accept + 21d cooldown; Past Due suppresses non-billing prompts |
| Communication timeline | Unified commercial/success timeline (org + opportunity-linkable); secret scrubbing; distinct from OPS activity timeline |
| OPS events | Secret-free `commercial.health.*` / `commercial.discovery.*` / `commercial.timeline.*` on Slice A bus |
| Surfaces | Org settings cards/banner + Master Admin Slice C lookup — UX-012 `--mpa-*` tokens; ops-minimum only |

---

## 2. Files changed

### Schema

| Path | Change |
|------|--------|
| `supabase/migrations/20260725050000_com001_slice_c_health_discovery_timeline.sql` | **Added** — `commercial_health_scores`, `commercial_feature_discovery_states`, `commercial_communication_timeline` |

**Applied on:** Supabase `mpa-prod` as `com001_slice_c_health_discovery_timeline`

### Commercial services

| Path | Change |
|------|--------|
| `apps/web/src/lib/commercial/health-types.ts` | Bands · factors · CS cadence · snapshot types |
| `apps/web/src/lib/commercial/health.ts` | Signal load · deterministic compute · idempotent upsert · OPS emit |
| `apps/web/src/lib/commercial/discovery-types.ts` | Discovery catalog + entitlement requirements |
| `apps/web/src/lib/commercial/discovery.ts` | Entitlement filter · eligibility · impress/dismiss/snooze/accept · timeline log |
| `apps/web/src/lib/commercial/timeline.ts` | Append/list · metadata sanitization · opportunity link · OPS emit |
| `apps/web/src/lib/commercial/ops-events.ts` | Slice C event types |
| `apps/web/src/lib/commercial/index.ts` | Barrel exports |
| `apps/web/src/lib/commercial/progress.ts` | Best-effort health refresh on material score change |
| `apps/web/src/lib/commercial/health.test.ts` | Band / penalty / entitlement / secret scrub tests |
| `apps/web/src/lib/ops/catalog.ts` | Slice C catalog types |
| `docs/111-ops-001…/02-event-catalog.md` | Document Slice C events |

### APIs

| Path | Change |
|------|--------|
| `apps/web/src/app/api/organizations/[organizationId]/health/route.ts` | GET/POST health refresh |
| `apps/web/src/app/api/organizations/[organizationId]/discoveries/route.ts` | GET/POST impress · dismiss · snooze · accept |
| `apps/web/src/app/api/organizations/[organizationId]/communication-timeline/route.ts` | GET list · POST CS note |
| `apps/web/src/app/api/master-admin/commercial/health/route.ts` | CS/Support Slice C lookup |

### UI (UX-012 Slice A tokens)

| Path | Change |
|------|--------|
| `apps/web/src/components/commercial/org-health-card.tsx` | Customer/CS health card |
| `apps/web/src/components/commercial/feature-discovery-banner.tsx` | Primary discovery surface |
| `apps/web/src/components/commercial/communication-timeline-panel.tsx` | Org timeline + optional CS note |
| `apps/web/src/app/(app)/settings/organization/page.tsx` | Embed Slice C surfaces |
| `apps/web/src/components/master-admin/commercial-ops-panel.tsx` | Ops-minimum Slice C lookup |

---

## 3. Health score architecture

```
Signals (org-scoped)
  → computeHealthFromSignals (deterministic penalties)
  → bandFromScore (75 / 50 / 25 thresholds)
  → upsert commercial_health_scores
  → emit commercial.health.score_updated (if score/band changed)
```

| Band | Min score | CS cadence |
|------|-----------|------------|
| Healthy | 75 | Standard 30/90 |
| Needs Attention | 50 | Within 5 business days |
| At Risk | 25 | Within 1–2 business days |
| Critical | 0 | Same day |

**Idempotent recalculation:** same signals → same score/band/drivers; upsert by `organization_id`.  
**Material refresh:** API refresh · implementation score change (Slice B hook).

---

## 4. Health drivers (approved factors only)

| Factor | High weight? | Source |
|--------|--------------|--------|
| `payment_status` | ✔ | BILL `saas_subscriptions.status` + org `commercial_status` |
| `login_frequency` | ✔ | Org Admin / PM `last_sign_in_at` via memberships |
| `property_setup` | | Slice B implementation score / Production Ready |
| `outstanding_onboarding` | | Age + not Production Ready |
| `feature_adoption` | | Maintenance entitled + work order count |
| `ai_usage` | | `ai_copilot` entitlement + `ai_conversations` count |
| `support_requests` | | As available (unavailable → factor marked unavailable, no invented signal) |
| `notification_engagement` | | `notification_preferences` channel flags |

Drivers returned are top penalties with human-readable labels for operators.

---

## 5. Feature discovery

| Key | Required entitlement | Notes |
|-----|----------------------|-------|
| `payments_gap` | `financials` | Billing-safe during Past Due |
| `ai_never_used` | `ai_copilot` | |
| `no_technicians` | `maintenance` | |
| `notifications_off` | (none) | Channels all off |
| `owner_reports_unused` | `owner_portal` | |
| `low_wo_adoption` | `maintenance` | |

- One primary discovery at a time; dismiss/snooze/accept persisted.  
- Cooldown after dismiss: **21 days**.  
- Past Due / Unpaid / Canceled / Paused suppress non-`billingSafe` prompts.  
- Impressions / accepts / dismissals / snoozes append to communication timeline.

---

## 6. Communication timeline

Table `commercial_communication_timeline` is the commercial/success SoT (not a redesign of `ops_activity_timeline`).

Minimum fields: timestamp · org and/or opportunity · channel · template key · direction · actor · delivery status · secret-free summary/metadata.

Pre-org: opportunity-only rows allowed; after org link, append resolves linked opportunity when present.

Credential scrubbing: metadata keys matching password/token/secret stripped; summaries reject temp-password payloads.

---

## 7. OPS integration

| Event | When |
|-------|------|
| `commercial.health.score_updated` | Score or band changed |
| `commercial.discovery.impressed` | Primary impress logged |
| `commercial.discovery.accepted` | Accept |
| `commercial.discovery.dismissed` | Dismiss |
| `commercial.discovery.snoozed` | Snooze |
| `commercial.timeline.entry_appended` | Timeline row inserted |

Payloads: ids / band / score / discovery_key / delivery_status / template_key only — no secrets.  
Delivery productization remains OPS-001 Slice B (out of scope).

---

## 8. Remaining COM-001 Slice D work (not started)

Locked until **`AUTHORIZE COM-001 SLICE D`** after Slice C Validated:

- Customer offboarding ([21](./21-customer-offboarding.md))  
- CS motions automation (30/90, renewals alerts)  

Also still locked: OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 · COM-001 Slice E.

---

## 9. Acceptance mapping (implementation intent)

| ID | Coverage |
|----|----------|
| CC-01 | Bands + thresholds + persist |
| CC-02 | Approved factor set + high-weight payment/login |
| CC-03 | `CS_CADENCE_BY_BAND` on snapshot |
| CC-04 | Drivers array on snapshot + ops UI |
| CC-05 | Entitlement filter + catalog |
| CC-06 | Dismiss/snooze/accept + timeline logging |
| CC-07 | Timeline table + org/opportunity |
| CC-08 | Entry types + secret scrubbing |
| CC-09 | Secret-free OPS; A/B preserved (progress/trial untouched semantically) |
| CC-10 | This document · boards · scope held |

---

## 10. Recommendation

Validated:

```
VALIDATE COM-001 SLICE C
```

→ ✅ **PASS** ([36](./36-slice-c-validation.md)). COM-001 Slice D remains locked until a separate authorize phrase.
