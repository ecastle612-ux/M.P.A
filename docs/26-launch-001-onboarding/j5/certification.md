# J5 Certification — Collect your first rent

**Parent:** [LAUNCH-001](../index.md)  
**Journey:** [J5](../customer-journeys.md#j5--rent-collected)  
**Authorization:** `AUTHORIZE LAUNCH-001 JOURNEY J5`  
**Delivery status:** Delivered (implementation)  
**Certification status:** Ready for Master Admin Pass script  

---

## Customer promise

> I can collect rent, track payment status, and immediately know my property's financial position.

---

## Outcome

```
Mission Control → Collect your first rent
  → /pm/financial-operations#collect
  → Review upcoming charges
  → Send payment reminder
  → Resident opens Billing
  → Pay online (Stripe) OR manager records manual payment
  → Payment succeeds
  → Receipt · resident balance · property snapshot · owner summary
  → Timeline · Audit
  → Mission Control / Assistant → Submit your first maintenance request
```

---

## One payment workflow

| Path | Behavior |
|------|----------|
| Online | Resident Billing → Pay now → Stripe Checkout → webhook → `applySucceededPayment` |
| Manual | FO desk → Record payment + receipt → same `applySucceededPayment` |
| Recurring | Lease activation / FO generate this month’s rent |
| One-time | FO desk one-time charge / credit |
| Reminders | FO `#collect` → Send payment reminder (in-app when resident linked) |

Do **not** introduce a second payment system. FIN-OPS remains the sole money path.

---

## Automatic platform events on successful payment

| Event | Result |
|-------|--------|
| Charge | Marked paid / partially paid |
| Resident balance | Ledger + financial status refreshed |
| Receipt | `financial_receipts` row |
| Property snapshot | Property money / FO reporting reflects collection |
| Owner summary | Portfolio income / outstanding updates |
| Timeline | `finance.payment.succeeded` (payment, property, lease) |
| Audit | `finance.payment.succeeded` |
| Notification | Resident portal inbox when `user_id` linked |
| Mission Control | → Submit your first maintenance request |
| Assistant | “My first rent has been collected. Submit your first maintenance request.” |

No manual reconciliation required.

---

## What shipped

| Surface | Behavior |
|---------|----------|
| Mission Control | Next action Collect your first rent → FO `#collect` |
| Financial Operations | Collect section, charges, reminders, manual pay, metrics, alerts |
| Resident Billing | Balance, open/paid/upcoming, receipts, history, Stripe pay, success confirmation |
| Property Command Center | Rent collected ready message + next maintenance journey |
| Resident / Lease CC | Same progression after first succeeded payment |
| Master Admin | Launch Readiness J5 evidence panel |

---

## Customer journey verification

| # | Step | Expected |
|---|------|----------|
| 1 | Complete J4; open Mission Control | Next = Collect your first rent → `/pm/financial-operations#collect` |
| 2 | Review charges | Open rent (or generate this month’s rent) visible |
| 3 | Send payment reminder | Reminder event / portal notice (or staff-visible honesty if no linked user) |
| 4 | Resident Billing | Current balance + Pay now (if Stripe configured) |
| 5a | Online pay | Checkout → success → receipt + balance update |
| 5b | Manual pay | FO records payment → same receipt/balance path |
| 6 | Property / owner money | Snapshot and owner summary reflect collection |
| 7 | Timeline / audit | `finance.payment.succeeded` present |
| 8 | Mission Control | Next = Submit your first maintenance request |

---

## Master Admin / Launch Readiness evidence

| Check | Surface |
|-------|---------|
| Charge + payment + receipt | `/admin/launch-readiness` J5 panel |
| Manual and/or Stripe path | Evidence checks |
| Property + owner money | Snapshot / summary readable |
| Timeline / audit | Evidence lists |
| Journey completion | `rentReady` + assistant recommendation |

API: `GET /api/admin/launch/j5?organizationId=<uuid>`

---

## Env (online pay)

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Stripe Checkout (online path) |
| Stripe webhook secret (existing FO) | Confirms checkout completion |

Manual payment completes the customer journey when Stripe is not provisioned. Online pay remains the advertised resident path when configured.

---

## Follow-on

J6 authorized and delivered — see [J6 certification](../j6/certification.md).
