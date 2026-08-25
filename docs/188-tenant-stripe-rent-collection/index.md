# 188 — Tenant Stripe Rent Collection + Admin-Controlled Fees

**Status:** **APPROVED** — Owner approved A–E 2026-08-17. Implemented in-repo; see [docs/189](../189-tenant-stripe-rent-collection-implementation-certification/index.md).  
**Date:** 2026-08-17  
**Gate:** Design → Document → Approve → Implement. Owner approved Slices A–E.  
**Authority:** Owner pre-launch requirement (2026-08-17) · [ADR-016](../18-decision-log/adr-016-financial-operations-operational-finance.md) · [FIN-OPS Stripe & Ledger](../25-fin-ops-001/stripe-and-ledger-architecture.md) · [docs/161](../161-fin-ops-production-reconciliation-m4-application-cutover-design/index.md) M4 cutover (already applied; execution still off)

**Do not:** enable `stripe_payment_execution_enabled` · process a real tenant payment · change Stripe Prices · touch SaaS Checkout · apply Production migration · complete live Connect onboarding · authorize M5 · unfreeze July.

---

## Verdict

M.P.A. already has a resident Stripe Checkout + FIN-OPS apply path. Production keeps it **off**. Public marketing is currently honest that live tenant card checkout is **not** included.

What is missing for **real online rent payment** is not a second ledger. It is: money destination (Connect), recurring charge posting, fee-configuration honesty, and a few payment-hardening gaps.

What is additionally missing for truthful **automatic rent collection** is tenant-authorized saved-method charging. That is a separate mode. Admin-set rent is not consent.

No new ADR is required if Owner accepts this record. It implements already-accepted ADR-016 and the approved FIN-OPS Stripe architecture. Owner approval of this record is the implement gate.

---

## Binding model

```
Subscriber/admin sets amounts
→ FIN-OPS posts a charge (never invented by M.P.A.)
→ Tenant sees balance
→ Tenant pays through Stripe  (or, if enrolled, Stripe charges a saved method)
→ Stripe webhook confirms
→ FIN-OPS records payment / allocation / receipt
→ Balance updates
```

M.P.A. does not invent property-specific fee amounts. Changing a default or schedule must not rewrite historical, posted, paid, or previously assessed charges.

---

## 1. What tenant Stripe infrastructure already exists

Reuse this. Do not dual-write. Do not use July tables (`autopay_enrollments`, `payment_methods`, `payment_attempts`, `payment_customers`, `billing_schedules`). Those are frozen / unused by `apps/web`.

| Piece | Exists | Production state |
|-------|--------|------------------|
| Resident Billing `GET /api/finance/resident/billing` | Yes | Balance / history. `onlinePaymentsEnabled` requires org flag **and** current occupancy |
| Pay now presentation | Yes | Hidden while execution is off (P1-01 / P1-03) |
| `POST /api/finance/checkout` | Yes | Occupying resident **or** staff with `pm.finance:charge.write`. Residential SKU (`pm.financial_operations`). Flag check **before** `createServiceRoleClient()`. Creates pending `financial_payments`, then Checkout `mode: "payment"` with `price_data` (not SaaS Price IDs). Metadata: `payment_id`, `organization_id`, `lease_id` |
| Flag `financial_module_settings.stripe_payment_execution_enabled` | Yes | **All false** in Production. Shared flag `finance.stripe_payment_execution` is **not** the Production gate |
| Stripe Customer / SetupIntent / saved methods | **No** in FIN-OPS app path | Checkout is one-off. No Customer created |
| `POST /api/finance/webhooks/stripe` | Yes | Verifies `STRIPE_WEBHOOK_SECRET`. Distinct from `/api/commerce/webhooks/stripe` (`STRIPE_SAAS_WEBHOOK_SECRET`) |
| Pending payments | Yes | Insert `pending` / `online_stripe` before Session create; fail the row if Session create fails |
| Allocations / receipts / ledger | Yes | `applySucceededPayment` → `planPaymentAllocations` → `financial_payment_allocations` + `financial_receipts` + `financial_ledger_entries` |
| Webhook idempotency | Yes | `financial_stripe_webhook_events.stripe_event_id`. Duplicate `processed_at` returns `{ duplicate: true }`. Already-succeeded pending row is a no-op |
| Failed / expired | Yes | `checkout.session.expired` and `payment_intent.payment_failed` → `markPaymentFailed` only if still `pending` |
| Occupancy / former tenant | Yes | Checkout requires `occupancyIsCurrent`. Billing hides Pay now unless `occupancyAccess === "active"` |
| Partial pay | Partial | Tenant may pass `chargeIds`. Amount is **full remaining** of those charges. Allocation engine already supports partial amounts. No tenant-entered partial amount |
| Overpay | Partial | Checkout cannot overpay. Manual payment can; remainder becomes unapplied credit ledger entry |
| Payment method reuse | **No** | |
| Recurring automatic charge | **No** | |
| Card vs ACH | Dynamic | Checkout omits `payment_method_types`. ACH only if Stripe Dashboard enables it. Not promised |
| Stripe fees | **No** product rule | Stripe fees land on the receiving Stripe account |
| Refunds / disputes | Status enum only | `refunded` / `partially_refunded` exist. No `charge.refunded` / `charge.dispute.*` handlers |
| Reconciliation | Operational | FIN-OPS ledger + webhook event log. Not a bank-recon product |
| Connect table | Yes | `financial_connect_accounts` (S0). Production rows `not_started`. **No app onboarding.** Checkout uses the **platform** `STRIPE_SECRET_KEY` with no `stripeAccount` / destination |
| Admin charges | Yes | `POST /api/finance/charges` recurring (`rent` / `recurring_fee`) and one-time (`one_time` / `adjustment` / `credit`) |
| Lease rent defaults | Yes | `lease_agreements.rent_amount` + `rent_day_of_month`. Activation posts current-period rent via `createRecurringScheduleAndCharge` |
| Late-fee policy table | Yes | `financial_late_fee_policies` (flat / percent, grace days). **0 Production rows.** Collections API is M5-hard-stopped, including `policy` |
| Schedule runner | **No** | `financial_charge_schedules.next_run_on` is stored. Nothing posts the next period |
| `adjust_amount` | Unsafe | Can rewrite `financial_charges.amount` with **no status guard** |
| SaaS Checkout | Separate | Do not touch |

Authorization already in place (preserve): org isolation, PM SKU / `pm.financial_operations`, ADR-033 operating scope, `pm.finance:*`, tenant lease-self, former-tenant deny, service_role only after route auth, M3/M4 RLS, FIN-OPS write guard, webhook signature + pending-row-only apply.

FO-only orgs cannot collect rent (`orgSkuAllowsResidentialFinance` requires `pm.financial_operations`). Complete gets it only on the residential / PM surface. Mike (Complete + FACILITY) stays denied.

---

## 2. What is missing for real online rent payment

1. **Money destination.** Current Checkout would settle tenant funds on the **platform** Stripe account (same key family as SaaS). That commingles Domain A (SaaS $59/$59/$109) with Domain B (tenant/property payments). Forbidden for customer orgs.
2. **Connect onboarding** so a PM org can receive rent on its connected account (`financial_connect_accounts.status = ready`, `charges_enabled`).
3. **Checkout must charge the connected account** (direct charge via `stripeAccount`), not the platform balance.
4. **Recurring charge poster** so next month’s rent (and other recurring fees) become new FIN-OPS charges. Today only the period created at schedule/activation exists.
5. **Admin fee experience** that maps parking / pet / utilities / deposit / damage / other onto existing charge/schedule types without inventing amounts.
6. **Charge immutability:** refuse `adjust_amount` on paid / partially paid / void / written-off; changing a schedule amount must not rewrite posted charges.
7. **Manual late-fee charge** without opening M5 (API today cannot post `charge_type: late_fee`).
8. **Late-fee rule configuration** without collections automation (policy write is trapped behind the M5 collections route).
9. **Harden:** Stripe idempotency keys on Session create; expire/cancel abandoned `pending` rows; optional tenant partial amount; refund/dispute reversing entries.
10. **Marketing / legal update** only when execution can actually be true. Current Production FAQ and Privacy correctly deny live tenant card checkout.

Online pay does **not** require Stripe Subscriptions, SetupIntents, or a second ledger.

---

## 3. What is additionally missing for truthful “automatic rent collection”

These four modes are not equivalent:

| Mode | Meaning | Exists |
|------|---------|--------|
| 1. Online tenant payment | Tenant pays posted open charges in Checkout | Built; **off** |
| 2. Saved payment method | Tenant stores a method for later | **Missing** |
| 3. Scheduled payment | Tenant picks a future date to pay a posted amount | **Missing** (not required for launch) |
| 4. Recurring automatic rent payment | After **tenant consent**, Stripe charges a saved method for **already-posted** open charges | **Missing** |

**Automatic rent collection** = mode 4, plus the FIN-OPS schedule poster (so there is something to charge). It is not “admin typed a rent amount.”

Minimum safe mode 4:

- Tenant SetupIntent on the **connected** account.
- Explicit consent text, timestamp, actor, lease, method last-4 / type.
- Off-session PaymentIntent against **posted open / partially_paid charges only**.
- Same pending-payment → webhook → `applySucceededPayment` path.
- Tenant can revoke. Occupancy loss / move-out revokes. Admin cannot enroll a tenant.
- Failures notify tenant + staff. Do not retry into collections, delinquency, or late-fee assessment (M5).

Do **not** use Stripe Billing Subscriptions for rent. That would dual-write against `financial_charge_schedules`.

---

## 4. Recommended Stripe payment architecture

Keep Domain A and Domain B separate.

| Domain | Mechanism | Endpoint / secret | Objects |
|--------|-----------|-------------------|---------|
| **A. SaaS** | Existing Checkout + Subscriptions | `/api/commerce/webhooks/stripe` · `STRIPE_SAAS_WEBHOOK_SECRET` | SaaS Price IDs $59 / $59 / $109 |
| **B. Tenant / property** | Checkout `mode: payment` **on the connected account** | `/api/finance/webhooks/stripe` · `STRIPE_WEBHOOK_SECRET` (+ Connect events on this endpoint or a dedicated Connect secret) | `price_data` from FIN-OPS remaining balance |

**Use**

- **Checkout Sessions** for on-session tenant pay (already built).
- **SetupIntent** only for autopay enrollment (mode 4).
- **PaymentIntent** off-session only for consented autopay of posted charges.
- **Stripe Connect** (already approved in FIN-OPS-001; table exists) so rent lands on the PM connected account.

**Do not use**

- Stripe Subscriptions for tenant rent.
- SaaS Price IDs for tenant charges.
- Platform-account Checkout for customer orgs.
- July `autopay_enrollments` / `payment_methods`.
- Connect for vendor payouts in this package (out of scope).

**Stripe fees:** receiving connected account absorbs Stripe processing fees. M.P.A. does not invent a convenience fee. If a PM wants tenants to cover a fee, the admin posts that amount as a charge they set.

**Card vs ACH:** keep Dashboard dynamic methods. Marketing may say “pay online.” Do not claim ACH / bank until Dashboard-enabled and UAT-proven.

**Owner UAT exception (not the product):** a named UAT org may use platform-destination charges only if Owner explicitly accepts that funds hit the platform Stripe account and will be refunded. That exception is not a customer-launch architecture.

---

## 5. Exact tenant payment lifecycle

```
Admin posts or schedule-runner posts financial_charges (open)
    → Tenant Billing shows remaining balance
    → Occupying tenant (or staff with pm.finance:charge.write) POST /api/finance/checkout
    → Authz: occupancy / capability / residential SKU / Connect ready / execution flag
    → Insert financial_payments pending (amount = remaining of selected charges, or tenant partial ≤ remaining)
    → Checkout Session on connected account (idempotency key = payment id)
    → Tenant completes, cancels, or abandons
    → Webhook:
         checkout.session.completed → resolve pending row → applySucceededPayment
              allocations, charge status, ledger, receipt, notify, refresh financial_status
         expired / payment_failed / cancel → markPaymentFailed (pending only)
    → Tenant sees updated balance + receipt
```

Autopay variant (only if Slice D approved):

```
Posted open charges due
    → Enrollment active + occupancy current + Connect ready + execution flag
    → Insert pending financial_payments
    → Off-session PaymentIntent on connected account (customer + saved method)
    → Same webhook / apply path
```

Former tenants: read history; no Pay now; no autopay; no new Checkout.

---

## 6. Admin-controlled fee model

One configuration domain. Prefer lease + schedules + one-time charges. Do not add a parallel “fee catalog” product.

| Fee | Config | Posted as | Recurring? |
|-----|--------|-----------|------------|
| Monthly rent | `lease_agreements.rent_amount` + `rent_day_of_month` | `financial_charge_schedules` `rent` + generated `financial_charges` | Recurring (monthly) |
| Late fee | `financial_late_fee_policies` (flat or percent + grace) | Manual `financial_charges` `late_fee` only | Config only. **No auto-assess** |
| Parking | Admin label + amount + recurring/one-time | `recurring_fee` schedule **or** `one_time` | Either |
| Pet | Same | Same | Either |
| Utilities | Same | Same | Either |
| Deposit | Admin amount | `one_time` | One-time |
| Damage / repair | Admin amount | `one_time` | One-time |
| Other | Custom label + amount | `recurring_fee` or `one_time` | Where safe |

Rules:

- M.P.A. never fills amounts. Empty means “not charged,” not a platform default.
- Editing lease rent or a schedule amount updates **future** generated charges only.
- Posted / paid / assessed charges stay as written. Correct with void (open unpaid) or credit / new charge — not silent rewrite.
- `created_by` + finance audit already exist on charge/schedule create. Keep them. Add audit on schedule amount change and policy change.
- Finance desk today: “Generate this month’s rent” from `lease.rent_amount`, plus free-text one-time. Replace with the coherent defaults above; do not add a second settings app.

---

## 7. Existing schema that can be reused

- `lease_agreements` (`rent_amount`, `rent_day_of_month`, `currency`)
- `lease_residents` (occupancy, `financial_status`)
- `financial_charge_schedules`
- `financial_charges` (types already include `rent`, `recurring_fee`, `one_time`, `late_fee`, `credit`, `adjustment`)
- `financial_payments` / `financial_payment_allocations` / `financial_receipts` / `financial_ledger_entries`
- `financial_module_settings.stripe_payment_execution_enabled`
- `financial_connect_accounts`
- `financial_late_fee_policies`
- `financial_stripe_webhook_events`
- Finance events / audit / notifications

Do not reactivate `financial_delinquency_cases` or `financial_payment_arrangements`.

---

## 8. Minimum new schema / settings

| Object | Why |
|--------|-----|
| Unique `(schedule_id, period_start)` where `schedule_id` is not null | Idempotent schedule poster |
| Settings write for `financial_late_fee_policies` **outside** `/api/finance/collections` | Config without M5 |
| `createOneTimeCharge` allows `late_fee` | Manual late-fee post |
| `adjust_amount` status guard + audit | Stop silent rewrite |
| Connect onboarding fields already on `financial_connect_accounts` | Add Account Link / status sync only |
| **`financial_autopay_enrollments`** (FIN-OPS, new) | Slice D only: `organization_id`, `lease_id`, `resident_id`, `stripe_customer_id`, `stripe_payment_method_id`, `stripe_account_id`, `status` (`active` / `revoked` / `paused`), `consented_at`, `revoked_at`, `created_by` |
| Optional `financial_stripe_customers` | Slice D: one Customer per resident × connected account |

No July writes. No second ledger. No SaaS schema change.

---

## 9. Late-fee / M5 boundary

**M5 remains unauthorized.** `isFinanceM5Authorized()` stays `false`. `/api/finance/collections` stays hard-stopped for `assess_late_fees`, `sync_delinquency`, `reminder`, `arrangement`, and the current `policy` kind (move policy writes off that route).

Allowed:

- Configure a late-fee rule (amount or percent + grace).
- Manually post a `late_fee` charge the admin typed/approved.

Forbidden (still M5):

- Automatic late-fee assessment
- Delinquency marking / case automation
- Payment arrangements
- Collections campaigns / dunning beyond the existing staff rent reminder

`deriveResidentFinancialStatus` may still show `delinquent` as a **display** of past-due open balance. That is not M5 collections action.

---

## 10. Authorization / RLS / webhook model

Preserve current pipeline:

```
Auth → org → role → SKU entitlement → ADR-033 scope → pm.finance:* → action
```

| Actor | Online pay | Autopay enroll | Admin fees / Connect |
|-------|------------|----------------|----------------------|
| Occupying tenant | Own lease Checkout | Own lease only | No |
| Former / future occupant | Deny | Deny | No |
| Staff `pm.finance:charge.write` | May create Checkout for a lease | **Cannot** enroll tenant | Post charges / schedules |
| Staff `pm.finance:late_fee.manage` | No | No | Policy config + manual late-fee post |
| Staff `pm.finance:settings.manage` | No | No | Connect onboarding |
| FO-only / Mike FACILITY | Deny | Deny | Deny |
| Webhook | Signature + pending-row only | Same | `service_role` after verify |

Checkout and autopay: residential SKU + execution flag + Connect `ready` **before** service_role. Webhook never invents a payment (`resolveCheckoutSessionCompleted` pending-only). Do not mix finance and SaaS webhook secrets.

---

## 11. Failure / refund / dispute / idempotency

| Event | Behavior |
|-------|----------|
| Checkout create fails | Pending payment → `failed` (`checkout_create_failed`) |
| Tenant cancel / session expire / PI fail | `markPaymentFailed` if still pending. Charges unchanged |
| Duplicate webhook | Return ok; do not re-apply |
| Amount mismatch | Refuse apply |
| Abandoned pending (no webhook) | Treat as failed after Session expiry; do not allocate |
| Autopay decline | Fail pending; notify; do not assess late fee; do not open a collections case |
| Refund | New reversing ledger + payment `refunded` / `partially_refunded`. Do not rewrite original charge amounts. Re-open remaining on affected charges only by reducing `amount_paid` with audit |
| Dispute | Record dispute on the payment; do not auto-reverse until Stripe outcome; staff-visible. No M5 action |
| Stripe idempotency | Key Session / PaymentIntent / SetupIntent creates with `payment_id` / enrollment id |

---

## 12. Exact marketing wording that becomes truthful after implementation

### Production today (already truthful — keep until activation)

Live `www.my-property-assistant.com` FAQ:

> Charges, balances, payment history, vendor invoices, and owner summaries… **It does not include automated late fees, automated collections, or live tenant card checkout in this workspace.**

Privacy: Stripe “is not used here for tenant rent card collection.”

“Automatic billing” on pricing is **SaaS trial → subscription**, not tenant rent.

Internal module catalog still says “Resident billing & rent collection Command Center (S1)” — not a public claim. Finance desk “rent collection” is staff operations language, not Checkout.

### After Slice A–C + per-org execution on

Use only these claims:

- “Tenants can pay **posted** charges online with Stripe.”
- “Property Manager and Complete (residential / PM surface) can collect those payments.”
- “You set rent and fee amounts. M.P.A. does not invent them.”
- “Late fees can be configured and posted by you. They are not assessed automatically.”

Do **not** say: automatic rent collection, autopay, ACH, instant bank, saved cards, or “we collect rent for you” until Slice D is live.

### After Slice D + tenant consent live

Additional allowed claim:

- “Tenants can authorize automatic payment of **posted** rent and fees using a saved payment method. You cannot enroll them by setting rent.”

Still forbidden: automated late fees, delinquency / collections automation, Stripe Subscriptions for rent, FO-only rent collection.

Legal / FAQ / Privacy must flip in the **same release** as the first customer-facing execution flag. Do not advertise first.

---

## 13. Implementation slices

Implement only after Owner approval. One implement package may cover A–C; D is a separate Owner checkbox.

| Slice | Scope | Not in slice |
|-------|-------|----------------|
| **A. Admin fees + immutability** | Fee UX on existing lease/schedule/one-time; schedule amount edits = future only; `adjust_amount` guard; manual `late_fee`; policy settings route; schedule poster (idempotent) | M5, Stripe execution, Connect |
| **B. Connect onboarding** | Account Link + status sync on `financial_connect_accounts`; block execution unless `ready` | Vendor payouts, platform Checkout |
| **C. Online pay on Connect** | Point existing Checkout at connected account; webhook Connect events; idempotency keys; cancel/expire pending; optional partial amount; refund/dispute reverse; show Pay now only when flag + occupancy + Connect ready | Autopay, SaaS Checkout, flag flip |
| **D. Automatic collection** | FIN-OPS enrollment + SetupIntent + off-session PI + revoke | Stripe Subscriptions, M5, scheduled-for-later UI |
| **E. Copy** | FAQ, Privacy, in-app Pay now, module catalog honesty | Execution flag |

Production activation is **not** a code slice. See §15.

---

## 14. Required tests

- FO-only and Mike FACILITY: 403 on checkout, charges, Connect, autopay.
- Complete PROPERTY: allowed; FACILITY: denied.
- Occupying tenant: checkout allowed when flag + Connect ready; former/future: denied.
- Flag false: 403 `stripe_payment_execution_disabled`; Pay now hidden.
- Checkout without Connect `ready`: 403; no platform Session.
- Pending → completed webhook: allocation, receipt, ledger, balance; duplicate event no double apply.
- Expired / failed: pending → failed; charges unchanged.
- Amount mismatch: refuse.
- Partial amount ≤ remaining: allocate; over remaining: 400.
- Schedule poster: one charge per `(schedule_id, period_start)`; amount change does not rewrite posted rows.
- `adjust_amount` refused on paid / partial / void / written_off.
- Manual late_fee posts; `assess_late_fees` still `finance_m5_not_authorized`.
- Autopay (if D): no enroll without tenant consent; admin-set rent does not enroll; revoke + move-out stop charges; decline does not assess late fee.
- SaaS webhook fixture never hits FIN-OPS apply; finance webhook never touches SaaS subscriptions.
- Marketing tests: after E, FAQ no longer denies live checkout **only if** execution can be true; never claim autopay unless D shipped.
- No July table writes. No SaaS Price ID in tenant Checkout.

---

## 15. Production activation / UAT sequence

Do **not** run this sequence from this design record.

1. Owner approves this record (and whether Slice D is in the first implement).
2. Implement approved slices in-repo. Certify. **Do not** flip Production flags.
3. Deploy application **with execution still false** on every org.
4. Apply only the approved FIN-OPS migrations (unique period, optional autopay tables, policy route RLS). July stays frozen. Complimentary unchanged. SaaS Prices unchanged.
5. UAT org (SKU-entitled PM or Complete PROPERTY — not Canopy / PMX / Development): complete Connect until `ready`.
6. Admin sets rent / fees and confirms posted charges. Change a default; prove historical charges unchanged.
7. Occupying test tenant pays **one** posted charge on the connected account (Stripe test mode or Owner-approved live test card). Prove webhook → allocation → receipt → balance.
8. Cancel / fail path. Duplicate webhook. Former-tenant deny. FO-only deny.
9. If Slice D approved: tenant consent, one successful off-session charge, one decline, revoke.
10. Owner authorizes **per-org** `stripe_payment_execution_enabled = true` on the UAT org only.
11. Only after UAT pass: Owner authorizes copy slice E and then customer-org Connect + per-org flags. Never a global silent enable.

Refund the UAT live charge if a live card was used.

---

## Owner approval checklist

Owner approved 2026-08-17:

- [x] **Slices A–C + E** — real online tenant payment of posted charges
- [x] **Slice D** — tenant-authorized AutoPay of eligible posted recurring charges
- [x] Connect-on-connected-account is the money destination (platform Checkout forbidden for customer orgs)

AutoPay V1 pays only recurring rent and recurring fees marked AutoPay-eligible. One-time damage, deposit, ad-hoc, and adjustment charges are excluded.

---

## Classification

**APPROVED — IMPLEMENTED IN-REPO**

Production execution remains off. Stop before Production migration, Connect onboarding, flag enable, or a real tenant payment.
