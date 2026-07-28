# 21 — Amendment: In-app cancel at period end

**Package:** BILL-001  
**Status:** Approved  
**Recorded:** 2026-07-28 · **Approved:** 2026-07-28  
**Gate:** Design → Document → Approve → **Implement**  
**Supersedes (UX only):** Cancel row in [03 — Company Admin Experience](./03-company-admin-experience.md) (Portal-required cancel)

---

## Why

Company Admins should cancel the org SaaS subscription **without leaving M.P.A.** for Stripe Customer Portal. Portal remains the self-serve surface for payment method, invoices, plan changes, and reactivate/resume.

---

## Binding decisions (pending sign-off)

| # | Decision | Value |
|---|----------|-------|
| A1 | Cancel effect | **Cancel at period end only** — access and entitlements until `currentPeriodEnd` |
| A2 | Surface | Settings → Billing (`CompanyBillingCenter`); `saas:manage` required |
| A3 | Mechanism | In-app confirm → `POST /api/saas` `action: "cancel"` → `requestSaasCancelAtPeriodEnd` → provider `cancelSubscriptionAtPeriodEnd` |
| A4 | Stripe Portal | Still required for PM, invoices, plan change, reactivate — **not** required for cancel |
| A5 | Immediate cancel | **Out of scope** (no immediate revoke, no refunds in this amendment) |
| A6 | Founder | High-friction confirm (type `LEAVE FOUNDER`) before cancel when `plan_code=founder` |
| A7 | Idempotency | Return modes `cancel_at_period_end` \| `already_canceling` \| `already_canceled` \| `no_subscription` |
| A8 | Audit | Existing event `saas.subscription.cancel_at_period_end` |
| A9 | Rail separation | Unchanged — ADR-024; same SaaS Stripe Billing rail; no rent/Connect writes |

---

## Flow

1. Admin with open subscription clicks **Cancel subscription** on Settings → Billing.  
2. Confirm modal explains access continues until period end. Founder requires typed confirmation.  
3. M.P.A. calls Stripe (via provider) with `cancel_at_period_end=true`, mirrors local `saas_subscriptions`, writes audit.  
4. UI shows cancel-scheduled badge / period-end date. Webhooks remain SoT for later `canceled` status.

---

## Doc updates in this amendment

- [03](./03-company-admin-experience.md) — Cancel UX  
- [09](./09-api-impacts.md) — `action: "cancel"` on monolithic `/api/saas`  
- [12](./12-certification-plan.md) — S05 evidence criteria  
- [16](./16-approval-record.md) — link once approved  

---

## Approval

| Role | Decision | Date | Notes |
|------|----------|------|-------|
| Product | **APPROVE** | 2026-07-28 | Binding chat approval: `APPROVE BILL-001 amendment 21` |
| Lead Architect | **APPROVE** | 2026-07-28 | Same binding approval |
| Security | _N/A_ | | Same rail + existing cancel helper |
| Finance | _N/A_ | | Period-end only; no refund policy change |

**Implement unlocked.**
