# 03 — Subscription Architecture

**Package:** COM-001  
**Status:** Draft — Awaiting Approval  
**Related:** BILL-001 catalog · AUTH-001 [26 Capability matrix](../109-auth-001-organization-provisioning-authentication/26-subscription-capability-matrix.md)

---

## Binding rule

**No feature should exist outside a subscription plan or an approved add-on.**

```
Plan / Add-on
  → Modules
  → Limits (AI, properties, units, users, storage)
  → Support tier
  → Marketplace access
  → Implementation options
  → Integrations
  → Future add-ons eligibility
```

COM-001 defines the **commercial catalog**. BILL-001 maps catalog → Stripe Products/Prices. AUTH-001 enforces visibility and limits at runtime.

---

## Plan codes (commercial)

| `plan_code` | Audience | Org types | Notes |
|-------------|----------|-----------|-------|
| `trial` | New evaluators | PM or Owner (SKU) | Time-boxed; converts or cancels |
| `founder` | Invite-only early customers | PM or Owner | Master Admin grant + audit |
| `professional` | SMB operators | PM or Owner | Default paid |
| `business` | Growing portfolios | PM or Owner | Higher limits + priority support |
| `enterprise` | Large / custom | All Approved types | Sales-assisted; custom caps |

Dollar amounts are commercial ops (Stripe), not fixed in this architecture doc.

---

## Dimension definitions

| Dimension | Meaning |
|-----------|---------|
| **Modules** | Product capability areas enabled |
| **AI limits** | Copilot / onboarding AI quota (period) |
| **Property limits** | Max properties |
| **Unit limits** | Max units |
| **User limits** | Max seats (principals with login) |
| **Storage** | Document/media quota |
| **Support tier** | Response / channel expectations |
| **Marketplace access** | Vendor marketplace on/off / tier |
| **Implementation options** | Professional and/or AI Guided eligible |
| **Integrations** | Allowed connectors (Stripe Connect, screening, e-sign, etc.) |
| **Future add-ons** | Which SKUs can attach |

---

## Plan matrix (design defaults)

Numeric caps are **illustrative defaults** for architecture; Product sets final numbers at Approve / commercial ops without redesigning the dimensions.

| Dimension | Trial | Founder | Professional | Business | Enterprise |
|-----------|-------|---------|--------------|----------|------------|
| **Modules** | Core ops subset | Full core | Full core | Full core + advanced | Custom / all |
| **AI limits** | Limited | Elevated | Standard | Elevated | Custom |
| **Properties** | Low (e.g. 3) | Mid | Mid | High | Custom |
| **Units** | Low | Mid | Mid | High | Custom |
| **Users** | Low (e.g. 5) | Mid | Mid | High | Custom |
| **Storage** | Low | Mid | Mid | High | Custom |
| **Support tier** | Standard | Priority | Standard | Priority | Dedicated / custom |
| **Marketplace** | Off or limited | On | On | On | On |
| **Implementation** | AI Guided (default); Professional optional if sold | Both | Both | Both | Both (+ managed) |
| **Integrations** | Core set | Core + early | Core | Core + advanced | Custom |
| **Add-ons eligible** | Convert-to-paid first | Yes | Yes | Yes | Yes |

### Module catalog (illustrative)

| Module | Typical plans |
|--------|----------------|
| Properties & Units | All |
| Leasing | Pro+ |
| Maintenance / Work Orders | All paid |
| Financials / Statements | Pro+ |
| Documents / Vault | All paid |
| Messaging / Notifications | All paid |
| Owner Portal | Pro+ (PM orgs) |
| Vendor Marketplace | Pro+ |
| AI Copilot | Per AI limits |
| Screening | Add-on or Business+ |
| E-Sign | Add-on or Business+ |
| Advanced Reporting | Business+ |

Exact module↔plan cells are commercial configuration; the invariant is **no orphan features**.

---

## Add-ons (future-ready)

| Add-on examples | Effect |
|-----------------|--------|
| Extra seats pack | +user limit |
| Extra property pack | +property/unit limits |
| AI boost | +AI quota |
| Screening pack | Enable screening module |
| E-Sign pack | Enable e-sign module |
| Premium support | Upgrade support tier |
| Professional Implementation (one-time) | Services SKU, not SaaS feature |

Add-ons attach to an active subscription; never create a parallel entitlement plane.

---

## Implementation options per plan

| Option | Availability |
|--------|--------------|
| **AI Guided Setup** | All plans (default for Trial/Pro) |
| **Professional Implementation** | Sold as service / included on Enterprise or as add-on |

Customer must choose one primary path at Setup Wizard (AUTH-001); COM-001 owns commercial expectations ([05](./05-implementation-workflows.md)).

---

## Entitlement enforcement chain

```
COM-001 plan definition
  → BILL-001 subscription binding
    → AUTH-001 capability matrix enforcement
      → UI shows only entitled modules
```

---

## Acceptance (subscription)

| ID | Criterion |
|----|-----------|
| SUB-01 | Every module maps to at least one plan or add-on |
| SUB-02 | Limits dimensions cover AI, properties, units, users, storage |
| SUB-03 | Support tier and marketplace are plan-defined |
| SUB-04 | No product feature ships “global free” outside catalog without Approve |
