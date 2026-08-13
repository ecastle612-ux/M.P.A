# ADM-001 MASTER ADMIN COMPLIMENTARY ACCESS & TESTER PROVISIONING

**Status:** Approved  
**Date:** 2026-08-13  
**Gate:** Design → Document → Approve → **Implement** (ADR-012)  
**Related ADR:** [ADR-022](../18-decision-log/adr-022-master-admin-complimentary-access.md) (Accepted)  
**Production:** NO DEPLOYMENT from this package  
**Authorization:** Product Owner implementation authorization 2026-08-13

---

## Problem statement

M.P.A. Production billing and entitlements are live. Before public launch, authorized operators need a **controlled** way to give testers product access (PM, FO, Complete) without:

- Creating fake Stripe subscriptions  
- Modifying Stripe Prices  
- Weakening entitlement enforcement  
- Broadening customer-facing permissions  
- Silently altering paying customer subscriptions  

Today, Master Admin can assign an `organization_subscriptions` SKU via `/admin/commercial/subscriptions`. That path has **no expiration, weak source semantics, and no dedicated grant audit**. It is unsuitable as the long-term complimentary / tester model.

---

## Goals

1. Introduce an explicit entitlement **source** model: `STRIPE_SUBSCRIPTION` | `MASTER_ADMIN_GRANT`.  
2. Allow Master Admin (platform operators) to create time-bounded (or explicitly unlimited) grants.  
3. Resolve entitlements so Stripe always wins when an active Stripe-backed subscription exists.  
4. Auto-deny paid features when a grant is expired or revoked.  
5. Audit create / extend / revoke / expire actions.  
6. Reuse existing SKU entitlement matrix (`entitlementsForSku`) and Master Admin auth (`platform_operators` / `isPlatformOperatorUser`).

## Non-goals

- Fake Stripe objects or Price changes  
- Changing commercial checkout / webhook math  
- Migrating existing paid subscriptions  
- Customer self-serve “free plan”  
- New customer RBAC capabilities  
- Impersonation redesign (View As remains separate)

---

## Architecture

### Entitlement resolution (authoritative)

```
getOrganizationCommercialState(organizationId)
  │
  ├─ IF organization has ACTIVE Stripe-backed subscription
  │     (organization_subscriptions.stripe_subscription_id IS NOT NULL
  │      AND status IN active|trialing|past_due per existing lifecycle rules)
  │     → source = STRIPE_SUBSCRIPTION
  │     → sku = subscription.sku_code
  │     → entitlements = entitlementsForSku(sku)
  │
  ├─ ELSE IF active Master Admin grant exists
  │     (grant_status = active
  │      AND start_date <= now()
  │      AND (expiration_date IS NULL OR expiration_date > now()))
  │     → source = MASTER_ADMIN_GRANT
  │     → sku = plan_granted
  │     → entitlements = entitlementsForSku(sku)
  │
  └─ ELSE
        → sku = null (or existing non-Stripe admin assign — see Coexistence)
        → restrict paid features (current fail-closed baseline)
```

**Stripe precedence:** An active Stripe-backed subscription always overrides a grant. Grants must not mutate Stripe or overwrite Stripe subscription rows.

**Expiration:** Evaluation is time-based at read time (no cron required for correctness). Optional job may mark `grant_status = expired` and emit `MASTER_ADMIN_GRANT_EXPIRED` for audit hygiene.

### Data model (proposed migration — not implemented)

Table: `public.master_admin_access_grants`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `organization_id` | uuid NOT NULL FK → organizations | Target org |
| `granted_by_user_id` | uuid NOT NULL FK → auth.users | Actor |
| `plan_granted` | text NOT NULL | `mpa_property_manager` \| `mpa_facility_operations` \| `mpa_complete_platform` |
| `grant_status` | text NOT NULL | `active` \| `revoked` \| `expired` |
| `start_date` | timestamptz NOT NULL | Default now() |
| `expiration_date` | timestamptz NULL | NULL = no expiration (requires explicit confirmation in UI) |
| `reason` | text NOT NULL | Short operator reason |
| `notes` | text NULL | Optional; no unnecessary PII |
| `created_at` | timestamptz NOT NULL | |
| `updated_at` | timestamptz NOT NULL | |
| `revoked_at` | timestamptz NULL | |
| `revoked_by_user_id` | uuid NULL | |

Constraints / indexes:

- Check `plan_granted` against product SKU codes  
- Check `grant_status` enum  
- Index `(organization_id, grant_status, expiration_date)`  
- Partial unique index: at most **one active** grant per organization (revoked/expired history retained)

RLS:

- SELECT/INSERT/UPDATE: `is_platform_operator()` only  
- No customer membership policies (customers never manage grants)

### Provisioning flow (create grant)

1. Operator opens `/admin/testers` (Master Admin only).  
2. Enter tester **email** → resolve or create user + organization via **existing** support/provisioning patterns (reuse; do not invent a second org model).  
3. Select plan + duration + reason.  
4. Insert grant row; write audit event.  
5. Do **not** create Stripe Customer/Subscription.  
6. Do **not** set `organization_subscriptions.stripe_subscription_id`.  
7. Optionally mark Guided Setup product confirmed so Day-1 can proceed (same as today’s admin assign UX) — without inventing a paid subscription.

### Coexistence with `/admin/commercial/subscriptions`

| Path | Use after ADM-001 approval |
|------|----------------------------|
| Stripe Checkout → provisioning | Paying customers |
| ADM-001 grants | Time-bounded / complimentary testers |
| Legacy SKU assign console | Prefer deprecate for testers; keep for emergency SKU repair with audit |

Implementation must document migration guidance: new tester access uses grants only.

---

## Master Admin UI

**Route:** `/admin/testers`  
**Nav:** Add under Master Admin → Customers (or Commercial) in `MASTER_ADMIN_NAV`.

Capabilities:

| Action | Detail |
|--------|--------|
| Create grant | Email, plan (PM / FO / Complete), duration (7d / 30d / custom / no expiration + confirmation), reason, optional notes |
| List grants | Filters: active / expired / revoked |
| Extend | Update `expiration_date`; audit |
| Revoke | Set `grant_status = revoked`, `revoked_at`, actor; audit |

UI rules:

- Reuse `MasterAdminShell` / Canopy patterns (no new design language)  
- No customer-facing surfaces  
- Fail closed if caller is not platform operator  

---

## Security model

| Control | Requirement |
|---------|-------------|
| Actor auth | `isPlatformOperatorUser` / `platform_operators.status = active` (existing Master Admin gate) |
| API surface | `/api/admin/testers/**` — operator-only; no org-member access |
| Entitlement enforcement | Unchanged route/API entitlement checks; only **source of SKU** expands |
| Org isolation | Grants scoped by `organization_id`; operators act across orgs by design (Master Admin OS) |
| Customer permissions | **No** new `EntitlementKey` / RBAC capabilities for customers |
| PII | Store org id + email only as needed for lookup; avoid unnecessary personal fields in grant row |
| Stripe safety | Never call Stripe to create/update subscriptions for grants |

---

## Audit trail

Prefer extending `platform_support_audit_events` (Owner Ops) or `audit_events` with platform-operator actions. Event names:

| Event | When |
|-------|------|
| `MASTER_ADMIN_GRANT_CREATED` | Insert active grant |
| `MASTER_ADMIN_GRANT_EXTENDED` | Expiration changed |
| `MASTER_ADMIN_GRANT_REVOKED` | Revoke |
| `MASTER_ADMIN_GRANT_EXPIRED` | Optional hygiene job / first read after expiry |

Payload: actor user id, organization id, plan, grant id, timestamp, reason (create).

---

## Billing impact

| Item | Impact |
|------|--------|
| Stripe Prices | **None** |
| Checkout / webhooks | **None** |
| Paying subscriptions | **Unaffected** (Stripe source wins) |
| MRR/ARR reporting | Grants must be **excluded** from paid billing metrics |
| Fake Stripe subscriptions | **Forbidden** |

---

## Database changes

| Change | Status now |
|--------|------------|
| New table `master_admin_access_grants` + RLS | **Proposed** — requires approved migration after gate Approve |
| Entitlement resolver read path | **Proposed** code change after Approve |
| No change to Stripe-linked subscription lifecycle tables | Required |

---

## Testing plan (post-Approve)

1. **Auth:** Non-operator → 401/403 on grant APIs; operator → allowed.  
2. **Entitlement:** Active grant unlocks SKU routes; expired/revoked removes access.  
3. **Precedence:** Org with Stripe-backed active subscription ignores grant SKU.  
4. **Isolation / audit:** Grant rows and audit events written correctly.  
5. **Regression:** Existing commercial / billing / admin tests remain green.

---

## Rollout considerations

1. Approve this doc + ADR-022.  
2. Implement behind Master Admin only; no Production deploy until Owner authorizes.  
3. Seed grants only for known tester orgs.  
4. Prefer finite expirations; unlimited requires explicit UI confirmation.  
5. Monitor audit events; revoke on abuse.  
6. Do not backfill historical Subscription Console assigns automatically.

---

## Implementation status (this package)

| Item | Status |
|------|--------|
| Design | **Complete** |
| Document | **Complete** |
| Approve | **Approved** (implementation authorization) |
| Application code / migration / UI | See [docs/77-adm-001-implementation-certification](../77-adm-001-implementation-certification/) |
| Production deploy | **NO** (Owner authorization required separately) |

---

## Approval checklist

- [x] Product Owner approves complimentary grant model and UI scope  
- [x] Architect accepts ADR-022 (entitlement source precedence + schema)  
- [x] Security model documented (RLS / operator-only APIs)  
- [x] Status on this doc → **Approved**  
- [ ] Production deploy — only after Owner-authorized release
