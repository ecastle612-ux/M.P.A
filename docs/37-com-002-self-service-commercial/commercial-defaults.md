# COM-002 — Commercial Defaults (Binding — A7 / A8)

**Parent:** [COM-002 Index](./index.md)  
**Status:** Approved (binding)  
**Amendments:** A7 (original defaults); **A8** (unit-capacity model — Product Owner authorized 2026-08-11)

These defaults are **authoritative architecture**. Dollar amounts below are Owner-authorized commercial prices for the unit-capacity model. Stripe Price publication and Checkout wiring remain separate implementation slices.

**Legacy (superseded by A8):** Professional/Business seat caps (5/25) and property caps (25/150), and “no self-serve trials,” are **removed** from the governing model. See [Amendment Package](./amendment-package.md) A8.

---

## 1. Managed-unit capacity (binding — A8)

**Billing metric:** count of `public.property_units` for the organization.

- **All statuses count:** `occupied`, `available`, `offline`.
- Multiple tenants/residents in one unit = **one** billable managed unit.
- Login seats are **not** a commercial capacity meter.
- Property count is **not** a commercial capacity meter.

| Module | Base monthly | Included units | Additional Unit Capacity |
|--------|-------------:|---------------:|--------------------------|
| Property Manager | **$59** | First **500** | **+$39**/month per additional 500-unit block |
| Complete Platform | **$109** | First **500** | **+$39**/month per additional 500-unit block |
| Facility Operations | **$59** / **$590** year | N/A (flat; gated) | None |

**Formulas (server-authoritative):**

```
additional_blocks = max(0, ceil(managed_units / 500) - 1)

Property Manager monthly = 59 + (39 × additional_blocks)
Complete Platform monthly = 109 + (39 × additional_blocks)
Annual = monthly × 12
```

**Annual:** monthly equivalent × **12**. **No annual discount.**

**Seat limits:** **Removed.** Do not enforce commercial seat caps on invite.

**Property limits:** **Removed.** Do not enforce commercial property caps on property create. Legitimate ownership / data relationships remain.

**Customer products:** Property Manager, Facility Operations, Complete Platform only.  
**PM Business** is **not** a customer product (legacy internal offer ids may remain until Stripe migration).  
**Enterprise** is a **sales motion only** — not a product and not a pricing tier (Product Constitution / ADR-019).

### Over-capacity / Additional Unit Capacity (binding)

- **500 included units is capacity, not a hard product lockout.**
- Customers may exceed 500 units.
- Exceeding **authorized** unit capacity triggers an **Additional Unit Capacity** payment gate.
- Customer must **explicitly authorize** the capacity increase.
- **No silent charge. No silent upgrade. No organization-wide lockout.**
- After authorization, the new recurring capacity price applies on the **next billing period** (not a surprise mid-period charge).

---

## 2. Trial policy (binding — A8)

| Declared managed units | Trial |
|------------------------|-------|
| **≤ 500** | Exactly **30 days** free; **valid payment card required** before trial starts |
| **> 500** | **No free trial** |

Live Demo remains available as try-before-buy without payment.  
Enterprise temporary access remains sales/ops exception only (audited).

Stripe trial wiring is an implementation concern; this section is the governing commercial rule.

---

## 3. Billing timing

| Rule | Default |
|------|---------|
| Collection | Stripe automatic collection on subscription |
| Cycle | Monthly or Annual Price |
| Annual amount | Monthly equivalent × 12 (**no discount**) |
| Proration on legacy plan-label changes | Per product rules where still applicable |
| **Unit-capacity uplift** | **Next billing period** after explicit customer authorization (`proration_behavior=none` for that uplift) |
| Downgrade / capacity reduction effective | **At period end** (subscription schedule) |
| Cancel effective | **At period end** (`cancel_at_period_end=true`) |
| Past-due grace | **7 days** from first `invoice.payment_failed` |
| After grace | Entitlements off; data retained |

---

## 4. Account creation timing

| Rule | Default |
|------|---------|
| Sequence | **Pay (Checkout) → provision org → create/bind account → verify email → access** |
| Workspace access before verify | **Forbidden** |
| Auth methods | Email + password and/or magic link (implementation choice within Slice D) |

See [Identity Binding](./identity-binding.md).

---

## 5. Organization creation timing

| Rule | Default |
|------|---------|
| Trigger | SaaS webhook `checkout.session.completed` (mode subscription, `mpa_money_domain=saas_billing`) |
| Not created on | Checkout abandon, expired session, Enterprise form submit |
| Idempotency | Unique on `checkout_session_id` |

---

## 6. Module activation timing

| Rule | Default |
|------|---------|
| Entitlement grant written | Provisioning checkpoint `entitled` |
| Customer can use modules | Only after checkpoint `owner_bound` **and** email verified |
| Self-serve SKU at launch | **`mpa_property_manager` only** (A1) |
| FO / Complete activation | Enterprise operator **or** post–**FO-READY** self-serve flag — **Complete and FO remain gated until authorized** |

---

## 7. Pause policy

| Rule | Default |
|------|---------|
| Customer self-serve pause | **Not offered in v1** |
| Stripe `paused` | Not used for self-serve |
| Need to stop billing | Cancel at period end |

---

## 8. Other binding defaults

| Topic | Default |
|-------|---------|
| Currency (self-serve v1) | **USD** |
| Stripe Tax | **On** for self-serve go-live |
| Customer Portal plan switching | **Off** — capacity/plan changes in-app only |
| Demo host | **`demo.` subdomain** (or equivalent host separation) |
| SaaS webhooks | **Dedicated endpoint** separate from FIN-OPS |
| Unclaimed org TTL | **7 days** then suspend entitlements; retain data 90 days minimum |
| Dunning emails | Day 0, Day 3, Day 6 (grace end), suspended notice |
