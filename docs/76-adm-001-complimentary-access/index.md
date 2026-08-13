# ADM-001 MASTER ADMIN COMPLIMENTARY ACCESS & TESTER PROVISIONING

**Status:** Draft — design revision (beta invitation workflow); awaiting re-Approve  
**Date:** 2026-08-13 (revised)  
**Gate:** Design → Document → **Approve** → Implement (ADR-012)  
**Related ADR:** [ADR-022](../18-decision-log/adr-022-master-admin-complimentary-access.md) (Accepted; amendment Proposed)  
**Production:** NO DEPLOYMENT from this package  

**Revision note:** Replaces direct operator account/org creation with a **customer-style invitation → signup/login → Guided Setup → Mission Control** beta path. Prior implement-first path (docs/77) is **superseded for onboarding semantics** until this revision is Approved.

---

## Problem statement

M.P.A. Production billing and entitlements are live. Before public launch, authorized operators need a controlled way to invite **beta testers** who experience the product like paying customers — without fake Stripe subscriptions or billing bypass.

Direct account creation / skip-setup provisioning is insufficient: testers must receive a normal invitation, complete Guided Setup/tutorial, and land in Mission Control with full granted-plan entitlements.

---

## Goals

1. Preserve entitlement **sources**: `STRIPE_SUBSCRIPTION` | `MASTER_ADMIN_GRANT` (Stripe always wins when active).  
2. Master Admin invites by **email + plan + expiration** (reason/notes as today).  
3. Tester receives a **customer-style invitation**, signs up or logs in, completes **Guided Setup**, then receives **full paid-tier feature access** for the granted plan via `MASTER_ADMIN_GRANT`.  
4. **Never** create Stripe Customers/Subscriptions/Prices for complimentary testers.  
5. Tester lifecycle: `INVITED` → `ACTIVE` → (`EXPIRED` | `REVOKED`).  
6. Audit create / activate / extend / revoke / expire.  
7. Reuse existing invitation, Guided Setup, SKU entitlement matrix, and Master Admin auth.

## Non-goals

- Fake Stripe objects or Price changes  
- Changing commercial checkout / webhook math for paying customers  
- Skipping Guided Setup for testers  
- Customer self-serve “free plan”  
- New customer RBAC / EntitlementKey capabilities  
- Impersonation redesign  

---

## Binding beta tester flow

```
Master Admin (/admin/testers)
  → email + plan + expiration (+ reason)
  → Organization invitation (customer-style)
  → Tester signup / login
  → Guided Setup (same path as paying customer Day-1)
  → Full plan access via MASTER_ADMIN_GRANT
  → Mission Control
```

Alignment with Product Constitution commercial journey:

| Paying customer | Complimentary beta tester |
|-----------------|---------------------------|
| Landing → product → Stripe Checkout | Master Admin invite (no Checkout) |
| Create Account | Signup / login via invitation |
| Guided Setup | Guided Setup (**required**) |
| Mission Control (Stripe entitlements) | Mission Control (`MASTER_ADMIN_GRANT` entitlements) |

Payment is replaced by an authorized grant; **account → Guided Setup → Mission Control** order is preserved.

---

## Architecture

### Entitlement resolution (unchanged precedence)

```
getOrganizationCommercialState(organizationId)
  │
  ├─ IF organization has ACTIVE Stripe-backed subscription
  │     (stripe_subscription_id IS NOT NULL
  │      AND status IN active|trialing|past_due per existing lifecycle rules)
  │     → source = STRIPE_SUBSCRIPTION
  │     → entitlements = entitlementsForSku(subscription.sku_code)
  │
  ├─ ELSE IF MASTER_ADMIN_GRANT is entitlement-active
  │     (tester_lifecycle = ACTIVE
  │      AND start_date <= now()
  │      AND (expiration_date IS NULL OR expiration_date > now()))
  │     → source = MASTER_ADMIN_GRANT
  │     → entitlements = entitlementsForSku(plan_granted)
  │
  └─ ELSE
        → fail closed for paid features
        → (legacy non-Stripe admin assign may coexist for emergency repair only)
```

**Stripe precedence preserved.** Grants never mutate Stripe rows.

### Tester lifecycle

| Lifecycle | Meaning | Entitlement effect |
|-----------|---------|--------------------|
| `INVITED` | Invitation sent; tester has not completed activation (accept + Guided Setup product confirmation) | **No** paid-tier access yet |
| `ACTIVE` | Tester accepted invite and completed Guided Setup gate for the granted plan | Full `entitlementsForSku(plan_granted)` |
| `EXPIRED` | Past `expiration_date` (lazy or hygiene job) | Paid features removed |
| `REVOKED` | Operator revoked access | Paid features removed |

Lifecycle is stored on the grant (see data model). Transition rules:

1. **Create invite** → `INVITED` (audit `MASTER_ADMIN_GRANT_CREATED`)  
2. **Invitation accepted + Guided Setup product confirmed** → `ACTIVE` (audit `MASTER_ADMIN_GRANT_ACTIVATED`)  
3. **Past expiration while ACTIVE/INVITED** → `EXPIRED` (audit `MASTER_ADMIN_GRANT_EXPIRED`)  
4. **Operator revoke** from `INVITED` or `ACTIVE` → `REVOKED` (audit `MASTER_ADMIN_GRANT_REVOKED`)  
5. **Extend** only from `ACTIVE` (or `INVITED` before expiry); updates `expiration_date` (audit `MASTER_ADMIN_GRANT_EXTENDED`)

`INVITED` grants must not unlock Mission Control paid modules. Baseline platform paths needed to accept the invite and run Guided Setup remain available (same as unpaid/setup customers today).

### Provisioning flow (authoritative — invitation based)

1. Operator opens `/admin/testers`.  
2. Enters tester **email**, selects **plan** (PM / FO / Complete), **duration/expiration**, **reason** (optional notes).  
3. System creates (or reuses) a **normal organization** intended for that tester — without Stripe.  
4. System sends a **customer-style organization invitation** (reuse team/support invitation patterns and email presentation; do not invent a parallel auth stack).  
5. Grant row is inserted with `tester_lifecycle = INVITED`, `plan_granted`, expiration, reason.  
6. Tester receives email → **signup or login** → accepts invitation → membership established.  
7. Tester is routed into **Guided Setup** and must complete the setup/tutorial path (product confirmation + checklist behavior consistent with paying Day-1).  
8. On Guided Setup completion gate for this flow → lifecycle `ACTIVE`; entitlements resolve from `MASTER_ADMIN_GRANT`.  
9. Tester uses Mission Control and product surfaces with **full paid-tier features for the granted plan**.  
10. **Forbidden:** Stripe Customer/Subscription creation; setting `organization_subscriptions.stripe_subscription_id` for the grant.

### Onboarding behavior

| Topic | Behavior |
|-------|----------|
| Invitation UX | Same family as customer org invites (claim/accept link, email copy may note “beta access” without exposing admin internals) |
| Account | Tester creates credentials or logs in; no operator-created password handoff as the primary path |
| Guided Setup | **Required** — do not mark setup complete at invite time |
| Product confirmation | Granted plan is preselected / confirmed as the setup product so the tester does not enter Stripe Checkout to choose a plan |
| Tutorial / Day-1 | Same Guided Setup and first-run surfaces as paying customers for that SKU |
| Mission Control | Available after setup completion when lifecycle is `ACTIVE` |
| Team invites later | Normal org membership rules apply inside the tester org |

### Billing display behavior

| Surface | Complimentary tester (`MASTER_ADMIN_GRANT`) | Paying (`STRIPE_SUBSCRIPTION`) |
|---------|-----------------------------------------------|--------------------------------|
| Plan label | Granted plan name (PM / FO / Complete) | Stripe SKU plan name |
| Billing / subscription page | Show **Complimentary / Beta access** (or equivalent), expiration if any; **no** fake invoices; **no** “pay now” for the grant itself |
| Upgrade / Checkout CTAs | Allowed only if product wants conversion; must not imply an existing Stripe sub |
| Past-due / dunning | **Not applicable** (no Stripe sub) |
| Cancel subscription | Not applicable; access ends by expire/revoke |
| MRR widgets (admin) | Excluded |

If a tester later converts via real Checkout, Stripe source takes precedence and the grant should be revoked or left inert under Stripe-win rules.

### Analytics separation

| Metric / stream | Treatment |
|-----------------|-----------|
| Paid MRR / ARR | **Exclude** grants |
| Subscription counts | **Exclude** complimentary orgs unless explicitly labeled “beta seats” in a separate non-revenue metric |
| Product analytics (feature usage) | May include testers; tag `entitlement_source=MASTER_ADMIN_GRANT` / `beta_tester=true` when emitting |
| Funnel / Checkout conversion | Do not count invite→setup as Checkout conversion |
| Support audit | Grant lifecycle events only (see Audit) |

### Expiration handling

- Correctness is **read-time**: if `expiration_date <= now`, treat as not entitlement-active even before status flip.  
- Lazy or scheduled hygiene: set lifecycle `EXPIRED`, emit `MASTER_ADMIN_GRANT_EXPIRED`.  
- `INVITED` past expiration cannot activate; invite is dead.  
- Extend updates `expiration_date` only; does not create Stripe objects.  
- Revoke immediately removes paid access; invitation accept after revoke must not activate.

### Data model

Table: `public.master_admin_access_grants` (revise / migrate as needed)

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `organization_id` | uuid NOT NULL FK → organizations | Target org |
| `granted_by_user_id` | uuid NOT NULL FK → auth.users | Operator actor |
| `tester_email` | text NOT NULL | Invite target (normalized); avoid extra PII |
| `invitation_id` | uuid NULL FK → organization_invitations | Link to customer-style invite when available |
| `plan_granted` | text NOT NULL | Product SKU codes |
| `tester_lifecycle` | text NOT NULL | `INVITED` \| `ACTIVE` \| `EXPIRED` \| `REVOKED` |
| `start_date` | timestamptz NOT NULL | Window start (activation or invite policy; document in implement) |
| `expiration_date` | timestamptz NULL | NULL only with explicit confirmation |
| `reason` | text NOT NULL | |
| `notes` | text NULL | |
| `activated_at` | timestamptz NULL | When lifecycle → ACTIVE |
| `created_at` / `updated_at` | timestamptz NOT NULL | |
| `revoked_at` / `revoked_by_user_id` | optional | |

Constraints / indexes:

- Check plan + lifecycle enums  
- Index `(organization_id, tester_lifecycle, expiration_date)`  
- At most one **INVITED or ACTIVE** grant per organization (history retained for EXPIRED/REVOKED)

RLS:

- Operators: SELECT/INSERT/UPDATE  
- Members: SELECT on own org only as needed for entitlement evaluation (not manage)  
- Customers never create/extend/revoke grants  

### Coexistence

| Path | Use |
|------|-----|
| Stripe Checkout → provisioning | Paying customers |
| ADM-001 invitation + grant | Beta / complimentary testers |
| Legacy `/admin/commercial/subscriptions` SKU assign | Emergency repair only — **not** the beta tester path |

---

## Master Admin UI

**Route:** `/admin/testers`  
**Nav:** Master Admin → Customers → Testers.

| Action | Detail |
|--------|--------|
| Invite tester | Email, plan (PM / FO / Complete), duration (7d / 30d / custom / no expiration + confirmation), reason, optional notes |
| List | Filters: Invited / Active / Expired / Revoked |
| Resend invitation | While `INVITED` |
| Extend | Update expiration on `INVITED` or `ACTIVE` |
| Revoke | Lifecycle → `REVOKED` |

UI rules: `MasterAdminShell` / Canopy; operator-only; no customer-facing grant management.

---

## Security model

| Control | Requirement |
|---------|-------------|
| Actor | Platform operators / Master Admin only for invite, extend, revoke, resend |
| APIs | `/api/admin/testers/**` operator-gated |
| Entitlement enforcement | Unchanged gates; only SKU **source** expands when lifecycle `ACTIVE` |
| Org isolation | Grant + invitation scoped to `organization_id` |
| Customer permissions | No new EntitlementKey / RBAC |
| Stripe safety | Never create/update Stripe subscriptions for grants |
| Invitation security | Reuse existing invite token / expiry / accept checks |

---

## Audit trail

Reuse `platform_support_audit_events` (preferred).

| Event | When |
|-------|------|
| `MASTER_ADMIN_GRANT_CREATED` | Invite + grant row (`INVITED`) |
| `MASTER_ADMIN_GRANT_ACTIVATED` | Lifecycle → `ACTIVE` after setup gate |
| `MASTER_ADMIN_GRANT_EXTENDED` | Expiration changed |
| `MASTER_ADMIN_GRANT_REVOKED` | Revoke |
| `MASTER_ADMIN_GRANT_EXPIRED` | Expiry hygiene / first read after expiry |

Payload: actor (operator or system), organization id, plan, grant id, tester email (invite), timestamp, reason on create.

---

## Billing impact

| Item | Impact |
|------|--------|
| Stripe Prices / Checkout / webhooks | **None** (paying path unchanged) |
| Paying subscriptions | **Unaffected** (Stripe wins) |
| Fake Stripe subscriptions | **Forbidden** |
| MRR/ARR | Grants **excluded** |
| Tester billing UI | Complimentary/beta display only |

---

## Database / implementation impact (after re-Approve)

| Change | Notes |
|--------|-------|
| Grant table + lifecycle columns + invitation link | Required |
| Invitation send on create | Reuse customer invitation infrastructure |
| Activation hook on Guided Setup completion | Sets `ACTIVE` |
| Entitlement resolver | Treat only `ACTIVE` + in-window as grant source |
| Admin UI filters / resend | Required |
| Prior direct-provision implement | Must be aligned or replaced to match this flow |

---

## Testing plan (post re-Approve)

1. **Auth:** Non-operator denied; operator can invite.  
2. **Lifecycle:** Create → `INVITED` (no paid modules); after accept + Guided Setup → `ACTIVE` (full plan entitlements).  
3. **Expiration / revoke:** Remove paid access.  
4. **Precedence:** Active Stripe subscription wins over grant.  
5. **Billing UI:** No fake Stripe sub; complimentary labeling.  
6. **Analytics:** Grants excluded from MRR.  
7. **Regression:** Existing billing tests remain green.

---

## Rollout considerations

1. Re-Approve this revision + accept ADR-022 amendment.  
2. Align any in-flight ADM-001 implementation to invitation + Guided Setup (do not ship direct-create as the beta path).  
3. Prefer finite expirations.  
4. No Production deploy until Owner authorizes.  
5. Do not backfill legacy Subscription Console assigns as grants.

---

## Implementation status (this package)

| Item | Status |
|------|--------|
| Design revision (invitation beta flow) | **Complete (Draft)** |
| Document | **This record** |
| Approve | **Pending** (material change restarted gate) |
| ADR-022 amendment | **Proposed** |
| Application code | Must match this revision after Approve; prior cert (docs/77) onboarding semantics superseded |
| Production deploy | **NO** |

---

## Approval checklist

- [ ] Product Owner approves invitation → Guided Setup beta workflow  
- [ ] Architect accepts ADR-022 amendment (lifecycle + invite activation)  
- [ ] Security review of invite + grant RLS  
- [ ] Status on this doc → **Approved**  
- [ ] Only then: Implement / align code → test → Owner-authorized deploy  

**Silence is not approval** (ADR-012 / Implementation Gate).
