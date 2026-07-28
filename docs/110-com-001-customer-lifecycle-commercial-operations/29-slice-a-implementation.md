# 29 — COM-001 Slice A Implementation Summary

**Package:** COM-001 — Customer Lifecycle & Commercial Operations  
**Slice:** **A — Commercial data foundation**  
**Authorization:** [28](./28-slice-a-authorization.md) · [CORE-003 §46](../113-core-003-implementation-master-plan/46-com-001-slice-a-authorization.md)  
**Status:** ✅ **IMPLEMENTED** · ✅ **VALIDATED** ([30](./30-slice-a-validation.md) · **PASS**)  
**Date:** 2026-07-24  

> Validation: [30 — Slice A Validation](./30-slice-a-validation.md).  
> COM-001 Slice B · OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 **not** implemented.

---

## 1. Deliverables completed

| Area | Result |
|------|--------|
| Pipeline & opportunity model | `commercial_opportunities` with COM stages Lead → … → Customer Active (+ Lost); required commercial fields capturable |
| Activation handoff packet | Secret-free packet with required COM fields + `idempotency_key`; COM ledger `commercial_activation_requests` prevents duplicate handoffs |
| Won → Organization flow | Stage transitions **never** create orgs; org creation only via activation → AUTH-001 |
| AUTH-001 integration | `activateOpportunityFromPayment` calls `provisionOrganizationFromActivation` (no parallel provisioner) |
| Opportunity ↔ organization link | Unique `organization_id` on opportunity; set after successful provision; retries reuse link |
| OPS events | Secret-free `commercial.*` catalog types on OPS-001 Slice A bus |
| Ops-minimum surfaces | Master Admin APIs + `/master-admin/commercial` panel (not CRM product / Slice E dashboard) |

---

## 2. Files changed

### Schema

| Path | Change |
|------|--------|
| `supabase/migrations/20260725030000_com001_slice_a_opportunities.sql` | **Added** — opportunities + activation ledger (RLS on, service-role / Master Admin APIs) |

**Applied on:** Supabase `mpa-prod` as `com001_slice_a_opportunities` (prior session)

### Commercial services

| Path | Change |
|------|--------|
| `apps/web/src/lib/commercial/types.ts` | Stages, packet types, Won↛org stage set |
| `apps/web/src/lib/commercial/opportunities.ts` | CRUD, stage transitions, org link |
| `apps/web/src/lib/commercial/activation.ts` | Idempotent handoff → AUTH provision → link |
| `apps/web/src/lib/commercial/ops-events.ts` | Secret-free OPS emit helpers |
| `apps/web/src/lib/commercial/index.ts` | Barrel |
| `apps/web/src/lib/commercial/opportunities.test.ts` | CA-03 / CA-04 unit coverage |

### AUTH / BILL wiring

| Path | Change |
|------|--------|
| `apps/web/src/lib/integrations/saas-billing/contracts.ts` | `SaasActivationHints` + opportunity / sales / implementation fields |
| `apps/web/src/lib/integrations/saas-billing/stripe-provider.ts` | Parse COM metadata on checkout |
| `apps/web/src/lib/saas/server.ts` | Checkout → `activateOpportunityFromPayment` (COM → AUTH) |
| `apps/web/src/app/api/master-admin/provision-organization/route.ts` | Level-0 path via COM activation (CA-07 trail) |

### OPS

| Path | Change |
|------|--------|
| `apps/web/src/lib/ops/catalog.ts` | COM-001 Slice A event types |
| `apps/web/src/lib/ops/envelope.ts` | Allow null `organizationId` for pre-link commercial events |
| `docs/111-ops-001-platform-operations-architecture/02-event-catalog.md` | Commercial catalog section |

### Ops-minimum APIs / UI (UX-012 Slice A tokens)

| Path | Change |
|------|--------|
| `apps/web/src/app/api/master-admin/commercial/opportunities/route.ts` | List / create / update / stage transition |
| `apps/web/src/app/api/master-admin/commercial/activate/route.ts` | Master Admin commercial activation |
| `apps/web/src/components/master-admin/commercial-ops-panel.tsx` | Ops-minimum staff tooling |
| `apps/web/src/app/(app)/master-admin/commercial/page.tsx` | Route |
| `apps/web/src/components/master-admin/master-admin-subnav.tsx` | Commercial nav |
| `apps/web/src/lib/master-admin/workspace-catalog.ts` | Sales workspace link |

---

## 3. Opportunity lifecycle

```
lead → mql → sql → discovery → demo → proposal → negotiation → won
  → subscription_purchased → organization_created → customer_active
                                                        ↘ lost (lost_reason required)
```

**Binding:** Transitioning to **Won** (or any earlier stage) does **not** create an organization.

---

## 4. Activation handoff

Required packet fields (secret-free):

| Field | Source |
|-------|--------|
| `saas_subscription_id` | BILL / checkout |
| `plan_code` | Opportunity / hints |
| `organization_type` | Opportunity / hints |
| `buyer_contact_email` | Opportunity / hints |
| `buyer_company_name` | Opportunity / hints |
| `implementation_preference` | Opportunity / hints (default `ai_guided`) |
| `sales_owner_id` | Opportunity / actor |
| `idempotency_key` | Caller-stable key |
| `opportunity_id` | Pipeline record |

COM ledger `commercial_activation_requests.idempotency_key` is unique — duplicate handoffs replay completed results.

---

## 5. AUTH integration

```
Payment Successful / Master Admin exception
  → commercial_activation_requests (pending)
  → provisionOrganizationFromActivation(auth_idempotency_key = com:{key})
  → link opportunity.organization_id
  → stage organization_created
  → commercial.activation.completed (OPS)
```

AUTH-001 Slice B ledger remains the org-provision SoT. COM does not duplicate provision logic.

---

## 6. Organization linkage

- `commercial_opportunities.organization_id` unique when set  
- Set only after AUTH provision success  
- Retries with same activation key / same org id do not create duplicate links  

---

## 7. Event catalog additions

| Event | Notes |
|-------|-------|
| `commercial.opportunity.created` | staff_only · may have null org |
| `commercial.opportunity.stage_changed` | staff_only |
| `commercial.activation.requested` | staff_only · pre-AUTH |
| `commercial.activation.completed` | staff_only · org linked |
| `commercial.activation.failed` | staff_only · reason codes only |

---

## 8. Remaining COM-001 Slice B work (not started)

Locked until **`AUTHORIZE COM-001 SLICE B`** after Slice A Validated:

- Implementation progress score ([18](./18-implementation-progress.md))  
- Trial experience ([24](./24-trial-experience.md))  
- No commercial dashboard productization (Slice E)  

Also still locked: OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2.

---

## 9. Acceptance mapping (implementation intent)

| ID | Implementation coverage |
|----|-------------------------|
| CA-01 | Pipeline stages in schema + services |
| CA-02 | Required fields on opportunity model / APIs |
| CA-03 | `stageTransitionCreatesOrganization` always false; activation-only provision |
| CA-04 | `buildActivationPacket` + ledger snapshot |
| CA-05 | COM + AUTH idempotency keys |
| CA-06 | `linkOpportunityOrganization` after provision |
| CA-07 | Level-0 / `/commercial/activate` via COM trail |
| CA-08 | Secret-free OPS payloads + staff_only |
| CA-09 | Reuse AUTH/invite; no public signup added |
| CA-10 | This document · boards updated · scope held |

---

## 10. Recommendation

Proceed to:

```
VALIDATE COM-001 SLICE A
```

Do **not** begin COM-001 Slice B until Slice A Validation **PASS**.
