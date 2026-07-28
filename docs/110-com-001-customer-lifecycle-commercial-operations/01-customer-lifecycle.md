# 01 — Customer Lifecycle

**Package:** COM-001  
**Status:** ✅ Approved with Amendments · Implement 🔒 Locked

**Sales CRM expansion:** [17 — Sales pipeline](./17-sales-pipeline.md) (MQL/SQL/Discovery/Negotiation/Won + tracking fields).

---

## Spine

```
Lead
  → Qualified Prospect
  → Demo Scheduled
  → Proposal Sent
  → Subscription Purchased
  → Payment Successful
  → Organization Created
  → Organization Administrator Provisioned
  → Setup Wizard
  → Active Customer
  → Expansion
  → Renewal
  → Suspended
  → Cancelled
  → Archived
```

`Past Due` / `Grace Period` are **billing substates** that may interrupt Active → Suspended (see [04](./04-billing-state-machine.md)). They are not skipped stages; they overlay Active.

---

## Stage catalog

### 1) Lead

| Dimension | Definition |
|-----------|------------|
| **Entry** | Inbound form, referral, event, outbound reply, or partner intro captured |
| **Exit** | Qualified **or** Disqualified / Nurture |
| **Allowed actions** | Capture contact, source, company size, portfolio size, notes; assign owner |
| **Notifications** | Sales acknowledgment (optional); internal lead alert |
| **Billing** | None |
| **Support ownership** | Sales (pre-customer); L0 AI may answer public FAQ only |

### 2) Qualified Prospect

| Dimension | Definition |
|-----------|------------|
| **Entry** | ICP fit + budget/authority/need/timing signals met |
| **Exit** | Demo scheduled **or** nurture / disqualify |
| **Allowed actions** | Discovery call, needs notes, plan hypothesis, competitor notes |
| **Notifications** | Prospect confirmation; AE reminder |
| **Billing** | None |
| **Support ownership** | Sales |

### 3) Demo Scheduled

| Dimension | Definition |
|-----------|------------|
| **Entry** | Calendar hold confirmed |
| **Exit** | Demo completed → Proposal path **or** no-show / reschedule / lose |
| **Allowed actions** | Send agenda, prep environment (demo org ≠ customer org), run demo |
| **Notifications** | Calendar invites, reminders, no-show follow-up |
| **Billing** | None |
| **Support ownership** | Sales; Solutions may assist |

### 4) Proposal Sent

| Dimension | Definition |
|-----------|------------|
| **Entry** | Written proposal / quote with plan, term, price, implementation option |
| **Exit** | Accepted (checkout started) **or** revised **or** lost |
| **Allowed actions** | Send proposal, negotiate within guardrails, attach MSA/order form |
| **Notifications** | Proposal email; expiry reminder |
| **Billing** | Quote only; no charge |
| **Support ownership** | Sales + Finance (pricing exceptions) |

### 5) Subscription Purchased

| Dimension | Definition |
|-----------|------------|
| **Entry** | Buyer starts Checkout / signs order that triggers Checkout |
| **Exit** | Payment Successful **or** Abandoned / Failed |
| **Allowed actions** | Collect payment method; select plan/term; apply approved coupon |
| **Notifications** | Checkout started (internal); failure recovery |
| **Billing** | BILL-001 Checkout in progress (`Pending Payment`) |
| **Support ownership** | Sales → Billing handoff begins |

### 6) Payment Successful

| Dimension | Definition |
|-----------|------------|
| **Entry** | Stripe confirms paid / subscription active or trialing (BILL-001) |
| **Exit** | Commercial activation event emitted to provisioning |
| **Allowed actions** | Record `customer_id`, `subscription_id`, plan, term; idempotent activate |
| **Notifications** | Payment receipt; internal “new customer” alert |
| **Billing** | `Trial` or `Active` subscription binding |
| **Support ownership** | Billing confirms → Auth/Provisioning owns next |

**This is the hard handoff into AUTH-001.** No Org Admin exists before this (except audited Master Admin foreshadow create, discouraged).

### 7) Organization Created

| Dimension | Definition |
|-----------|------------|
| **Entry** | AUTH-001 provisioning saga starts from activation event |
| **Exit** | Organization record exists in **Pending Setup** (AUTH-001 [28](../109-auth-001-organization-provisioning-authentication/28-organization-status-lifecycle.md)) |
| **Allowed actions** | Bind plan/modules/limits; set org type from SKU |
| **Notifications** | Internal provision success/fail |
| **Billing** | Unchanged; org linked to SaaS customer |
| **Support ownership** | Platform / Technical (provisioning failures) |

### 8) Organization Administrator Provisioned

| Dimension | Definition |
|-----------|------------|
| **Entry** | Username + temp credential issued |
| **Exit** | Welcome email sent (or queued with ops visibility) |
| **Allowed actions** | Issue credentials; never show password in admin UI |
| **Notifications** | Welcome email (username + temp password channel) |
| **Billing** | Unchanged |
| **Support ownership** | If email fails: Technical + CS; Org Admin lockout later uses AUTH recovery |

### 9) Setup Wizard

| Dimension | Definition |
|-----------|------------|
| **Entry** | Org Admin completes first-login hardening |
| **Exit** | Finish Setup → **Active Customer** |
| **Allowed actions** | Choose Professional **or** AI Guided; complete checklist ([05](./05-implementation-workflows.md)) |
| **Notifications** | Setup nudges; incomplete wizard alerts |
| **Billing** | Trial/Active clock may run during setup |
| **Support ownership** | Implementation / CS; AI L0 for guided path |

### 10) Active Customer

| Dimension | Definition |
|-----------|------------|
| **Entry** | Wizard Finish; org commercially Active |
| **Exit** | Expansion, Renewal cycle, Past Due path, Suspended, or Cancelled |
| **Allowed actions** | Full entitled product use; invite users; manage billing portal |
| **Notifications** | Product + success motions ([06](./06-customer-success-model.md)) |
| **Billing** | `Active` (or Trial converting) |
| **Support ownership** | CS primary; Technical for defects |

### 11) Expansion

| Dimension | Definition |
|-----------|------------|
| **Entry** | Upgrade plan, add-on, or seat/property limit increase |
| **Exit** | Entitlements updated; back to Active Customer posture |
| **Allowed actions** | Quote expansion; Checkout/portal upgrade; Master Admin grant (audited) |
| **Notifications** | Expansion confirmation; usage congratulations |
| **Billing** | Proration per BILL-001 |
| **Support ownership** | CS / Sales assist |

### 12) Renewal

| Dimension | Definition |
|-----------|------------|
| **Entry** | Approaching term end / renewal window ([07](./07-renewal-workflows.md)) |
| **Exit** | Renewed Active **or** Cancelled path |
| **Allowed actions** | Renewal reminder, QBR, renegotiate, auto-renew |
| **Notifications** | T-90 / T-30 / T-7 renewal sequence |
| **Billing** | Renewal invoice / auto-charge |
| **Support ownership** | CS + Renewals |

### 13) Suspended

| Dimension | Definition |
|-----------|------------|
| **Entry** | Compliance hold, abuse, or dunning exhaustion policy |
| **Exit** | Reactivated Active **or** Cancelled |
| **Allowed actions** | Level 4 Master Admin suspend/reactivate; no day-to-day tenant use |
| **Notifications** | Suspension notice to Org Admin + recovery contact |
| **Billing** | May pause or continue per reason ([04](./04-billing-state-machine.md)) |
| **Support ownership** | CS + Technical + Master Admin |

### 14) Cancelled

| Dimension | Definition |
|-----------|------------|
| **Entry** | Customer cancels or non-renewal / policy cancel ([08](./08-cancellation-workflows.md)) |
| **Exit** | Archived after retention window **or** Reactivated |
| **Allowed actions** | Export window; disable operational use |
| **Notifications** | Cancellation confirm; export deadline |
| **Billing** | `Cancelled` / no further charges except owed |
| **Support ownership** | CS (exit interview); Billing for refunds |

### 15) Archived

| Dimension | Definition |
|-----------|------------|
| **Entry** | Retention elapsed post-cancel |
| **Exit** | Rare legal restore only |
| **Allowed actions** | Tombstone; username/org ids retained for non-reuse where AUTH requires |
| **Notifications** | None (except legal) |
| **Billing** | Historical invoices retained |
| **Support ownership** | Master Admin / Legal |

---

## Mapping to AUTH-001 org status

| COM-001 stage | AUTH-001 org status (approx.) |
|---------------|-------------------------------|
| Lead … Proposal Sent | Prospect (no org) |
| Payment Successful → Org Admin Provisioned | Pending Setup (creating) |
| Setup Wizard | Pending Setup |
| Active Customer / Expansion / Renewal | Active |
| Suspended | Suspended |
| (billing) Past Due / Grace | Past Due overlay on Active |
| Cancelled | Cancelled |
| Archived | Archived |

---

## Non-goals

- Treating demo environments as customer organizations  
- Creating Org Admins before Payment Successful (except audited exception)  
- Sales manually creating day-to-day users (AUTH-001 ownership)
