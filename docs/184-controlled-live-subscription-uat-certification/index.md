# 184 — Controlled Live-Mode Subscription UAT Certification

**Title:** CONTROLLED LIVE-MODE SUBSCRIPTION UAT CERTIFICATION  
**Status:** **BLOCKED — SUBSCRIPTION UAT**  
**Date:** 2026-08-17  
**Authority:** Owner authorization to use a controlled live payment method after [docs/183](../183-final-controlled-subscription-uat-certification/index.md) · Production SHA `564aaf252615a595e0b08b6504eb2ce90ff1e8b6`  
**Constraint:** No Stripe simulator. No switch of Production to Stripe test mode. No real customer. No tenant Stripe execution. No M5. No July reopen. No Price/SKU change. Do not implement features.

---

## Verdict

**BLOCKED — SUBSCRIPTION UAT**

| Product | Result |
|---------|--------|
| PROPERTY MANAGER | **FAIL** |
| FACILITY OPERATIONS | **FAIL** (not started — stop after PM) |
| COMPLETE PLATFORM | **FAIL** (not started — stop after PM) |

Pre-payment inspection **matched the approved catalog**. Live Checkout for Property Manager shows **$0.00 due today**, then **$59.00 / month starting 2026-09-16**, 30-day trial, no tax, no extra unit blocks. Payment was **not** submitted.

This environment has **no Owner-controlled saved payment method** (no signed-in Stripe Link, Apple Pay, or Amazon Pay). Entering a card PAN in chat or inventing digits is not allowed. Test cards cannot complete `cs_live_` Checkout.

---

## Pre-payment inspection (mandatory)

Inspected the live Stripe-hosted Checkout for a fresh PM session (`cs_live_b1Vm…`) **before** any payment method was entered.

| Field | Live Checkout |
|-------|----------------|
| Product | Property Manager |
| Trial | 30 days free |
| Recurring | $59.00 per month starting September 16, 2026 |
| **Amount due TODAY** | **$0.00** |
| Tax / extra blocks | none shown |
| Payment method | required (card / wallets) to start trial |
| `STRIPE_SAAS_AUTOMATIC_TAX` | not present in Production env names → code leaves automatic tax **off** |
| Application wiring | `subscription_data.trial_period_days = 30` when units ≤ 500; `payment_method_collection = always` |

**Expected today:** $0.00 — payment method collected for future billing.  
**Expected later:** $59.00 on 2026-09-16, then monthly, until canceled.

This **matches** the approved PM catalog. Inspection did **not** require a STOP for unexpected immediate charge.

FO / Complete Checkout pages were **not** opened (no further live sessions after PM could not be paid). At 50 units the same trial rule applies in code (`trialPeriodDays = 30` when `managed_units ≤ 500`). Quote-only remains FO $59 / Complete $109 monthly, 0 extra blocks.

---

## What this package did not do

- Did not click Start trial
- Did not enter a card, bank, or wallet
- Did not create an organization, user, or subscription
- Did not send a claim email
- Did not cancel anything (nothing billed)
- Did not change Stripe Prices
- Did not touch Canopy, PMX, Development, or customer orgs

---

## 1. PM result

**FAIL** at payment method collection.

Reached: quote $59 / 0 blocks / 30-day trial; live Checkout UI confirms $0.00 today.  
Stopped: no Owner-controlled method available in this agent browser. Session left **unpaid**.

Claim, account, Guided Setup, Mission Control, and isolation were **not reached**.

---

## 2. FO result

**FAIL** — not started.

---

## 3. Complete result

**FAIL** — not started.

---

## 4. Stripe subscription / Price

No paid subscription. Catalog unchanged: PM $59 / FO $59 / Complete $109. No Price mutation.

---

## 5. Claim / email

Not reached. No new provisioning mail this turn.

---

## 6. Guided Setup

Not reached.

---

## 7. Entitlement / isolation

Not reached for a new purchaser. Existing organizations remain 21.

---

## 8. Post-test financial / security safety

July still frozen (`updated_at` `2026-08-16 07:52:09.009771+00`). Tenant Stripe execution still false (6/6). M5 still unauthorized. FIN-OPS charges 18 / 24708.16 and payments 11 / 11111 unchanged. No unrelated customer email.

---

## 9. UAT artifacts remaining

| Artifact | Status |
|----------|--------|
| Unpaid live Checkout `cs_live_b1Vm…` (and earlier abandoned `cs_live_b1mb…`) | Not paid; will expire. Full Checkout URLs are **not** published here. |
| New orgs / users / memberships | **0** |
| New Stripe customers / subscriptions | **0** |
| Claim emails | **0** |

No cancellation needed. No destructive SQL.

---

## 10. Blocker

**Amount due today is correct ($0.00). The blocker is that this agent cannot use the Owner’s live payment method without receiving card data, and no saved Link/wallet is signed in on the UAT browser.**

Exact next gate: Owner completes the three live Checkouts **in a browser where their controlled payment method already exists** (Link / wallet / their card), one product at a time, then a follow-up certifies claim → Guided Setup → isolation → supported cancel. Do not paste card numbers into chat. Do not build a simulator. Do not switch Production to test mode.

**STOP.**
