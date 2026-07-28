# 16 — Acceptance Criteria

**Package:** ACQ-001  
**Status:** Draft — Ready for Approval

---

## Public experience

| ID | Criterion |
|----|-----------|
| AC-01 | Landing presents brand-first hero + primary CTAs to Tour and Pricing |
| AC-02 | Product tour is ≤ 6 steps, skippable, keyboard accessible |
| AC-03 | Pricing shows Trial, Professional, Business with Checkout CTAs |
| AC-04 | Enterprise shows Contact Sales / Schedule Demo only — no Checkout |
| AC-05 | Plan comparison reflects capability matrix limits/modules |
| AC-06 | FAQ covers trial, post-pay, invites, upgrade, cancel, rent vs SaaS separation |

## Checkout & money

| ID | Criterion |
|----|-----------|
| AC-10 | Checkout entry uses BILL-001 session APIs only |
| AC-11 | `enterprise` and `founder` rejected for public self-serve Checkout |
| AC-12 | Successful payment triggers org provision without staff |
| AC-13 | Failed / canceled / expired Checkout creates **no** organization |
| AC-14 | One open subscription per org invariant preserved |

## Provision & auth

| ID | Criterion |
|----|-----------|
| AC-20 | Org Admin provisioned with MPA username + welcome delivery |
| AC-21 | No public free `/signup` org creation |
| AC-22 | Team users remain invitation-only |
| AC-23 | First-login and verify-contact gates work on self-serve orgs |
| AC-24 | Existing email creates correct multi-org or documented conflict behavior |

## Setup & product

| ID | Criterion |
|----|-----------|
| AC-30 | Post-login incomplete setup routes to Guided Setup |
| AC-31 | Finish Setup + activation required before “ready” |
| AC-32 | Dashboard available after Active |
| AC-33 | Purchased modules visible; non-purchased hidden/gated |
| AC-34 | Seat/property limits enforced on create |

## Lifecycle & recovery

| ID | Criterion |
|----|-----------|
| AC-40 | Success page handles provisioning / ready / delayed / failed |
| AC-41 | Canceled page offers resume to pricing |
| AC-42 | Browser refresh during setup does not lose durable progress |
| AC-43 | Upgrade / downgrade / cancel remain via Billing / Portal |

## Quality

| ID | Criterion |
|----|-----------|
| AC-50 | Public acquire pages meet a11y AA targets for critical paths |
| AC-51 | Mobile-usable pricing and tour |
| AC-52 | Success/cancel/error are noindex |
| AC-53 | Funnel analytics events emitted without secrets |
| AC-54 | Audit events exist for checkout, provision, activation |
