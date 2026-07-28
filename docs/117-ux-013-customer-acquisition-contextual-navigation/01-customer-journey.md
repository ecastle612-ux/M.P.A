# 01 — Customer Journey

**Package:** UX-013  
**Status:** Draft — Ready for Approval  
**Amends:** [ACQ-001 §02](../115-acq-001-self-service-customer-acquisition/02-customer-journey.md) via [A11](../115-acq-001-self-service-customer-acquisition/28-amendment-a11-modules-first-trial-messaging.md)

---

## Primary journey (self-serve — proposed)

| Step | Surface | Outcome |
|------|---------|---------|
| 1 | Landing page | Understand value; CTA to Tour or **Choose modules** / See pricing |
| 2 | Interactive product tour (optional) | See core workflows; CTA to module selection |
| 3 | **Module selection** | Choose Property Ops / Facility Ops / Both |
| 4 | Pricing & plan comparison | Compare Professional / Business for selected modules; Enterprise = Contact Sales |
| 5 | Select plan | Interval (monthly/annual) + `plan_code` (`professional` \| `business`) |
| 6 | Checkout entry | Stripe Checkout Session (BILL-001) with buyer + **module selection** metadata |
| 7 | Stripe Checkout | Payment hosted by Stripe (**no** public Trial Checkout entry) |
| 8 | Payment success return | `/acquire/success` — waiting / ready state |
| 9 | Automatic provisioning | COM activation + AUTH org + Org Admin (existing) |
| 10 | Credential delivery | Welcome email with username + first-login link |
| 11 | Email verification | If required by AUTH — complete before ops |
| 12 | First login / Welcome | Password change / first-login gates |
| 13 | Guided Setup | Same SetupGate path as today — **no trial-specific fork** |
| 14 | Organization activation | `commercial_status=active` (existing Finish Setup) |
| 15 | Production dashboard | Contextual nav for role; entitled modules only |

Enterprise: Landing / modules or Pricing → **Contact Sales** / **Schedule Demo** → COM-001 sales pipeline (unchanged).

---

## Explicit removals from public journey

| Removed | Replacement |
|---------|-------------|
| Standalone **Start free trial** / Trial plan card | Primary CTAs: **Choose modules** / **See pricing** / **Contact sales** |
| Public Sign Up / pre-payment registration | Still forbidden — purchase-triggered provision only |
| Pricing-before-modules as the default path | Module selection is the default step before plan cards |

Deep links to `/pricing` may still open pricing, but must either (a) require module context (query/session) or (b) insert module selection before Checkout entry. Exact UX: see [05 — Open questions](./05-open-questions.md) OQ-03.

---

## Alternate paths

### A — Payment failure

Stripe declines → retry Checkout with same plan + module selection → no org created.

### B — Checkout cancellation

`/acquire/canceled` → resume to pricing (or module selection if context missing) with prior choices restored when possible.

### C — Abandoned Checkout

No org; same ACQ-001 V1.0 rule (no abandoned-cart email unless later amended).

### D — Resume onboarding (post-payment)

Org exists, Setup incomplete → login → SetupGate / `/setup` until Finish Setup → dashboard. **No separate “trial onboarding” track.**

### E — Enterprise intent

Contact Sales / Schedule Demo → COM opportunity — **no** self-serve Checkout.

### F — Existing subscription

Public Checkout must not create a second open SaaS subscription for the same org / Stripe customer (BILL one-sub invariant). Prefer login → Settings → Subscription.

---

## Timeboxes (design targets)

| Milestone | Target |
|-----------|--------|
| Landing → Module selection | ≤ 3 minutes typical |
| Modules → Pricing | ≤ 1 click after choice |
| Pricing → Checkout start | ≤ 2 clicks after plan chosen |
| Payment success → credentials email | ≤ 2 minutes (p95) |
| First login → Active dashboard | Same session when Setup minimal path chosen |

---

## Happy-path diagram

```
Visitor → Landing → [Tour?] → Module selection
  → Pricing (Pro / Business) → Stripe Checkout → Payment Success
  → Automatic Organization Provisioning → Org Admin Account
  → Welcome / First Login → Guided Setup → Activation → Dashboard
```

---

## States the customer perceives

| Perceived state | Meaning |
|-----------------|---------|
| Exploring | Public pages + tour |
| Choosing modules | Property / Facility / Both |
| Choosing plan | Pricing |
| Checking out | Stripe hosted |
| Activating workspace | Provision in progress |
| Welcome / first login | Credential gate |
| Setting up | Guided Setup |
| Ready | Active + contextual dashboard |
