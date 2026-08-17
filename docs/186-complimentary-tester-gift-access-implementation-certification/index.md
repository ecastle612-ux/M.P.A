# 186 — Complimentary Tester / Gift Access Implementation Certification

**Status:** Implemented / certified in-repo. **Not deployed. Migration not applied to Production.**  
**Date:** 2026-08-17  
**Authority:** Owner approval of [docs/185](../185-complimentary-tester-gift-access/index.md)  
**Production:** stop — no Vercel deploy · no Supabase apply  

---

## Verdict

The approved Complimentary Tester / Gift Access package is implemented in-repo.

M.P.A. automates everything after Master Admin **Send Access**. Complimentary access is a server-owned grant, not a Stripe subscription, not a $0 Checkout, and not a public free plan.

**Do not claim paid PM / FO / Complete live subscriptions were completed.** They were not. The docs/183–184 payment-execution waiver still stands.

---

## Owner decisions used

| Decision | Implementation |
|----------|----------------|
| Approve Complimentary Tester / Gift Access | This package |
| Tester feedback Reply-To | `enterprise@my-property-assistant.com` |
| TESTER and GIFT are Master Admin / platform-operator only | Admin routes + RLS write policies |
| No public free plan | No public signup route; claim is token-gated |
| No card for complimentary access | Grant + claim never create Stripe objects |
| Never automatically charge at expiration | Expiry mail and expired page say so; no Stripe charge path |
| Paid conversion is recipient-selected plan/cycle + normal Checkout | CTA → `/pricing?from=complimentary` |
| Paid subscription takes precedence | `paidSubscriptionTakesPrecedence` in middleware, limits, and effective access |
| Preserve existing org and data on conversion | Paid `ensureOrganization` reuses complimentary `organization_id` |
| Expiration/revocation must not delete data | Expire/revoke change grant status only |
| Limits optional and server-enforced | `product_normal` / `custom` / `unlimited`; create blocked, rows not deleted |
| Gift may have No Expiration | Duration preset `none` |
| Tester welcome asks for bugs/errors/confusion/suggestions + screenshots | Welcome copy contract + Reply-To |

---

## Owner workflow (kept simple)

Email → TESTER/GIFT → Property Manager / Facility Operations / Complete → duration or No Expiration → optional limit → **Send Access**.

After Send Access, M.P.A. creates the grant, emails the branded claim link, provisions on claim, and maintains INVITED / ACTIVE / EXPIRED / REVOKED.

---

## Implemented surface

| Piece | Where |
|-------|--------|
| Server-owned grant + audit | `complimentary_access_grants`, `complimentary_access_events` (`20260817180000_docs_185_complimentary_access.sql`) |
| Secure / idempotent claim | `/complimentary/claim` + `POST /api/complimentary/claim` (hashed token, email lock, SKU lock, existing-user reuse) |
| Branded welcome email | Resend foundation shell + Reply-To `enterprise@my-property-assistant.com` |
| Guided Setup / provisioning | Claim creates one org + SKU (no Stripe IDs); Guided Setup keeps granted SKU |
| Lifecycle | INVITED → ACTIVE → EXPIRED / REVOKED; Convert Tester → Gift; Extend; Change Limit; Remove Expiration |
| Master Admin directory | `/admin/commercial/complimentary-access` |
| Expiration behavior | Status change only; data retained |
| Pre-expiration CTA | Expiry email + Guided Setup banner → Continue With M.P.A. |
| Complimentary → paid | Same org; `converted_at`; paid SKU/limits/billing win |
| Optional limits | Enforced in unit-capacity pre-check when no paid Stripe subscription |
| Audit history | `complimentary_access_events` |
| Expired-access experience | `/complimentary/expired` + Choose a Plan |

---

## Explicitly not done

- Fake Stripe subscriptions
- $0 Stripe Checkout
- Auto-charge testers
- Public pricing / catalog change
- Tenant Stripe execution
- M5
- July reopen
- Public free signup
- Production deploy
- Production migration apply

---

## Tests (docs/185 §8)

Vitest on this branch: `@mpa/shared` complimentary + commercial + entitlements **37 + 27 passed**; `@mpa/web` complimentary service/routes/org/provisioning **18 + provisioning suite passed**. No Production apply.

| Check | Result |
|-------|--------|
| Operator-only grant/change/revoke | **PASS** (admin route 403 for non-operators) |
| Claim reuses existing auth user | **PASS** |
| Claim cannot change SKU | **PASS** (409 `claim_cannot_change_sku`) |
| Resend idempotent (one org per grant) | **PASS** (same grant id; one org) |
| Guided Setup keeps granted SKU | **PASS** (commerce context + claim SKU lock) |
| PM cannot open FO (and inverse); Complete keeps ADR-033 | **PASS** |
| Paid subscription supersedes complimentary | **PASS** |
| Conversion does not duplicate org | **PASS** |
| Expiry does not delete data | **PASS** (`deletedOrganizations: []`) |
| Limit blocks create, does not delete | **PASS** (`wouldDelete: false`) |
| Welcome/expiry copy contracts | **PASS** (Reply-To + screenshot ask + no auto-charge) |
| No Stripe Price / July / tenant-execution / M5 mutation | **PASS** |

---

## Exact Production release gate

**STOP.** This package is not live.

Owner must separately authorize **one** Production package that does both:

1. Apply migration `supabase/migrations/20260817180000_docs_185_complimentary_access.sql` to Production Supabase (`mpa-prod`).
2. Deploy the application revision that contains this package to Vercel Production (`m-p-a-web`).

Do not apply the migration without the app deploy. Do not deploy the app without the migration. Do not replay unused stamps. Do not create Stripe Prices, $0 Checkouts, or complimentary Stripe subscriptions as part of that gate.
