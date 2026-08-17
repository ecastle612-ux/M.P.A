# 185 — Master Admin Complimentary Tester / Gift Access

**Status:** **APPROVED** — Owner approved 2026-08-17. Implemented in-repo; see [docs/186](../186-complimentary-tester-gift-access-implementation-certification/index.md).  
**Date:** 2026-08-17  
**Gate:** Design → Document → Approve → Implement. Owner approved the design and the one implement + certification package.  
**Production:** implemented in-repo · **not deployed** · **migration not applied**

---

## Live subscription UAT waiver (accurate)

Owner waived **payment execution** from [docs/183](../183-final-controlled-subscription-uat-certification/index.md) and [docs/184](../184-controlled-live-subscription-uat-certification/index.md) for launch progression only.

**Do not claim that Property Manager, Facility Operations, or Complete live subscriptions were completed.** They were not.

| Fact | Record |
|------|--------|
| Production Checkout | Stripe **live** (`cs_live_`) |
| Trial / due today (PM inspect) | **$0.00 today**, then $59/month after 30 days (docs/184) |
| Paid PM / FO / Complete UAT | **Not completed** |
| This package | No additional live-card UAT · no simulator · no Stripe mode change |

Public catalog remains Property Manager **$59** / Facility Operations **$59** / Complete **$109**. Tenant Stripe execution stays **off**. M5 stays unauthorized. July stays frozen.

---

## Inspection: there is no `MASTER_ADMIN_GRANT` object

Searched application, shared commercial types, migrations, and Blueprint. **No** `MASTER_ADMIN_GRANT` table, type, or complimentary-access module exists.

What exists today (reuse, do not replace):

| Existing | What it does | Gap |
|----------|----------------|-----|
| Master Admin + `isPlatformOperatorUser` | Operator-only commercial mutations | No complimentary grant UI |
| `PUT /api/organizations/:id/subscription` + `assignOrganizationSubscription` | Assigns SKU on an **already-created** org | Requires an org; no email invite; no tester/gift; no expiration; no welcome mail |
| `organization_subscriptions` | Live SKU + paid lifecycle fields (`status`, `current_period_end`, limits) | Paid Stripe lifecycle. Must **not** become a fake $0 Stripe subscription |
| SaaS provisioning claim | Paid Checkout → bind token → password → Guided Setup | Copy assumes **payment succeeded** |
| Team `organization_invitations` | Invite into an **existing** org | Not org-creating complimentary access |
| Branded Resend shell | Transactional mail | No complimentary welcome / expiry / reply-to tester feedback |
| Billing expired/grace copy | Paid subscription phases | No complimentary expired-access screen |
| ADR-033 operating scope | Complete isolation | Keep as-is |

**Conclusion:** Existing Assign SKU cannot safely become this product. Implementing now would create **new** grant, claim, expiration, conversion, and entitlement-precedence machinery. That is an irreversible commercial + security + data-governance decision.

**Approved.** Implementation is the docs/186 package. Do not deploy Production from this record.

---

## Designed product (after Approve)

One complimentary entitlement system. Not a public free plan. Not a Stripe coupon. Not a $0 Checkout. Not an Owner-set password.

### 1. Master Admin workflow

New operator page: **Complimentary Access** (Commercial nav). Master Admin / platform operator only.

Send Access:

1. Email  
2. Product: Property Manager / Facility Operations / Complete  
3. Grant type: **TESTER** or **GIFT**  
4. Period: duration **or** No Expiration (Gift may use No Expiration; Tester should normally have a period)  
5. Optional unit/account limit, or product-normal allowance, or unlimited where appropriate  
6. **Send Access**

Directory columns: Email · Organization · Grant type · Product · Status · Granted · Expiration · Limit  

Statuses: **INVITED** · **ACTIVE** · **EXPIRED** · **REVOKED**  

Actions (Master Admin only): Resend · Extend · Change Limit · Remove Expiration · Revoke · Convert Tester → Gift  

Regular org admins, PM/FO managers, tenants, vendors, and recipients **cannot** grant, change, or revoke.

### 2. Tester workflow

Owner collects email offline. Owner enters it in Master Admin.

M.P.A. then:

1. Creates a **server-owned** complimentary grant + invitation (no card).  
2. Sends branded welcome email.  
3. Tester clicks **Set Up Your Account**.  
4. Tester creates a password or signs in.  
5. Existing auth user with that email is **reused** (no second login identity).  
6. Guided Setup provisions **one** organization for the granted SKU.  
7. Granted PM / FO / Complete entitlement becomes **ACTIVE**.  
8. Tester uses the product normally.

No public “free signup” route.

### 3. Gift workflow

Same grant + claim + Guided Setup + SKU. Differences:

- Copy is complimentary gift, not tester-feedback (unless Owner opts in).  
- **No Expiration** is allowed.  
- Same Master Admin controls.

### 4. Expiration and paid conversion

**Before Tester expiry:** automatic notice + **Continue With M.P.A.**

Recipient **chooses** the paid product they want (PM / FO / Complete, monthly / annual) and pays through **normal Stripe Checkout**. Never auto-charge because complimentary ended.

If they subscribe:

- Status **COMPLIMENTARY → PAID**  
- Reuse the **same** account and organization  
- Preserve properties, units, leases, residents, work orders, documents, finance history  
- **No duplicate organization**  
- **Precedence:** an **active paid** Stripe subscription wins. Complimentary does not override paid SKU, limits, or billing. Complimentary remains audit history.

If they do not subscribe:

- Status **ACTIVE → EXPIRED**  
- **Do not delete data**  
- Expired-access screen + **Choose a Plan**  
- Retention follows existing/approved policy (no new deletion scheme)

Gift with No Expiration does not get the expiry campaign unless a later date is set.

### 5. Limits

Optional. Server-enforced.

- Product-normal allowance, or  
- Custom applicable unit/account limit, or  
- Unlimited where appropriate  

Hitting a limit **blocks additional creation**. It must **not** delete existing rows.

### 6. Security

- Only platform operators mutate grants.  
- Recipients cannot escalate SKU, extend, or un-revoke.  
- Claim token cannot change server-owned email, product, or grant type.  
- Retry/resend is idempotent (one org per grant).  
- No competing free-plan catalog.  
- PM / FO / Complete isolation and ADR-033 stay in force.  
- Paid Checkout, Prices, July freeze, tenant Stripe execution, and M5 stay unchanged.

### 7. Email / reply feedback

Welcome states: complimentary access, granted product, expiration if any, **no payment required** during the complimentary period.

Tester welcome asks them to **reply to the email** with errors, bugs, confusion, unexpected results, or suggestions — what they were doing, what happened, what they expected, screenshot when useful.

**Reply-To** is Owner-approved: `enterprise@my-property-assistant.com`. Gift omits tester-feedback language unless Owner enables it.

Expiry mail: complimentary period ending + Continue With M.P.A. (Checkout). No charge in that email.

Reuse the existing branded Resend lockup. Do not send from `resend.dev`.

### 8. Tests (after Approve / implement)

- Operator-only grant/change/revoke  
- Claim reuses existing auth user  
- Claim cannot change SKU  
- Resend idempotent  
- Guided Setup keeps granted SKU  
- PM grant cannot open FO (and inverse); Complete keeps ADR-033  
- Paid subscription supersedes complimentary  
- Conversion does not duplicate org  
- Expiry does not delete data  
- Limit blocks create, does not delete  
- Welcome/expiry copy contracts  
- No Stripe Price / July / tenant-execution / M5 mutation  

### 9. Production status

**Implemented in-repo. Not deployed.** No Production apply from this record. See docs/186.

### 10. Exact next gate

**Owner approved this document.** The implement package is docs/186. Production deploy remains a **separate** Owner authorization.

---

## Approval checklist (Owner)

Approve only if you accept all of these:

1. Live PM / FO / Complete **paid** subscription UAT remains **incomplete**; this waiver does not certify public paid launch.  
2. A **new** complimentary-grant object is required (existing Assign SKU is insufficient).  
3. Complimentary never writes a fake Stripe subscription or $0 Checkout.  
4. Paid active subscription **always** precedes complimentary.  
5. Expiry retains data; conversion reuses the same org.  
6. Only Master Admin / platform operators grant or revoke.  
7. Reply-To inbox is confirmed (or the proposed `enterprise@my-property-assistant.com` is accepted).  
8. Implement stays in-repo until a later Production authorize.

---

## What this record does not do

- Does not implement UI, APIs, or migrations  
- Does not deploy  
- Does not complete live-card UAT  
- Does not build a Stripe simulator  
- Does not switch Stripe modes  
- Does not change Prices, July, tenant Stripe execution, or M5  
