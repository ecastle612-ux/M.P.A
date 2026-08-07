# COM-002 — Product Vision & Scope

**Parent:** [COM-002 Index](./index.md)  
**Status:** Draft  

---

## Vision

A prospective customer can discover M.P.A., try a live interactive demo, subscribe online, and land in Mission Control — without waiting for a human — for Professional and Business plans.

Enterprise buyers receive a premium high-touch path: consultation, proposal, contract, and implementation.

The purchasing experience must feel comparable to HubSpot, Monday.com, Shopify, Slack, Notion, Stripe, and Linear: professional, minimal, fast, clear, premium.

---

## Problem (today)

| Gap | Current state |
|-----|----------------|
| Public funnel | Choose modules → Confirm Plan → account (BUG-003/004) |
| Payment | White-glove — no SaaS Stripe Checkout |
| Org / SKU | Org create provisions Property Manager; FO/Complete activated manually |
| Scale | Cannot support thousands of orgs without operator involvement |

---

## Goals

1. Fully automated self-service for Professional and Business.
2. Secure Stripe Checkout for SaaS subscriptions (platform billing).
3. Automatic organization provisioning and module activation after payment.
4. Isolated Live Demo for each commercial product — no account, no payment.
5. Clear Enterprise divergence (human sales → production).
6. Preserve three commercial products (ADR-015) and FIN-OPS SaaS boundary (ADR-016).

---

## Non-goals (this package)

| Out of scope | Why |
|--------------|-----|
| Capital Projects productization | Separate gate |
| Facility Operations feature depth | Separate FO design/implement gate |
| Resident rent Stripe Checkout / Connect | FIN-OPS-001 — different Stripe mode/account pattern |
| Full ERP / GL | Permanent out of scope |
| Native mobile commerce | Future package |
| Marketplace seller billing | Future package |
| Dollar amounts / public price lists in this Draft | Pricing tables finalized at Approve (placeholders allowed in design) |

---

## In scope

- Commercial model: Product × Plan × Billing cycle  
- Self-service journey and Enterprise journey  
- Live Demo architecture  
- SaaS Stripe architecture (design only)  
- Automation and provisioning  
- Failure recovery and security  
- Acceptance, slices, Master Admin testing, certification, risks  

---

## Success definition

| Audience | Success |
|----------|---------|
| Professional / Business buyer | Pays online → Mission Control same day without employee interaction |
| Enterprise buyer | Clear Request Enterprise path; never forced through self-serve Checkout |
| Demo visitor | Interactive product experience in minutes; clear path to subscribe |
| Platform ops | Near-zero manual provisioning for Pro/Business; auditability via Master Admin |
| Engineering | Slice-gated implementation with independent tests |

---

## Design principles

1. **Automate by default** — humans only for Enterprise and exceptional support.  
2. **Fail closed** — unpaid or failed subscription never unlocks entitled modules.  
3. **Separate money domains** — SaaS plan billing ≠ resident rent collection.  
4. **Demo ≠ production** — hard isolation; never create real customer orgs from demo.  
5. **Premium clarity** — one primary CTA per step; no internal jargon.  
6. **Idempotent provisioning** — webhooks and retries safe to replay.  
