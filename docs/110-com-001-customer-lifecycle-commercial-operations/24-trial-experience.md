# 24 — Trial Experience

**Package:** COM-001  
**Amendment:** A05  
**Status:** Binding (Approved with Amendments)  
**Related:** [04 Billing state machine](./04-billing-state-machine.md) · [03 Subscription architecture](./03-subscription-architecture.md)

---

## Purpose

The Trial experience must **naturally lead** evaluators toward becoming paying customers — with clear limits, reminders, and an upgrade path — without open registration (AUTH-001 invitation-only / COM purchase path).

Trials still require COM-001 Payment Successful / activation (including $0 trial Checkout) before Organization Created.

---

## Trial length

| Setting | Design default |
|---------|----------------|
| **Duration** | **14 days** ([15](./15-open-questions.md) Q1) |
| **Clock start** | Organization Created / first Org Admin access (choose one at Implement; default **Payment Successful timestamp**) |
| **Extensions** | CS/Master Admin audited only |

---

## Available features (Trial)

Aligned to `trial` plan matrix ([03](./03-subscription-architecture.md)):

| Area | Trial |
|------|-------|
| Core property/unit ops | Limited counts |
| Maintenance / messaging | On (limited) |
| AI | Limited quota |
| Owner portal | Limited / preview |
| Marketplace | Off or limited |
| Screening / E-Sign | Typically off (add-on) |
| Seats / properties / units / storage | Low caps |

---

## Disabled / restricted features

| Restriction | Behavior |
|-------------|----------|
| Over-limit creates | Blocked with upgrade CTA |
| Enterprise-only modules | Hidden (not teaser-enabled) |
| Production watermarks | See below |
| Priority support | Standard only |

---

## Watermarks

| Surface | Design default |
|---------|----------------|
| Exports / PDFs | Optional “M.P.A. Trial” watermark |
| Public-facing resident pages | No embarrassing watermark; prefer soft “Trial” badge in PM UI only |
| Email footers | Optional trial notice on system emails |

Watermark policy must not break tenant trust surfaces.

---

## Reminders & conversion prompts

| Timing | Message intent |
|--------|----------------|
| Day 0 | Welcome + setup CTA |
| Day 3 | Implementation progress nudge |
| Day 7 | Value + upgrade benefits |
| T-3 / T-1 | Trial ending; upgrade CTA |
| Expiry day | Convert or enter grace |

In-app upgrade prompts respect entitlement rules and Feature Discovery ([20](./20-feature-discovery.md)).

---

## Trial expiration

| Outcome | Path |
|---------|------|
| Converted (payment method + paid plan) | Billing **Active**; health/success motions continue |
| Not converted | Enter **Trial Grace** then Cancelled path |

---

## Trial grace period

| Setting | Design default |
|---------|----------------|
| **Length** | **3 days** read/billing-focused access after expiry |
| **Login** | Allowed for Org Admin to upgrade |
| **Features** | Heavily restricted (view + billing portal) |
| **End** | Cancelled → retention/offboarding ([21](./21-customer-offboarding.md)) |

Distinct from paid Past Due Grace ([04](./04-billing-state-machine.md)).

---

## Upgrade flow

```
Trial Active
  → Upgrade CTA (plan picker)
  → BILL-001 Checkout / attach payment method
  → Paid plan Active
  → Entitlements expand
  → Implementation score / discovery continue
```

No new Organization is created on upgrade of the same trial workspace.

---

## Acceptance (A05)

| ID | Criterion |
|----|-----------|
| TR-01 | Length, features, disabled set, watermarks documented |
| TR-02 | Reminder + conversion sequence defined |
| TR-03 | Expiration + trial grace + upgrade flow defined |
| TR-04 | Trial still originates from COM activation (no open signup) |
