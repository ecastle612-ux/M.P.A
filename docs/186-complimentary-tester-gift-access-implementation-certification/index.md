# 186 — Complimentary Tester / Gift Access Implementation Certification

**Status:** Implemented / certified in-repo. **BLOCKED — FEEDBACK EMAIL ROUTING REQUIRES OWNER ACTION.** Not deployed. Migration not applied.  
**Date:** 2026-08-17  
**Authority:** Owner approval of [docs/185](../185-complimentary-tester-gift-access/index.md)  
**Branch SHA (implement):** `c6da35b27843ae71f8f9b15b4f93105668f297ae`  
**Production:** **blocked** — inbound `feedback@` is not live; do not deploy; do not apply the docs/185 migration

---

## Verdict

**BLOCKED — FEEDBACK EMAIL ROUTING REQUIRES OWNER ACTION.**

The complimentary package remains implemented in-repo. Tester welcome Reply-To is still `enterprise@my-property-assistant.com`. It was **not** changed to `feedback@my-property-assistant.com` because inbound delivery to `ecastle612@gmail.com` is **not verified**.

`feedback@my-property-assistant.com` is **not** a working mailbox today. Do not treat it as live.

M.P.A. automates everything after Master Admin **Send Access**. Complimentary access is a server-owned grant, not a Stripe subscription, not a $0 Checkout, and not a public free plan.

**Do not claim paid PM / FO / Complete live subscriptions were completed.** They were not. The docs/183–184 payment-execution waiver still stands.

---

## Owner decisions used

| Decision | Implementation |
|----------|----------------|
| Approve Complimentary Tester / Gift Access | This package |
| Tester feedback Reply-To | Still `enterprise@my-property-assistant.com` until `feedback@` inbound is verified |
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
| Branded welcome email | Resend foundation shell + Reply-To still `enterprise@my-property-assistant.com` (feedback@ blocked) |
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

## Feedback email routing inspection (2026-08-17)

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

- Did not create `feedback@` forwarding
- Did not change app Reply-To
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

After Owner confirms that inbound test, a follow-up may change complimentary Reply-To to `feedback@my-property-assistant.com` (Gift may use the same). Do not change Reply-To before that confirmation.

---

## Exact Production release gate

**BLOCKED — FEEDBACK EMAIL ROUTING REQUIRES OWNER ACTION.**

Do not deploy complimentary access. Do not apply `20260817180000_docs_185_complimentary_access.sql`.

After Owner completes the Cloudflare steps above and confirms Gmail receipt, a later package may:

1. Change tester (and gift) Reply-To to `feedback@my-property-assistant.com`.
2. Re-run the welcome-email contract tests.
3. Then, only with a separate Owner authorize, apply the docs/185 migration and deploy the matching app revision together.

Do not create Stripe Prices, $0 Checkouts, or complimentary Stripe subscriptions as part of that gate.
