# COM-002 — Implementation Slices

**Parent:** [COM-002 Index](./index.md)  
**Status:** Approved  
**Rule:** Each slice requires its own **Approve/Authorize Implement** after COM-002 package Approve.  

---

## Slice overview

| Slice | Name | Independently testable outcome |
|-------|------|--------------------------------|
| **A** | Commercial foundation | Catalog offers (PM self-serve + Enterprise flags), limits 5/25 & 25/150, FO-READY flag false |
| **B** | Demo platform | Snapshot + overlay demos; separate DB; honesty banners; caps |
| **C** | Stripe Checkout | Hosted Checkout for **PM** Pro/Business only; dedicated SaaS webhooks |
| **D** | Automatic provisioning | Checkpoint provisioner + identity bind; no access before verify |
| **E** | Subscription lifecycle | Upgrade/downgrade/cancel/reactivate/dunning/SCA/dispute |
| **F** | Customer portal | Portal + in-app Billing (no Portal plan switching) |
| **G** | Commercial certification | Full cert per amended certification plan |

---

## Slice A — Commercial foundation

**Authorize status:** **AUTHORIZED / IMPLEMENTED** (2026-08-07) — see [39 Slice A](../39-com-002-slice-a/index.md).  

**Includes:** CatalogOffer model, Product × Plan × Cycle resolution, limit fields, admin read models, migrate interim Confirm Plan to read new catalog (without charging).  
**Excludes:** Stripe charges, demo runtime, provisioning.  
**Exit:** Unit/integration tests for offer resolution; no payment.

---

## Slice B — Demo platform

**Authorize status:** **AUTHORIZED / IMPLEMENTED** (2026-08-07) — see [40 Slice B](../40-com-002-slice-b/index.md).  

**Includes:** Demo session service, snapshots, role switch, reset, expiry, analytics events, conversion deep links.  
**Excludes:** Paid Checkout.  
**Exit:** Manual + automated demo smoke per product; isolation test proves no production DB access.

---

## Slice C — Stripe Checkout

**Authorize status:** **AUTHORIZED / IMPLEMENTED** (2026-08-08) — see [41 Slice C](../41-com-002-slice-c/index.md).  

**Includes:** Stripe Products/Prices setup runbook, Checkout Session API, success/cancel pages, webhook skeleton (persist events).  
**Excludes:** Full org provisioning (may create pending subscription row only).  
**Exit:** Test mode Checkout completes; webhook signature verified; FIN-OPS webhooks still green.

---

## Slice D — Automatic provisioning

**Authorize status:** **AUTHORIZED / IMPLEMENTED** (2026-08-08) — see [42 Slice D](../42-com-002-slice-d/index.md).  

**Includes:** Provisioning orchestrator, org create, entitlement grant matching offer, account bind, welcome email, Guided Setup handoff copy.  
**Excludes:** Lifecycle upgrades (basic active/trialing only).  
**Exit:** Test mode pay → Mission Control path without Master Admin SKU assign.

---

## Slice E — Subscription lifecycle

**Includes:** Upgrade/downgrade UX, proration, cancel-at-period-end, reactivate, past_due grace enforcement, trial ending emails.  
**Exit:** Matrix tests for status transitions; entitlement fail closed verified.

---

## Slice F — Customer portal

**Includes:** Portal configuration, Billing & Plan UI, invoice/receipt links, payment method update path.  
**Exit:** Customer can self-serve billing tasks without support.

---

## Slice G — Commercial certification

**Includes:** Full journey certification, Master Admin testing pack, risk residual review, production runbook, retire/replace Confirm Plan white-glove path for Pro/Business.  
**Exit:** [Certification](./certification.md) signed Pass.

---

## Suggested sequence

```
A → B (parallelizable after A catalog IDs)
A → C → D → E → F → G
```

B may proceed in parallel with C/D once A defines product keys for demo conversion.

---

## Forbidden across all slices until authorized

- Capital Projects  
- FO feature invention beyond commercial activation  
- Merging SaaS billing into FIN-OPS rent Checkout codepaths without explicit boundary review  
