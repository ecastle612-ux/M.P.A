# 186 — Complimentary Tester / Gift Access Implementation Certification

**Status:** **READY FOR COMPLIMENTARY ACCESS PRODUCTION RELEASE.** Implemented / certified in-repo. Not deployed. Migration not applied.  
**Date:** 2026-08-17  
**Authority:** Owner approval of [docs/185](../185-complimentary-tester-gift-access/index.md); Owner-verified `feedback@` inbound  
**Branch SHA (implement):** `c6da35b27843ae71f8f9b15b4f93105668f297ae`  
**Production:** ready — stop before apply/deploy until Owner authorizes the combined gate below

---

## Verdict

**READY FOR COMPLIMENTARY ACCESS PRODUCTION RELEASE.**

The complimentary package is implemented in-repo. Owner verified inbound routing:

`feedback@my-property-assistant.com` → `ecastle612@gmail.com` (real inbound test received).

Complimentary TESTER and GIFT welcome mail now uses:

- **From:** `My Property Assistant <noreply@my-property-assistant.com>` (existing Resend sender; unchanged)
- **Reply-To:** `feedback@my-property-assistant.com`
- **Shared branded Resend shell** (`renderFoundationEmail` / `renderBrandedEmail`) with Production lockup `/branding/logo-email-lockup.png`, white/mist card, Canopy green CTA `#0F6B56`, and plain claim-link fallback
- **Headline:** `Your Complimentary {Property Manager | Facility Operations | Complete Platform} Access`
- **Expiration:** `Expires on …` or `No expiration.` for eligible gifts
- **Payment line retained:** no payment required during complimentary period; will not be charged automatically
- **CTA:** Set Up Your Account

Tester welcome still asks recipients to reply with bugs/errors, confusing behavior, suggestions, and screenshots when useful. Gift omits that tester-feedback paragraph and still uses the same Reply-To.

### Presentation-only email fix (2026-08-17)

Complimentary welcome mail was presentation-weak relative to other transactional templates. No schema, entitlement, Stripe, pricing, finance, M5, July, or authorization change. Focused re-run: `@mpa/email` shell **8 passed**; `@mpa/shared` complimentary-access **10 passed**; `@mpa/web` complimentary + branded email **6 passed**.

Public legal / Enterprise contact remains `enterprise@my-property-assistant.com`. That is not the tester reply path.

**Do not claim paid PM / FO / Complete live subscriptions were completed.** They were not. The docs/183–184 payment-execution waiver still stands.

---

## Owner decisions used

| Decision | Implementation |
|----------|----------------|
| Approve Complimentary Tester / Gift Access | This package |
| Tester / Gift Reply-To | `feedback@my-property-assistant.com` (Owner-verified forward to Gmail) |
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
| Branded welcome email | Resend foundation shell; From `noreply@`; Reply-To `feedback@my-property-assistant.com` |
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

Focused Reply-To / complimentary-access re-run after Owner-verified `feedback@` routing: `@mpa/shared` `complimentary-access.test.ts` + `resend.test.ts` **18 passed**; `@mpa/web` complimentary emails / service / commercial-freeze **12 passed**. From remains `My Property Assistant <noreply@my-property-assistant.com>`. Reply-To is `feedback@my-property-assistant.com` for TESTER and GIFT.

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
| Welcome/expiry copy contracts | **PASS** (Reply-To `feedback@` + screenshot ask + no auto-charge) |
| No Stripe Price / July / tenant-execution / M5 mutation | **PASS** |

---

## Feedback email routing (Owner-verified 2026-08-17)

Owner configured and verified inbound:

`feedback@my-property-assistant.com` → `ecastle612@gmail.com`

A real inbound test was received successfully. App Reply-To for complimentary TESTER and GIFT welcome mail is now `feedback@my-property-assistant.com`. From remains `My Property Assistant <noreply@my-property-assistant.com>`.

Earlier inspect (same day, before Owner action): Resend sending verified / receiving disabled; apex had no MX; Cloudflare Email Routing was the correct inbound host. That blocker is **cleared by Owner verification**. Do not enable Resend receiving on the apex. Do not edit `resend._domainkey` or `send.*` SES records.

---

## Feedback email routing inspection (2026-08-17, superseded)

Owner required From `My Property Assistant <noreply@my-property-assistant.com>` and Reply-To / inbound `feedback@my-property-assistant.com` → `ecastle612@gmail.com` before Production release.

### Where inbound is managed

| Fact | Record |
|------|--------|
| DNS / nameservers | Cloudflare (`blakely.ns.cloudflare.com`, `nile.ns.cloudflare.com`) |
| Apex A | `76.76.21.21` (Vercel site) |
| Apex MX | **None** — no inbound mail for `@my-property-assistant.com` |
| Resend domain | `my-property-assistant.com` **verified**, **sending enabled**, **receiving disabled** |
| Resend outbound DNS (do not change) | `resend._domainkey` TXT (DKIM verified); `send` MX `10 feedback-smtp.us-east-1.amazonses.com`; `send` TXT `v=spf1 include:amazonses.com ~all` |
| Cloudflare Email Routing | **Not enabled** (no Cloudflare MX / destination records) |
| Google Workspace / other mailbox host | **Not present** (no Google/Microsoft MX) |
| This environment | Resend MCP can send. Cloudflare dashboard / Email Routing is **not** authenticated. No Gmail inbox access. |

Resend does **not** handle inbound for this domain. Enabling Resend receiving on the apex would add Resend MX and would **not** create a Gmail forward. That path was not used.

### What this environment did not do

- Did not create `feedback@` forwarding (Owner later configured and verified it)
- Did not change app Reply-To in that inspect (Reply-To is now `feedback@` after Owner verification)
- Did not add apex MX
- Did not enable Resend receiving
- Did not change `send.*` or `resend._domainkey`
- Did not apply the docs/185 migration
- Did not deploy complimentary access
- Did not change Stripe, pricing, SKUs, tenant Stripe execution, M5, or July

### Diagnostic probe (not a pass)

Resend accepted a controlled probe:

- From: `My Property Assistant <noreply@my-property-assistant.com>`
- To: `feedback@my-property-assistant.com`
- Subject: `[MPA DIAGNOSTIC] inbound probe for feedback@ — do not treat as live`
- Resend id: `1172009b-1cc0-44bd-815e-de1bf7bcd832`
- Status at inspect: **sent** (provider accepted outbound)
- Gmail arrival at `ecastle612@gmail.com`: **not verified**
- Resend receiving inbox: **empty**

Without apex MX, `feedback@` has no mailbox. This probe does **not** certify inbound forwarding.

### Exact Owner action

Use **Cloudflare Email Routing** (DNS is already on Cloudflare). Do **not** use Resend inbound for this.

1. Open [Cloudflare Dashboard](https://dash.cloudflare.com) → domain **my-property-assistant.com**.
2. Go to **Email → Email Routing** (or **Compute → Email Service → Email Routing**).
3. Enable Email Routing / onboard the domain. Allow Cloudflare to add **apex MX** (and any Email Routing TXT it requires).
4. **Do not edit or delete** these existing sending records:
   - `resend._domainkey` TXT
   - `send` MX → `feedback-smtp.us-east-1.amazonses.com` (priority 10)
   - `send` TXT → `v=spf1 include:amazonses.com ~all`
   - apex A `76.76.21.21`
5. **Destination addresses:** add `ecastle612@gmail.com` and click the Cloudflare verification link in Gmail.
6. **Routing rule:** custom address `feedback` → action **Send to an email** → destination `ecastle612@gmail.com`.
7. Optional: add `enterprise` the same way if that public contact should also land in Gmail (it also has no MX today).
8. From an external mailbox, send a test to `feedback@my-property-assistant.com` and confirm it arrives in `ecastle612@gmail.com`.

Owner later completed that inbound test. Complimentary TESTER and GIFT Reply-To is now `feedback@my-property-assistant.com`. This inspect remains superseded history.

---

## Exact Production release gate

**READY FOR COMPLIMENTARY ACCESS PRODUCTION RELEASE.**

Prepared only. This certification does **not** apply the migration or deploy Production. Execute the combined gate only after Owner authorization.

| Step | Status | Notes |
|---|---|---|
| 1. Apply certified complimentary-access migration to Production | **Prepared — not executed** | `supabase/migrations/20260817180000_docs_185_complimentary_access.sql`. |
| 2. Deploy matching application revision | **Prepared — not executed** | Implement SHA `c6da35b27843ae71f8f9b15b4f93105668f297ae` plus this Reply-To / docs/186 revision. |
| 3. Controlled UAT with one Owner-controlled tester email | **Prepared — not executed** | One Owner-controlled tester inbox only. |
| 4. Verify welcome email → claim → Guided Setup → granted SKU → tester reply path | **Prepared — not executed** | Reply-To `feedback@my-property-assistant.com` → Owner Gmail. Tester copy still asks for bugs/errors, confusing behavior, suggestions, and screenshots when useful. |

Do not change Stripe, pricing, public signup, tenant Stripe execution, M5, or July. Do not create Stripe Prices, $0 Checkouts, or complimentary Stripe subscriptions. Do not create another design phase unless a genuine security or commercial blocker is discovered during Production execution.
