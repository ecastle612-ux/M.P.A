# Pre-Marketing P1 Product Cleanup

**Status:** Implemented (in-repo) · **P1-01 through P1-07 CLOSED**  
**Date:** 2026-08-17  
**Authority:** `docs/178-customer-launch-readiness-audit/index.md` · Owner-approved P1-01–P1-07 only  
**Gate:** Smallest safe UX / authorization-presentation fixes. No Production deploy.

---

## Scope

Implemented P1-01 through P1-07 only.

This package does **not**:

- enable tenant Stripe payment execution
- enable M5
- change SaaS prices / SKUs / Stripe Price IDs
- change FIN-OPS money
- reopen July
- modify historical migrated finance data
- weaken RLS / RBAC / ADR-033 / PLAT-005 / PLAT-006
- implement Stripe Customer Portal
- deploy Production
- implement P1-08 / P1-09 / P1-10

---

## Verdict

| Item | Status |
|------|--------|
| P1-01 Tenant Billing | **CLOSED** |
| P1-02 Staff finance terminology | **CLOSED** |
| P1-03 Collections while M5 unauthorized | **CLOSED** |
| P1-04 SaaS checkout claim UX | **CLOSED** |
| P1-05 Guided Setup SKU safety | **CLOSED** |
| P1-06 Team Deactivate | **CLOSED** |
| P1-07 Billing honesty | **CLOSED** |

Unresolved (out of this package): P1-08 Privacy/Terms, P1-09 FO/Complete Price env gate, P1-10 `maintenance_notifications`.

---

## Behavior before / after

### P1-01 Tenant Billing

**Before:** `GET /api/finance/resident/billing` set `onlinePaymentsEnabled` from `isStripeConfigured()` (`STRIPE_SECRET_KEY`). Tenant Portal always rendered **Pay now**, disabled only when that flag was false, and copy implied online pay was coming (“isn’t configured yet”).

**After:** Online-pay presentation requires organization `stripe_payment_execution_enabled === true` **and** current occupancy (`access === "active"`). Unlinked and execution-off responses are `onlinePaymentsEnabled: false` regardless of Stripe keys. **Pay now** is hidden when unavailable. Balances, history, and receipts remain. Label stays **Billing**. Checkout POST still 403s `stripe_payment_execution_disabled` when execution is false.

### P1-02 Staff finance terminology

**Before:** Staff surfaces used “Collect rent” / “Pay now” guidance that implied live online rent collection.

**After:** Affected surfaces use **Record payment** / **Open balances** / manual-payment wording. Manual payment, reminders, and “Collected this month” metrics remain. Finance calculations and APIs are unchanged.

### P1-03 Collections

**Before:** Collections UI exposed Assess late fees, Sync delinquency, reminder, arrangement, and policy mutation controls while M5 APIs already hard-stopped.

**After:** While `isFinanceM5Authorized()` is false, those mutation controls are not shown. Aging, overdue table, late-fee queue, and vendor AP remain. API POST kinds still return `finance_m5_not_authorized`. M5 is not implemented.

### P1-04 SaaS claim UX

**Before:** Success/continue copy pushed a browser claim CTA. Missing bind token surfaced as raw `bind_token_required`.

**After:** Bind-token architecture is unchanged (email-only plaintext, server hash, expiry, email match, idempotency, fail-closed). Success and continue tell the purchaser to check email. Continue does not primary-CTA into sign-up without a bind token. Customer-facing errors map `bind_token_required` to “Check your email to finish setting up your M.P.A. account.”

### P1-05 Guided Setup SKU safety

**Before:** `POST /api/organizations` assigned `mpa_property_manager` for every non-operator create. Commerce-backed Guided Setup could silently create a PM organization.

**After:** Purchased SKU is authoritative when commerce/session/job state can be resolved. Already-provisioned commerce refuses a second create. Unresolved commerce fails closed. Operators may still pass `productSku` when commerce is absent. Guided Setup hides the generic create form when an acquisition SKU cookie is present. Prices / Price IDs unchanged.

### P1-06 Team Deactivate

**Before:** Membership PATCH already supported `status: "inactive"` but the team UI had no Deactivate action. No last-admin guard.

**After:** Authorized administrators see a restrained Deactivate action with confirmation. PATCH still sets `inactive` (row retained). Unauthorized callers get 403. Deactivation that would leave zero active Organization Admins is refused. Complete BOTH-admin guard is unchanged.

### P1-07 Billing honesty

**Before:** Checkout cancel claimed “Duplicate subscriptions are prevented automatically.” Billing & Plan did not say plan/card/cycle changes are not self-service.

**After:** No Customer Portal. Copy states cancel-at-period-end, reactivate, and Additional Unit Capacity are available; card/plan/cycle changes are not self-service and directs the user to support.

---

## Files changed

### New

- `apps/web/src/lib/finance/resident-online-pay.ts`
- `apps/web/src/lib/finance/resident-online-pay.test.ts`
- `apps/web/src/lib/saas-provisioning/commerce-claim-copy.ts`
- `apps/web/src/lib/saas-provisioning/commerce-claim-copy.test.ts`
- `apps/web/src/lib/organization/manual-org-create.ts`
- `apps/web/src/lib/organization/manual-org-create.test.ts`
- `apps/web/src/lib/organization/resolve-commerce-org-create.ts`
- `apps/web/src/lib/pre-marketing-p1/p1-copy-contracts.test.ts`
- `apps/web/src/app/api/finance/resident/billing/resident-billing.route.test.ts`
- `apps/web/src/app/api/organizations/organizations.route.test.ts`
- `apps/web/src/app/api/organizations/[organizationId]/memberships/memberships.route.test.ts`
- `docs/179-pre-marketing-p1-cleanup/index.md`

### Application / shared

- `apps/web/src/app/api/finance/resident/billing/route.ts`
- `apps/web/src/components/finance/resident-billing-portal.tsx`
- `apps/web/src/components/finance/financial-operations-command-center.tsx`
- `apps/web/src/components/finance/finance-desk.tsx`
- `apps/web/src/components/finance/collections-desk.tsx`
- `apps/web/src/components/leasing/lease-command-center.tsx`
- `apps/web/src/lib/finance/m5-hard-stop.ts`
- `apps/web/src/components/marketing/checkout-success-page.tsx`
- `apps/web/src/components/marketing/commerce-continue-page.tsx`
- `apps/web/src/components/marketing/checkout-cancel-page.tsx`
- `apps/web/src/components/shell/login-form.tsx`
- `apps/web/src/app/api/organizations/route.ts`
- `apps/web/src/components/commercial/guided-setup-page.tsx`
- `apps/web/src/app/api/organizations/[organizationId]/memberships/route.ts`
- `apps/web/src/components/team/team-invite-panel.tsx`
- `apps/web/src/components/commercial/billing-plan-page.tsx`
- `packages/shared/src/auth/operating-scope.ts`
- `packages/shared/src/property/journey.ts`
- Staff next-action hrefs/copy: lease/resident/property/daily-ops/admin J4–J5 surfaces
- `docs/README.md`

---

## Tests

Owner-required coverage:

1. Tenant Pay now hidden when `stripe_payment_execution_enabled=false`
2. Tenant payment action cannot be exposed from `STRIPE_SECRET_KEY` alone
3. Existing enabled-path checkout remains authorization protected (`checkout.route.test.ts`, `checkout-authz.test.ts`)
4. No customer-facing Collect rent on affected staff surfaces
5. M5 mutation controls absent/disabled while M5 unauthorized
6. M5 APIs remain hard-stopped (`collections.route.test.ts`)
7. SaaS success tells customer to check email
8. Raw `bind_token_required` is not presented to the customer
9. PM/FO/Complete commerce claims retain correct SKU
10. Commerce-backed setup cannot silently create PM fallback
11. Authorized admin can deactivate membership
12. Unauthorized user cannot deactivate membership
13. Historical membership record is retained (`inactive`)
14. Billing UI does not claim unsupported Customer Portal / plan-change behavior

Targeted Vitest, lint, typecheck, and Production `next build` are recorded in the implementation PR.

---

## Unresolved blockers

None for P1-01–P1-07.

Out of package: P1-08 / P1-09 / P1-10; tenant Stripe execution remains off; M5 remains unauthorized; no Production deploy.
