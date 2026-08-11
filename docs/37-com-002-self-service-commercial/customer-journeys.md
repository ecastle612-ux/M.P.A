# COM-002 — Customer Journeys

**Parent:** [COM-002 Index](./index.md)  
**Status:** Approved  
**Amendments:** A1, A2, A4, A6, **A8**  

---

## Journey map (Enterprise forks first)

```
Public Landing
    │
    ├─────────────── Request Enterprise ──► Schedule → Sales → Proposal
    │                                            → Contract → Implementation → Prod
    │
    Choose Product (self-serve: Property Manager highlighted)
    │
    Choose Billing Cycle (Monthly | Annual)   [Enterprise CTA → Request Enterprise]
    │
    (Server quote: managed units → unit capacity / trial eligibility)
    │
    ├──────── Try Live Demo ──► interactive → Convert to Subscribe
    │
    └──────── Start Subscription
                 │
                 Secure Stripe Checkout (PM self-serve only)
                 │
                 Payment successful
                 │
                 Automatic org provisioning (owner_pending)
                 │
                 Create / verify account (email ownership)
                 │
                 Guided Setup
                 │
                 Mission Control
```

---

## J1 — Self-service subscribe (Property Manager)

| Step | Customer sees | System |
|------|---------------|--------|
| 1 Landing | Brand + CTAs | Marketing |
| 2 Product | Property Manager primary; FO/Complete gated / Enterprise sales until FO-READY | Honesty (A1) |
| 3 Cycle | Monthly / Annual | Resolve cycle; annual = monthly × 12 |
| 4 Capacity | Declared managed units (included 500 + Additional Unit Capacity if needed) | Server unit-volume quote (A8) |
| 5 Checkout | Stripe-hosted (trial only if ≤500 units) | `mode=subscription` |
| 6 Success | Preparing workspace | Webhook provision |
| 7 Account | Create/sign in + verify email | [Identity Binding](./identity-binding.md) |
| 8 Setup | Guided Setup | Org pre-created |
| 9 Home | Mission Control | Entitled PM |

**No employee interaction.** **PM Business is not a customer plan step** (legacy only).

---

## J2 — Live Demo

See [Live Demo Architecture](./live-demo-architecture.md).

- No account, no payment.  
- PM demo = full interactive depth.  
- FO / Complete demos = clearly labeled demonstration of product shape; no claim of production FO depth until FO-READY.  
- Convert → J1 with product hint (PM) or Enterprise CTA for FO interest.

---

## J3 — Enterprise (high-touch) — A6

| Step | Customer sees | System |
|------|---------------|--------|
| 1 | Request Enterprise | Lead capture |
| 2 | Schedule consultation | Calendar |
| 3–6 | Sales → proposal → contract | Humans |
| 7 | Implementation | Operator provision (audited) |
| 8 | Production | Mission Control |

**Never** uses public Checkout. **Never** shares self-serve billing Portal as the buy path.

---

## J4 — Returning customer (billing)

| Intent | Path |
|--------|------|
| Update payment method | In-app Billing → Stripe Customer Portal |
| Invoices / receipts | Billing + Portal |
| Authorize Additional Unit Capacity | In-app payment gate → next-period recurring price |
| Downgrade / reduce capacity | Scheduled period end |
| Cancel | Period end |
| Reactivate | Resubscribe Checkout (PM) or Portal reactivate |

---

## J5 — Failed payment / dunning (A4)

1. `invoice.payment_failed` → `past_due` + banner + email (Day 0).  
2. Stripe Smart Retries.  
3. Reminder emails Day 3, Day 6.  
4. Day 7 grace end → entitlements off; suspended notice.  
5. Update payment → `active` → access restored.

---

## J6 — SCA / payment action required (A4)

If `invoice.payment_action_required`: customer completes authentication via Stripe-hosted flow / hosted invoice; access follows resulting paid/failed state. Success/continue pages must handle **pending action** (not false “you’re in”).

---

## J7 — Dispute / chargeback (A4)

1. `charge.dispute.created` → flag org `dispute_hold`.  
2. Module access: **fail closed** (or read-only finance-safe mode — default **fail closed**).  
3. Notify owner + commerce ops.  
4. On win → restore; on lose → cancel/suspend per finance policy.

---

## J8 — Pause (A4)

**Not offered** in v1 ([Defaults](./commercial-defaults.md)). Customer cancels at period end instead.

---

## J9 — Cancellation & expired access (A4)

| Phase | Experience |
|-------|------------|
| Cancel scheduled | Banner: access through `{period_end}` |
| Period ended | Dedicated “Subscription ended” page — Reactivate / Contact Enterprise |
| Data | Retained per retention policy; modules fail closed |

---

## J10 — Reactivation (A4)

Verified owner → Checkout or Portal reactivate → entitlements restored to purchased offer → Mission Control (Guided Setup only if incomplete).

---

## J11 — Team invite (A4 / A8)

After `owner_bound`: owner invites organization members. Invitee accepts → membership.  
**No commercial seat cap** (A8). Invitation remains an identity/membership concern, not a billing meter.

---

## J12 — Organization transfer (A4)

Owner initiates transfer to another verified member (or support-assisted). Audit required. Billing Stripe Customer remains on org; ownership membership moves. Enterprise transfers: operator-assisted.

---

## Journey copy principles

- Customer language only.  
- One next step.  
- Enterprise looks intentional.  
- FO/Complete never oversold on self-serve.  
