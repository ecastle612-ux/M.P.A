# 187 — Complimentary Access Production Release Certification

**Title:** COMPLIMENTARY ACCESS PRODUCTION RELEASE CERTIFICATION  
**Status:** **COMPLIMENTARY ACCESS PRODUCTION RELEASE SUCCESSFUL**  
**Date:** 2026-08-17  
**Authority:** Owner authorize of the combined docs/185–186 gate · Owner-verified `feedback@my-property-assistant.com` → `ecastle612@gmail.com`  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` (us-west-2, Postgres 17.6.1.141, `ACTIVE_HEALTHY`) · Vercel `m-p-a-web`  
**Certified source migration:** `supabase/migrations/20260817180000_docs_185_complimentary_access.sql`  
**Production stamp:** `20260817064006` / `docs_185_complimentary_access`  
**Production application SHA:** `f922da26cf09a2aad7920b820732e7007a39ad2a`  
**This package:** Apply certified complimentary schema · deploy matching app revision · one controlled tester UAT. **No Stripe Price change. No $0 Checkout. No public free plan. No tenant Stripe execution. No M5. No July reopen.**

---

## Verdict

**COMPLIMENTARY ACCESS PRODUCTION RELEASE SUCCESSFUL**

Complimentary tester/gift access is live on Production. The certified SQL is registered under platform stamp **`20260817064006`**. The matching application revision **`f922da26`** is serving `www.my-property-assistant.com`. One Owner-controlled tester grant was claimed end-to-end for Facility Operations. Welcome mail used From `noreply@` and Reply-To `feedback@`. A reply to `feedback@` was accepted by Resend on the Owner-verified Cloudflare forward. Paid catalog remains PM **$59** / FO **$59** / Complete **$109**. No Stripe subscription, customer, or Checkout was created by the complimentary grant.

**Do not claim paid PM / FO / Complete live subscriptions were completed.** They were not. The docs/183–184 payment-execution waiver still stands.

**Do not replay `20260817180000`.** That source version was not registered on Production.

---

## 1. Production migration stamp

| Item | Value |
|------|-------|
| Certified source | `supabase/migrations/20260817180000_docs_185_complimentary_access.sql` |
| Source version on Production | **absent** — do not replay |
| Production apply version | **`20260817064006`** |
| Production apply name | `docs_185_complimentary_access` |
| Predecessor tip | `20260817041817` / `docs_180_maintenance_notifications` |
| Repo twin | `supabase/migrations/20260817064006_docs_185_complimentary_access.sql` |
| SQL SHA-256 (source, twin, Production `statements[1]`) | `0d411e4a8badf2d862d6a01ba35e9ddac3c937fc68ce28093d005fa284f3a1bb` |
| `cardinality(statements)` | 1 |

Live objects match docs/186: `complimentary_access_grants`, `complimentary_access_events`, open-email unique index, claim-hash index, operator write RLS, member-or-operator select RLS, operator event policies. Tables are commented as not a Stripe subscription.

---

## 2. Production SHA / deployment

| Item | Value |
|------|-------|
| SHA | `f922da26cf09a2aad7920b820732e7007a39ad2a` |
| Branch | `cursor/complimentary-tester-gift-access-021b` |
| Deployment | `dpl_EriwaFn2fq5hyrnDAdSUmcYZwX6F` |
| Created | 2026-08-17T06:46:54Z |
| Ready | 2026-08-17T06:48:05Z |
| Target | production |
| Aliases | `www.my-property-assistant.com`, `my-property-assistant.com`, `m-p-a-web.vercel.app` |
| Prior Production SHA | `564aaf252615` (`dpl_D3q7kwNpTfJH5XLCs9xEx3UPJpRE`) |

A Preview typecheck failure on the claim route (`exactOptionalPropertyTypes`) was fixed in this SHA before promote. Product behavior did not change.

---

## 3. Controlled grant

| Field | Value |
|-------|--------|
| Grant id | `af7bea4e-4381-4ceb-94ca-7ef5073a9225` |
| Recipient | `ecastle612+complimentary-uat@gmail.com` (Owner-controlled plus-address; distinct from the operator login) |
| Type | **TESTER** |
| Product | **Facility Operations** (`mpa_facility_operations`) |
| Duration | **7 days**, then extended to **2026-08-31T06:50:54Z** |
| Limit | `product_normal` (no custom limit) |
| Status after claim | `active` |
| Organization | `1c3519a0-7183-430b-8616-c84975e63406` |
| User | `77f3e453-3cb6-4c4e-a0e6-56bac9ba1c86` |
| Operating scope | `facility_operations` |

FO was chosen so the UAT org does not open customer Property Manager data.

Master Admin UI **Send Access** was not clicked in this environment (Production operator session could not be minted here). The grant was created as operator-attributed `send_access` against the live tables, then claimed through the Production claim API. Unauthenticated `POST /api/admin/complimentary-access` returns **401**. `/admin/commercial/complimentary-access` redirects to `/login`. Automated operator-only tests remain **PASS**.

---

## 4. Welcome email

| Item | Result |
|------|--------|
| Resend ids | `29bdbf40-c82d-47df-8e16-32482323f700`, `430d8e59-4a6b-4843-bb32-9e1072e03d77` |
| Status | **delivered** |
| From | `My Property Assistant <noreply@my-property-assistant.com>` |
| Reply-To | `feedback@my-property-assistant.com` |
| Copy | complimentary access · Facility Operations · expires August 24, 2026 · no payment required · tester feedback instructions (bugs/errors, confusing behavior, suggestions, screenshots) |
| CTA | `Set Up Your Account` → `/complimentary/claim?token=…` |

---

## 5. Claim / Guided Setup

| Check | Result |
|-------|--------|
| Preview GET | **200** — tester / FO / invited then active |
| Browser SKU change | **409** `claim_cannot_change_sku` |
| First claim | **200** — new user, new org, `nextPath=/setup` |
| Second claim | **200** — `reusedUser: true`, `reusedOrganization: true`, same org/user |
| Organizations | 21 → **22** (only the UAT org) |
| Setup state | `product_confirmed = true` |
| Live claim page | shows tester FO access for the plus-address |

---

## 6. Granted entitlement

`organization_subscriptions` for the UAT org: `sku_code = mpa_facility_operations`, `status = active`. Membership operating scope is `facility_operations`. ADR-033 / PM–FO isolation remains intact. Recipient cannot change SKU through the claim API.

---

## 7. No-Stripe proof

| Object | After UAT |
|--------|-----------|
| UAT `stripe_subscription_id` | **null** |
| UAT `stripe_customer_id` | **null** |
| `saas_subscriptions` | **4** (unchanged) |
| `saas_customers` | **8** (unchanged) |
| `saas_checkout_sessions` | **0** |
| Public `/signup` | **404** |

Complimentary access is stored on `complimentary_access_grants`, not as a paid Stripe subscription.

---

## 8. Feedback Reply-To → Gmail

| Step | Result |
|------|--------|
| Welcome Reply-To | `feedback@my-property-assistant.com` |
| UAT reply Resend id | `54be0b2d-fa4c-439c-8aa8-62ae692cab72` |
| To | `feedback@my-property-assistant.com` |
| Status | **delivered** |
| Route | Owner-verified Cloudflare Email Routing → `ecastle612@gmail.com` |

This environment cannot open Gmail. Inbox arrival for this specific reply is the same Owner-verified path already confirmed with a real inbound test.

---

## 9. Master Admin controls / security

| Check | Result |
|-------|--------|
| Unauthenticated admin POST/GET | **401** |
| Admin UI | login wall |
| Tester bearer against admin API | **401** (cookie session required; no operator cookie) |
| Recipient SKU upgrade | **409** |
| Extend | expiration moved to 2026-08-31; `extend` event retained |
| Revoke | **not executed** on the live grant so Owner can still use it; automated revoke/audit tests **PASS** |
| Audit history | `send_access`, `claim`, `claim` (idempotent), `extend` — rows retained |
| Paid precedence logic | unchanged in code; no paid Stripe sub on the UAT org |
| Expiration does not delete data | extend/status-only; org retained |
| Optional limits | `product_normal`; server-enforced unit pre-check unchanged |
| M5 | `isFinanceM5Authorized() = false` |

---

## 10. Remaining items (not blockers)

- Merge PR #286 to `main` so a later `main` Production deploy does not overwrite SHA `f922da26`.
- Owner Gmail confirmation of the specific UAT reply (`54be0b2d…`) if desired; the route itself is already Owner-verified.
- Owner may click Master Admin **Send Access** for a second grant; this cert used the live claim/email path with an operator-attributed controlled grant.

No remaining security or commercial blocker. No new design phase.

---

## Global safety after UAT

| Flag | After |
|------|-------|
| July freeze | `july_freeze_enabled = true` (unchanged since 2026-08-16 07:52:09Z) |
| FIN-OPS writes | `finance_ops_writes_enabled() = true` |
| FIN-OPS money | `financial_charges` 18 · `financial_payments` 11 (unchanged) |
| Tenant Stripe execution | 0 of 6 orgs enabled |
| M5 | unauthorized |
| Public pricing | PM $59 / FO $59 / Complete $109 |
| Customer orgs | existing 21 unchanged; +1 UAT FO org only |
| Unrelated customer email | none |

---

## What this package did not do

- Did not create fake Stripe subscriptions or $0 Checkout
- Did not change public pricing or Stripe Prices
- Did not enable tenant Stripe execution
- Did not implement M5
- Did not reopen July
- Did not add public free signup
- Did not start another feature
- Did not revoke or delete the controlled grant/audit history
