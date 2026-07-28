# 08 — Email, Notifications & Audit

**Package:** ACQ-001  
**Status:** Draft — Ready for Approval

---

## Email workflows

| Trigger | Audience | Content (secret-free where logged) | Owner |
|---------|----------|--------------------------------------|-------|
| Checkout completed / welcome | Buyer | Username, first-login link, org name | AUTH credential delivery |
| Contact verification | Buyer | Verify link | AUTH verify-contact |
| Checkout abandoned (optional) | Buyer email if known | Resume pricing / Checkout | Future; needs Approve |
| Payment failed (post-active) | Billing admins | Update payment method | BILL / notifications |
| Trial ending | Org Admin | Days left + convert CTA | COM trial |
| Enterprise lead received | Sales owner | New Contact Sales submission | COM |

Templates: prefer EML-001 / Resend templates; ACQ does not invent a parallel mailer.

---

## Notifications (in-app)

| Event | Behavior |
|-------|----------|
| Subscription activated / updated / canceled | Existing SaaS lifecycle notify to org admins |
| Entitlement / limit blocked | Inline UI errors + optional system notification |
| Setup incomplete reminders | Optional later; not ACQ V1 blocker |

---

## Audit events

Minimum audit trail (reuse SaaS / commercial / privileged audit tables):

| Event | Source |
|-------|--------|
| `saas.checkout.completed` | BILL webhook |
| `saas.subscription.upserted` / `deleted` | BILL webhook |
| Commercial activation completed | COM |
| Org provisioned / Org Admin welcome delivered | AUTH |
| Public Contact Sales submitted | COM opportunity create |
| Entitlement bind | Snapshot upsert |

Public page views are **analytics**, not privileged audit (unless security-relevant abuse).

---

## Reporting

| Report need | System |
|-------------|--------|
| Funnel conversion | ACQ analytics ([12](./12-analytics.md)) |
| MRR / churn | BILL Phase D / COM dashboard (staff) |
| Provision failures | Ops / SaaS audit |
